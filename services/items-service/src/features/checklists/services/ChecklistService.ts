import { requirePermission, type IAuthorizationClient } from "@pine/authorization";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { Checklist, ChecklistEntry, DbClient, Item } from "@/db";
import {
  ChecklistEntryNotFoundError,
  ChecklistNotFoundError,
  ChecklistReorderError,
  ChecklistValidationError,
} from "@/features/checklists/errors";
import type {
  IChecklistEntryRepository,
  IChecklistRepository,
} from "@/features/checklists/repositories";
import { ItemNotFoundError } from "@/features/item/errors";
import type { IItemRepository } from "@/features/item/repositories";
import type { IListRepository } from "@/features/lists/repositories";
import { SpaceNotFoundError } from "@/features/spaces/errors";
import type { ISpaceRepository } from "@/features/spaces/repositories";
import type {
  ChecklistWithEntries,
  CreateChecklistEntryOptions,
  CreateChecklistOptions,
  DeleteChecklistEntryOptions,
  DeleteChecklistOptions,
  IChecklistService,
  ListChecklistsOptions,
  ReorderChecklistEntriesOptions,
  UpdateChecklistEntryOptions,
  UpdateChecklistOptions,
} from "./IChecklistService";

const MAX_TEXT_LENGTH = 500;
const DEFAULT_CHECKLIST_NAME = "Checklist";

export type ChecklistDatabase = {
  transaction: <T>(callback: (tx: DbClient) => Promise<T>) => Promise<T>;
};

const countCompleted = (entries: ChecklistEntry[]): number =>
  entries.filter((entry) => entry.completed).length;

const toChecklistWithEntries = (
  checklist: Checklist,
  entries: ChecklistEntry[],
): ChecklistWithEntries => ({
  checklist,
  entries,
  completedCount: countCompleted(entries),
  totalCount: entries.length,
});

const normalizeRequiredText = (value: string, fieldName: string): string => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new ChecklistValidationError(`${fieldName} is required`);
  }
  if (trimmed.length > MAX_TEXT_LENGTH) {
    throw new ChecklistValidationError(
      `${fieldName} must be at most ${MAX_TEXT_LENGTH} characters`,
    );
  }
  return trimmed;
};

const normalizeChecklistName = (value: string | null | undefined): string => {
  if (value === undefined || value === null) {
    return DEFAULT_CHECKLIST_NAME;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return DEFAULT_CHECKLIST_NAME;
  }
  if (trimmed.length > MAX_TEXT_LENGTH) {
    throw new ChecklistValidationError(`name must be at most ${MAX_TEXT_LENGTH} characters`);
  }
  return trimmed;
};

const isPermutation = (expectedIds: string[], actualIds: string[]): boolean => {
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
};

@injectable()
export class ChecklistService implements IChecklistService {
  constructor(
    @inject(TYPES.Database)
    private readonly db: ChecklistDatabase,
    @inject(TYPES.ChecklistRepository)
    private readonly checklistRepository: IChecklistRepository,
    @inject(TYPES.ChecklistEntryRepository)
    private readonly checklistEntryRepository: IChecklistEntryRepository,
    @inject(TYPES.ItemRepository)
    private readonly itemRepository: IItemRepository,
    @inject(TYPES.ListRepository)
    private readonly listRepository: IListRepository,
    @inject(TYPES.SpaceRepository)
    private readonly spaceRepository: ISpaceRepository,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
  ) {}

  async list(options: ListChecklistsOptions): Promise<ChecklistWithEntries[]> {
    const { itemId, identityId } = options;
    const item = await this.requireItem(itemId);
    const workspaceId = await this.resolveWorkspaceId(item);

    await requirePermission(
      this.authorizationClient,
      identityId,
      "read",
      `workspace:${workspaceId}`,
    );

    const checklists = await this.checklistRepository.findByItemId(itemId);
    const entries = await this.checklistEntryRepository.findByChecklistIds(
      checklists.map((checklist) => checklist.id),
    );

    const entriesByChecklistId = new Map<string, ChecklistEntry[]>();
    for (const entry of entries) {
      const group = entriesByChecklistId.get(entry.checklistId);
      if (group) {
        group.push(entry);
      } else {
        entriesByChecklistId.set(entry.checklistId, [entry]);
      }
    }

    return checklists.map((checklist) =>
      toChecklistWithEntries(checklist, entriesByChecklistId.get(checklist.id) ?? []),
    );
  }

  async create(options: CreateChecklistOptions): Promise<ChecklistWithEntries> {
    const { itemId, name, identityId } = options;
    const item = await this.requireItem(itemId);
    const workspaceId = await this.resolveWorkspaceId(item);

    await requirePermission(
      this.authorizationClient,
      identityId,
      "create_list",
      `workspace:${workspaceId}`,
    );

    const checklist = await this.checklistRepository.save({
      itemId,
      name: normalizeChecklistName(name),
      createdById: identityId,
    });

    return toChecklistWithEntries(checklist, []);
  }

  async update(options: UpdateChecklistOptions): Promise<ChecklistWithEntries> {
    const { id, name, identityId } = options;
    const checklist = await this.requireChecklist(id);
    const item = await this.requireItem(checklist.itemId);
    const workspaceId = await this.resolveWorkspaceId(item);

    await requirePermission(
      this.authorizationClient,
      identityId,
      "create_list",
      `workspace:${workspaceId}`,
    );

    const updated = await this.checklistRepository.update(id, {
      name: normalizeRequiredText(name, "name"),
    });
    if (!updated) {
      throw new ChecklistNotFoundError(`Checklist not found: ${id}`);
    }

    const entries = await this.checklistEntryRepository.findByChecklistId(id);
    return toChecklistWithEntries(updated, entries);
  }

