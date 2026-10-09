import { requirePermission, type IAuthorizationClient } from "@pine/authorization";
import { ITEM_PRIORITY } from "@pine/common";
import { createCloudEvent, ItemCreatedEvent, ItemUpdatedEvent } from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { DbClient } from "@/db";
import type { ChecklistCounts, IChecklistRepository } from "@/features/checklists/repositories";
import {
  ItemNotFoundError,
  ItemReorderError,
  ListItemsValidationError,
} from "@/features/item/errors";
import type { IItemRepository } from "@/features/item/repositories";
import {
  clampListItemsFirst,
  decodeItemListCursor,
  encodeItemListCursor,
} from "@/features/item/utils";
import { StatusNotFoundError } from "@/features/item-statuses/errors";
import type { IStatusRepository } from "@/features/item-statuses/repositories";
import type {
  CreateItemOptions,
  DeleteItemOptions,
  GetItemOptions,
  IItemService,
  ItemGroupPageInfo,
  ItemListItem,
  ItemStatusGroup,
  ListItemsOptions,
  ReorderListItemsOptions,
  UpdateItemOptions,
} from "./IItemService";

export type ItemDatabase = {
  transaction: <T>(callback: (tx: DbClient) => Promise<T>) => Promise<T>;
};

@injectable()
export class ItemService implements IItemService {
  constructor(
    @inject(TYPES.Database)
    private readonly db: ItemDatabase,
    @inject(TYPES.ItemRepository)
    private readonly itemRepository: IItemRepository,
    @inject(TYPES.StatusRepository)
    private readonly statusRepository: IStatusRepository,
    @inject(TYPES.ChecklistRepository)
    private readonly checklistRepository: IChecklistRepository,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
  ) {}

  async create(options: CreateItemOptions) {
    const { identityId, parentItemId, estimate, component, statusId, priority, ...input } = options;

    await requirePermission(
      this.authorizationClient,
      identityId,
      "create_item",
      `List:${input.listId}`,
    );

    return this.db.transaction(async (tx) => {
      let resolvedStatusId = statusId ?? "";
      if (parentItemId) {
        const parentItem = await this.itemRepository.findById(parentItemId, { tx });
        if (!parentItem) {
          throw new ItemNotFoundError("Parent not found");
        }
        if (!resolvedStatusId) {
          resolvedStatusId = parentItem.statusId;
        }
      }

      const maxOrderIndex = await this.itemRepository.findMaxOrderIndex(
        {
          listId: input.listId,
          statusId: resolvedStatusId,
          parentItemId: parentItemId ?? null,
        },
        { tx },
      );
      const orderIndex = maxOrderIndex === null ? 0 : maxOrderIndex + 1;

      const item = await this.itemRepository.save(
        {
          ...input,
          statusId: resolvedStatusId,
          priority: priority ?? ITEM_PRIORITY.NORMAL,
          estimate,
          component,
          createdById: identityId,
          parentItemId: parentItemId ?? null,
          orderIndex,
        },
        { tx },
      );

      const event = createCloudEvent({
        type: ItemCreatedEvent.type,
        version: ItemCreatedEvent.version,
        schema: ItemCreatedEvent.schema,
        source: "pine/items-service",
        subject: item.id,
        data: {
          id: item.id,
          name: item.name,
          ownerId: item.createdById,
          reporterId: item.createdById,
          listId: item.listId,
          createdAt: item.createdAt.toISOString(),
          ...(item.description != null ? { description: item.description } : {}),
        },
      });

      await this.outboxService.schedule(
        {
          eventId: event.id,
          eventType: event.type,
          eventVersion: ItemCreatedEvent.version,
          aggregateType: "item",
          aggregateId: item.id,
          payload: event,
        },
        { tx },
      );

      return item.id;
    });
  }

