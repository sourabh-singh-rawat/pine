import { requirePermission, type IAuthorizationClient } from "@pine/authorization";
import { ListNotFoundError, STATUS_TYPE, type StatusType } from "@pine/common";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { DbClient, List, StatusOption } from "@/db";
import type { IItemRepository } from "@/features/item/repositories";
import {
  StatusNotFoundError,
  StatusReorderError,
  StatusValidationError,
} from "@/features/item-statuses/errors";
import type { IStatusRepository } from "@/features/item-statuses/repositories";
import type { IListRepository } from "@/features/lists/repositories";
import { SpaceNotFoundError } from "@/features/spaces/errors";
import type { ISpaceRepository } from "@/features/spaces/repositories";
import type {
  CreateStatusOptions,
  DeleteStatusOptions,
  IStatusService,
  ListStatusesOptions,
  ReorderStatusesOptions,
  SeedForListOptions,
  UpdateStatusOptions,
} from "./IStatusService";

export type StatusDatabase = {
  transaction: <T>(callback: (tx: DbClient) => Promise<T>) => Promise<T>;
};

const MAX_NAME_LENGTH = 100;
const COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const STATUS_TYPE_VALUES: readonly string[] = Object.values(STATUS_TYPE);

@injectable()
export class StatusService implements IStatusService {
  constructor(
    @inject(TYPES.Database)
    private readonly db: StatusDatabase,
    @inject(TYPES.StatusRepository)
    private readonly statusRepository: IStatusRepository,
    @inject(TYPES.ItemRepository)
    private readonly itemRepository: IItemRepository,
    @inject(TYPES.ListRepository)
    private readonly listRepository: IListRepository,
    @inject(TYPES.SpaceRepository)
    private readonly spaceRepository: ISpaceRepository,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
  ) {}

  async seedForList(options: SeedForListOptions): Promise<void> {
    const { listId, statuses, tx } = options;

    await this.statusRepository.saveMany(
      statuses.map((status) => ({
        name: status.name,
        type: status.type,
        color: status.color,
        orderIndex: status.orderIndex,
        listId,
      })),
      tx ? { tx } : undefined,
    );
  }

  async list(options: ListStatusesOptions): Promise<StatusOption[]> {
    const { listId, identityId } = options;
    await this.requireListRead(listId, identityId);
    return this.statusRepository.findByListId(listId);
  }

  async create(options: CreateStatusOptions): Promise<StatusOption> {
    const { listId, identityId } = options;
    await this.requireListUpdate(listId, identityId);

    const name = this.normalizeName(options.name);
    const type = this.normalizeType(options.type);
    const color = this.normalizeColor(options.color);

    const existing = await this.statusRepository.findByListId(listId);
    this.assertUniqueName(existing, name);

    const maxOrderIndex = await this.statusRepository.findMaxOrderIndex(listId);
    const orderIndex = maxOrderIndex === null ? 0 : maxOrderIndex + 1;

    return this.statusRepository.save({
      listId,
      name,
      type,
      color,
      orderIndex,
    });
  }

  async update(options: UpdateStatusOptions): Promise<StatusOption> {
    const { id, identityId } = options;
    const status = await this.requireStatus(id);
    await this.requireListUpdate(status.listId, identityId);

    const patch: { name?: string; type?: StatusType; color?: string } = {};

    if (options.name !== undefined && options.name !== null) {
      patch.name = this.normalizeName(options.name);
    }
    if (options.type !== undefined && options.type !== null) {
      patch.type = this.normalizeType(options.type);
    }
    if (options.color !== undefined && options.color !== null) {
      patch.color = this.normalizeColor(options.color);
    }

    if (patch.name === undefined && patch.type === undefined && patch.color === undefined) {
      throw new StatusValidationError("name, type, or color is required");
    }

    if (patch.name !== undefined) {
      const siblings = await this.statusRepository.findByListId(status.listId);
      this.assertUniqueName(siblings, patch.name, id);
    }

    const updated = await this.statusRepository.update(id, patch);
    if (!updated) {
      throw new StatusNotFoundError(`Status not found: ${id}`);
    }
    return updated;
  }