  async delete(options: DeleteChecklistOptions): Promise<void> {
    const { id, identityId } = options;
    const checklist = await this.requireChecklist(id);
    const item = await this.requireItem(checklist.itemId);
    const workspaceId = await this.resolveWorkspaceId(item);

    await requirePermission(
      this.authorizationClient,
      identityId,
      "create_list",
      `workspace:${workspaceId}`,
    );

    await this.db.transaction(async (tx) => {
      const deleted = await this.checklistRepository.softDelete(id, { tx });
      if (!deleted) {
        throw new ChecklistNotFoundError(`Checklist not found: ${id}`);
      }
      await this.checklistEntryRepository.softDeleteByChecklistId(id, { tx });
    });
  }

  async createEntry(options: CreateChecklistEntryOptions): Promise<ChecklistEntry> {
    const { checklistId, title, identityId } = options;
    const checklist = await this.requireChecklist(checklistId);
    const item = await this.requireItem(checklist.itemId);
    const workspaceId = await this.resolveWorkspaceId(item);

    await requirePermission(
      this.authorizationClient,
      identityId,
      "create_list",
      `workspace:${workspaceId}`,
    );

    const maxOrderIndex = await this.checklistEntryRepository.findMaxOrderIndex(checklistId);
    const orderIndex = maxOrderIndex === null ? 0 : maxOrderIndex + 1;

    return this.checklistEntryRepository.save({
      checklistId,
      title: normalizeRequiredText(title, "title"),
      orderIndex,
      createdById: identityId,
    });
  }

  async updateEntry(options: UpdateChecklistEntryOptions): Promise<ChecklistEntry> {
    const { id, title, completed, identityId } = options;
    const entry = await this.requireEntry(id);
    const checklist = await this.requireChecklist(entry.checklistId);
    const item = await this.requireItem(checklist.itemId);
    const workspaceId = await this.resolveWorkspaceId(item);

    await requirePermission(
      this.authorizationClient,
      identityId,
      "create_list",
      `workspace:${workspaceId}`,
    );

    const patch: { title?: string; completed?: boolean } = {};
    if (title !== undefined && title !== null) {
      patch.title = normalizeRequiredText(title, "title");
    }
    if (completed !== undefined && completed !== null) {
      patch.completed = completed;
    }

    if (patch.title === undefined && patch.completed === undefined) {
      throw new ChecklistValidationError("title or completed is required");
    }

    const updated = await this.checklistEntryRepository.update(id, patch);
    if (!updated) {
      throw new ChecklistEntryNotFoundError(`Checklist entry not found: ${id}`);
    }
    return updated;
  }

  async deleteEntry(options: DeleteChecklistEntryOptions): Promise<void> {
    const { id, identityId } = options;
    const entry = await this.requireEntry(id);
    const checklist = await this.requireChecklist(entry.checklistId);
    const item = await this.requireItem(checklist.itemId);
    const workspaceId = await this.resolveWorkspaceId(item);

    await requirePermission(
      this.authorizationClient,
      identityId,
      "create_list",
      `workspace:${workspaceId}`,
    );

    const deleted = await this.checklistEntryRepository.softDelete(id);
    if (!deleted) {
      throw new ChecklistEntryNotFoundError(`Checklist entry not found: ${id}`);
    }
  }

  async reorderEntries(options: ReorderChecklistEntriesOptions): Promise<ChecklistEntry[]> {
    const { checklistId, ids, identityId } = options;
    const checklist = await this.requireChecklist(checklistId);
    const item = await this.requireItem(checklist.itemId);
    const workspaceId = await this.resolveWorkspaceId(item);

    await requirePermission(
      this.authorizationClient,
      identityId,
      "create_list",
      `workspace:${workspaceId}`,
    );

    return this.db.transaction(async (tx) => {
      const existing = await this.checklistEntryRepository.findByChecklistId(checklistId, { tx });
      const existingIds = existing.map((entry) => entry.id);
      if (!isPermutation(existingIds, ids)) {
        throw new ChecklistReorderError();
      }

      await this.checklistEntryRepository.replaceOrderIndexes(ids, { tx });
      return this.checklistEntryRepository.findByChecklistId(checklistId, { tx });
    });
  }

  private async requireItem(itemId: string): Promise<Item> {
    const item = await this.itemRepository.findById(itemId);
    if (!item) {
      throw new ItemNotFoundError(`Item not found: ${itemId}`);
    }
    return item;
  }

  private async requireChecklist(id: string): Promise<Checklist> {
    const checklist = await this.checklistRepository.findById(id);
    if (!checklist) {
      throw new ChecklistNotFoundError(`Checklist not found: ${id}`);
    }
    return checklist;
  }

  private async requireEntry(id: string): Promise<ChecklistEntry> {
    const entry = await this.checklistEntryRepository.findById(id);
    if (!entry) {
      throw new ChecklistEntryNotFoundError(`Checklist entry not found: ${id}`);
    }
    return entry;
  }

  private async resolveWorkspaceId(item: Item): Promise<string> {
    const list = await this.listRepository.findById(item.listId);
    if (!list) {
      throw new ItemNotFoundError(`List not found for item: ${item.id}`);
    }

    const space = await this.spaceRepository.findById(list.spaceId);
    if (!space) {
      throw new SpaceNotFoundError(`Space not found: ${list.spaceId}`);
    }

    return space.workspaceId;
  }
}