  async list(options: ListItemsOptions): Promise<ItemStatusGroup[]> {
    const { listId, identityId, statusId, after } = options;
    const first = clampListItemsFirst(options.first);

    if (after && !statusId) {
      throw new ListItemsValidationError("statusId is required when after is provided");
    }

    await requirePermission(this.authorizationClient, identityId, "read", `List:${listId}`);

    const statuses = await this.statusRepository.findByListId(listId);

    if (statusId) {
      const status = statuses.find((row) => row.id === statusId);
      if (!status) {
        throw new StatusNotFoundError(`Status not found: ${statusId}`);
      }

      const cursor = after ? decodeItemListCursor(after) : undefined;
      const page = await this.itemRepository.findRootPageByStatus(listId, {
        statusId,
        limit: first + 1,
        after: cursor,
      });
      const counts = await this.itemRepository.countRootsByListGrouped(listId);
      const totalCount = counts.find((row) => row.statusId === statusId)?.totalCount ?? 0;
      const hasNextPage = page.length > first;
      const roots = hasNextPage ? page.slice(0, first) : page;
      const checklistCounts = await this.checklistRepository.findCountsByItemIds(
        roots.map((root) => root.id),
      );
      const countsByItemId = this.groupCountsByItemId(checklistCounts);
      const items: ItemListItem[] = roots.map((root) => ({
        ...root,
        checklistCounts: countsByItemId.get(root.id) ?? { completedCount: 0, totalCount: 0 },
      }));
      const last = items[items.length - 1];
      const pageInfo: ItemGroupPageInfo = {
        hasNextPage,
        endCursor: last ? encodeItemListCursor(last) : null,
      };

      return [{ status, items, pageInfo, totalCount }];
    }

    const counts = await this.itemRepository.countRootsByListGrouped(listId);
    const totalByStatusId = new Map(counts.map((row) => [row.statusId, row.totalCount]));

    const allRoots = await this.itemRepository.findRootFirstPagesByList(listId, first + 1);
    const rootsByStatusId = new Map<string, typeof allRoots>();
    for (const root of allRoots) {
      const group = rootsByStatusId.get(root.statusId);
      if (group) {
        group.push(root);
      } else {
        rootsByStatusId.set(root.statusId, [root]);
      }
    }

    const pageGroups = statuses.map((status) => {
      const page = rootsByStatusId.get(status.id) ?? [];
      const hasNextPage = page.length > first;
      const roots = hasNextPage ? page.slice(0, first) : page;
      return {
        status,
        roots,
        hasNextPage,
        totalCount: totalByStatusId.get(status.id) ?? 0,
      };
    });

    const checklistCounts = await this.checklistRepository.findCountsByItemIds(
      pageGroups.flatMap((group) => group.roots.map((root) => root.id)),
    );
    const countsByItemId = this.groupCountsByItemId(checklistCounts);

    return pageGroups.map(({ status, roots, hasNextPage, totalCount }) => {
      const items: ItemListItem[] = roots.map((root) => ({
        ...root,
        checklistCounts: countsByItemId.get(root.id) ?? { completedCount: 0, totalCount: 0 },
      }));
      const last = items[items.length - 1];
      const pageInfo: ItemGroupPageInfo = {
        hasNextPage,
        endCursor: last ? encodeItemListCursor(last) : null,
      };
      return { status, items, pageInfo, totalCount };
    });
  }

  async getById(options: GetItemOptions) {
    const { identityId, itemId } = options;
    const item = await this.itemRepository.findByIdWithList(itemId);
    if (!item) {
      return null;
    }

    await requirePermission(this.authorizationClient, identityId, "read", `List:${item.listId}`);
    return item;
  }

  async update(options: UpdateItemOptions) {
    const {
      itemId,
      name,
      description,
      dueDate,
      identityId,
      priority,
      statusId,
      estimate,
      component,
      type,
    } = options;

    const existing = await this.itemRepository.findById(itemId);
    if (!existing) {
      throw new ItemNotFoundError(`Item not found: ${itemId}`);
    }

    await requirePermission(
      this.authorizationClient,
      identityId,
      "update",
      `List:${existing.listId}`,
    );

    await this.db.transaction(async (tx) => {
      let nextOrderIndex: number | undefined;
      if (statusId !== undefined && statusId !== existing.statusId && !existing.parentItemId) {
        const maxOrderIndex = await this.itemRepository.findMaxOrderIndex(
          {
            listId: existing.listId,
            statusId,
            parentItemId: null,
          },
          { tx },
        );
        nextOrderIndex = maxOrderIndex === null ? 0 : maxOrderIndex + 1;
      }

      const updatedItem = await this.itemRepository.update(
        itemId,
        {
          name,
          description,
          dueDate,
          statusId,
          priority,
          estimate,
          component,
          type,
          updatedById: identityId,
          ...(nextOrderIndex !== undefined ? { orderIndex: nextOrderIndex } : {}),
        },
        { tx },
      );

      const event = createCloudEvent({
        type: ItemUpdatedEvent.type,
        version: ItemUpdatedEvent.version,
        schema: ItemUpdatedEvent.schema,
        source: "pine/items-service",
        subject: updatedItem.id,
        data: {
          id: updatedItem.id,
          name: updatedItem.name,
          ownerId: updatedItem.createdById,
          reporterId: updatedItem.createdById,
          listId: updatedItem.listId,
          createdAt: updatedItem.createdAt.toISOString(),
          updatedAt: (updatedItem.updatedAt ?? updatedItem.createdAt).toISOString(),
          updatedById: updatedItem.updatedById ?? updatedItem.createdById,
          ...(updatedItem.description != null ? { description: updatedItem.description } : {}),
          ...(updatedItem.statusId ? { statusId: updatedItem.statusId } : {}),
          ...(updatedItem.priority ? { priority: updatedItem.priority } : {}),
          ...(updatedItem.type ? { type: updatedItem.type } : {}),
          ...(updatedItem.dueDate != null ? { dueDate: updatedItem.dueDate.toISOString() } : {}),
          ...(updatedItem.estimate != null ? { estimate: updatedItem.estimate } : {}),
          ...(updatedItem.component != null ? { component: updatedItem.component } : {}),
        },
      });

      await this.outboxService.schedule(
        {
          eventId: event.id,
          eventType: event.type,
          eventVersion: ItemUpdatedEvent.version,
          aggregateType: "item",
          aggregateId: updatedItem.id,
          payload: event,
        },
        { tx },
      );
    });
  }