  async delete(options: DeleteStatusOptions): Promise<void> {
    const { id, identityId, replacementStatusId } = options;
    const status = await this.requireStatus(id);
    await this.requireListUpdate(status.listId, identityId);

    const siblings = await this.statusRepository.findByListId(status.listId);
    if (siblings.length <= 1) {
      throw new StatusValidationError("cannot delete the last status on a list");
    }

    const usageCount = await this.itemRepository.countByStatusId(id);
    let replacement: StatusOption | null = null;

    if (usageCount > 0) {
      if (!replacementStatusId) {
        throw new StatusValidationError(
          "replacementStatusId is required when items use this status",
        );
      }
      if (replacementStatusId === id) {
        throw new StatusValidationError("replacementStatusId must be a different status");
      }

      replacement = siblings.find((sibling) => sibling.id === replacementStatusId) ?? null;
      if (!replacement) {
        throw new StatusNotFoundError(`Replacement status not found: ${replacementStatusId}`);
      }
    }

    await this.db.transaction(async (tx) => {
      if (usageCount > 0 && replacement) {
        await this.itemRepository.reassignStatus(id, replacement.id, { tx });
      }

      const deleted = await this.statusRepository.softDelete(id, { tx });
      if (!deleted) {
        throw new StatusNotFoundError(`Status not found: ${id}`);
      }

      const remaining = await this.statusRepository.findByListId(status.listId, { tx });
      await this.statusRepository.replaceOrderIndexes(
        remaining.map((row) => row.id),
        { tx },
      );
    });
  }

  async reorder(options: ReorderStatusesOptions): Promise<StatusOption[]> {
    const { listId, statusIds, identityId } = options;
    await this.requireListUpdate(listId, identityId);

    const existing = await this.statusRepository.findByListId(listId);
    const existingIds = existing.map((status) => status.id);

    if (!this.isPermutation(existingIds, statusIds)) {
      throw new StatusReorderError("statusIds must be a permutation of the list statuses");
    }

    await this.statusRepository.replaceOrderIndexes(statusIds);
    return this.statusRepository.findByListId(listId);
  }

  private assertUniqueName(statuses: StatusOption[], name: string, excludeId?: string): void {
    const normalized = name.toLowerCase();
    const conflict = statuses.some(
      (status) => status.id !== excludeId && status.name.trim().toLowerCase() === normalized,
    );
    if (conflict) {
      throw new StatusValidationError("a status with this name already exists on the list");
    }
  }

  private async requireStatus(id: string): Promise<StatusOption> {
    const status = await this.statusRepository.findById(id);
    if (!status) {
      throw new StatusNotFoundError(`Status not found: ${id}`);
    }
    return status;
  }

  private async requireList(listId: string): Promise<List> {
    const list = await this.listRepository.findById(listId);
    if (!list) {
      throw new ListNotFoundError();
    }
    return list;
  }

  private async requireListRead(listId: string, identityId: string): Promise<void> {
    await this.requireList(listId);
    await requirePermission(this.authorizationClient, identityId, "read", `list:${listId}`);
  }

  private async requireListUpdate(listId: string, identityId: string): Promise<void> {
    const list = await this.requireList(listId);
    const space = await this.spaceRepository.findById(list.spaceId);
    if (!space) {
      throw new SpaceNotFoundError();
    }

    await requirePermission(this.authorizationClient, identityId, "update", `list:${listId}`);
  }

  private isStatusType(value: string): value is StatusType {
    return STATUS_TYPE_VALUES.includes(value);
  }

  private isPermutation(expectedIds: string[], actualIds: string[]): boolean {
    if (expectedIds.length !== actualIds.length) {
      return false;
    }
    const expected = new Set(expectedIds);
    if (expected.size !== expectedIds.length) {
      return false;
    }
    const seen = new Set<string>();
    for (const id of actualIds) {
      if (!expected.has(id) || seen.has(id)) {
        return false;
      }
      seen.add(id);
    }
    return seen.size === expected.size;
  }

  private normalizeName(value: string): string {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new StatusValidationError("name is required");
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      throw new StatusValidationError(`name must be at most ${MAX_NAME_LENGTH} characters`);
    }
    return trimmed;
  }

  private normalizeColor(value: string): string {
    const trimmed = value.trim();
    if (!COLOR_PATTERN.test(trimmed)) {
      throw new StatusValidationError("color must be a hex value like #RRGGBB");
    }
    return trimmed.toUpperCase();
  }

  private normalizeType(value: string): StatusType {
    const trimmed = value.trim();
    if (!this.isStatusType(trimmed)) {
      throw new StatusValidationError("type is invalid");
    }
    return trimmed;
  }
}
