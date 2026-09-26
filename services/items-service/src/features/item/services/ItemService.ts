import { requirePermission, type IAuthorizationClient } from "@pine/authorization";
import { ItemStatus, ITEM_PRIORITY, ServiceResponse } from "@pine/common";
import { createCloudEvent, ItemCreatedEvent, ItemUpdatedEvent } from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { DbClient, Item, StatusOption } from "@/db";
import { ItemNotFoundError } from "@/features/item/errors";
import type { IItemAssigneeRepository, IItemRepository } from "@/features/item/repositories";
import type { IStatusRepository } from "@/features/item-statuses/repositories";
import type {
  CreateItemOptions,
  DeleteItemOptions,
  GetItemOptions,
  IItemService,
  ItemStatusGroup,
  ListItemsOptions,
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
    @inject(TYPES.ItemAssigneeRepository)
    private readonly itemAssigneeRepository: IItemAssigneeRepository,
    @inject(TYPES.StatusRepository)
    private readonly statusRepository: IStatusRepository,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
  ) {}

  async create(options: CreateItemOptions) {
    const { userId, assigneeIds, parentItemId, estimate, component, statusId, priority, ...input } =
      options;

    return this.db.transaction(async (tx) => {
      if (parentItemId) {
        const parentItem = await this.itemRepository.findById(parentItemId, { tx });
        if (!parentItem) {
          throw new Error("Parent not found");
        }
      }

      const item = await this.itemRepository.save(
        {
          ...input,
          statusId: statusId ?? "",
          priority: priority ?? ITEM_PRIORITY.NORMAL,
          estimate,
          component,
          createdById: userId,
          parentItemId: parentItemId ?? null,
        },
        { tx },
      );

      if (assigneeIds.length > 0) {
        await this.itemAssigneeRepository.saveMany(
          assigneeIds.map((assigneeId) => ({
            itemId: item.id,
            userId: assigneeId,
          })),
          { tx },
        );
      }

      const event = createCloudEvent({
        type: ItemCreatedEvent.type,
        version: ItemCreatedEvent.version,
        schema: ItemCreatedEvent.schema,
        source: "pine/items-service",
        subject: item.id,
        data: this.toItemCreatedEventData(item),
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
    const { listId, userId } = options;
    const [statuses, roots] = await Promise.all([
      this.statusRepository.findByListId(listId),
      this.itemRepository.findRootsByList(listId, userId),
    ]);

    return this.toStatusGroups(statuses, roots);
  }

  async getById(options: GetItemOptions) {
    const { userId, itemId } = options;
    return this.itemRepository.findByIdForUser(itemId, userId);
  }

  async getStatusList() {
    const statuses = this.getStatuses();
    return new ServiceResponse({ rows: statuses, rowCount: statuses.length });
  }

  async getPriorityList() {
    const priorities = this.getPriorities();
    return new ServiceResponse({ rows: priorities, rowCount: priorities.length });
  }

  async update(options: UpdateItemOptions) {
    const {
      itemId,
      name,
      description,
      dueDate,
      userId,
      priority,
      statusId,
      estimate,
      component,
      type,
    } = options;

    await this.db.transaction(async (tx) => {
      const updatedItem = await this.itemRepository.update(
        itemId,
        userId,
        {
          name,
          description,
          dueDate,
          statusId,
          priority,
          estimate,
          component,
          type,
          updatedById: userId,
        },
        { tx },
      );

      const event = createCloudEvent({
        type: ItemUpdatedEvent.type,
        version: ItemUpdatedEvent.version,
        schema: ItemUpdatedEvent.schema,
        source: "pine/items-service",
        subject: updatedItem.id,
        data: this.toItemUpdatedEventData(updatedItem),
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
    const { id, userId } = options;

    const item = await this.itemRepository.findById(id);
    if (!item) {
      throw new ItemNotFoundError(`Item not found: ${id}`);
    }

    await requirePermission(this.authorizationClient, userId, "delete", `list:${item.listId}`);

    const deleted = await this.itemRepository.softDelete(id);
    if (!deleted) {
      throw new ItemNotFoundError(`Item not found: ${id}`);
    }
  }

  private toStatusGroups(
    statuses: StatusOption[],
    roots: Awaited<ReturnType<IItemRepository["findRootsByList"]>>,
  ): ItemStatusGroup[] {
    const itemsByStatusId = new Map<string, typeof roots>();

    for (const status of statuses) {
      itemsByStatusId.set(status.id, []);
    }

    for (const item of roots) {
      const bucket = itemsByStatusId.get(item.statusId);
      if (bucket) {
        bucket.push(item);
      }
    }

    return statuses.map((status) => {
      const items = itemsByStatusId.get(status.id) ?? [];
      items.sort((left, right) => left.name.localeCompare(right.name));
      return { status, items };
    });
  }

  private getStatuses() {
    return Object.values(ItemStatus);
  }

  private getPriorities() {
    return Object.values(ITEM_PRIORITY);
  }

  private toItemCreatedEventData(item: Item) {
    return {
      id: item.id,
      name: item.name,
      ownerId: item.createdById,
      reporterId: item.createdById,
      listId: item.listId,
      createdAt: item.createdAt.toISOString(),
      ...(item.description != null ? { description: item.description } : {}),
    };
  }

  private toItemUpdatedEventData(item: Item) {
    return {
      id: item.id,
      name: item.name,
      ownerId: item.createdById,
      reporterId: item.createdById,
      listId: item.listId,
      createdAt: item.createdAt.toISOString(),
      updatedAt: (item.updatedAt ?? item.createdAt).toISOString(),
      updatedById: item.updatedById ?? item.createdById,
      ...(item.description != null ? { description: item.description } : {}),
      ...(item.statusId ? { statusId: item.statusId } : {}),
      ...(item.priority ? { priority: item.priority } : {}),
      ...(item.type ? { type: item.type } : {}),
      ...(item.dueDate != null ? { dueDate: item.dueDate.toISOString() } : {}),
      ...(item.estimate != null ? { estimate: item.estimate } : {}),
      ...(item.component != null ? { component: item.component } : {}),
    };
  }
}