  async delete(options: DeleteItemOptions) {
    const { id, identityId } = options;

    const item = await this.itemRepository.findById(id);
    if (!item) {
      throw new ItemNotFoundError(`Item not found: ${id}`);
    }

    await requirePermission(this.authorizationClient, identityId, "delete", `List:${item.listId}`);

    const deleted = await this.itemRepository.softDelete(id);
    if (!deleted) {
      throw new ItemNotFoundError(`Item not found: ${id}`);
    }
  }

  async reorder(options: ReorderListItemsOptions) {
    const { listId, statusId, itemIds, identityId } = options;

    await requirePermission(this.authorizationClient, identityId, "update", `List:${listId}`);

    const status = await this.statusRepository.findById(statusId);
    if (!status || status.listId !== listId) {
      throw new StatusNotFoundError(`Status not found: ${statusId}`);
    }

    if (itemIds.length === 0) {
      throw new ItemReorderError("itemIds must not be empty");
    }

    const uniqueIds = new Set(itemIds);
    if (uniqueIds.size !== itemIds.length) {
      throw new ItemReorderError("itemIds must be unique");
    }

    const allRoots = await this.itemRepository.findRootsByStatus(listId, statusId);
    const indexById = new Map(allRoots.map((root, index) => [root.id, index]));

    const positions = itemIds.map((id) => indexById.get(id));
    if (positions.some((position) => position === undefined)) {
      throw new ItemReorderError("itemIds must be root items in the given list status");
    }

    const sortedPositions = positions
      .filter((position): position is number => position !== undefined)
      .slice()
      .sort((left, right) => left - right);

    for (let index = 1; index < sortedPositions.length; index += 1) {
      const previous = sortedPositions[index - 1];
      const current = sortedPositions[index];
      if (previous === undefined || current === undefined || current !== previous + 1) {
        throw new ItemReorderError("itemIds must form a contiguous segment of the status group");
      }
    }

    const start = sortedPositions[0];
    const end = sortedPositions[sortedPositions.length - 1];
    if (start === undefined || end === undefined) {
      throw new ItemReorderError("itemIds must form a contiguous segment of the status group");
    }

    const segmentIds = allRoots.slice(start, end + 1).map((root) => root.id);
    const segmentIdSet = new Set(segmentIds);
    if (
      segmentIds.length !== itemIds.length ||
      segmentIdSet.size !== segmentIds.length ||
      !itemIds.every((id) => segmentIdSet.has(id))
    ) {
      throw new ItemReorderError("itemIds must be a permutation of the contiguous segment");
    }

    const nextOrder = [
      ...allRoots.slice(0, start).map((root) => root.id),
      ...itemIds,
      ...allRoots.slice(end + 1).map((root) => root.id),
    ];

    await this.itemRepository.replaceOrderIndexes(nextOrder);
    return this.itemRepository.findRootsByStatus(listId, statusId);
  }

  private groupCountsByItemId(
    counts: ChecklistCounts[],
  ): Map<string, Pick<ChecklistCounts, "completedCount" | "totalCount">> {
    const countsByItemId = new Map<
      string,
      Pick<ChecklistCounts, "completedCount" | "totalCount">
    >();
    for (const row of counts) {
      countsByItemId.set(row.itemId, {
        completedCount: row.completedCount,
        totalCount: row.totalCount,
      });
    }
    return countsByItemId;
  }
}
