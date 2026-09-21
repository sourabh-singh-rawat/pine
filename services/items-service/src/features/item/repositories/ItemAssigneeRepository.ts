import { uuidv7 } from "@pine/common";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type ItemAssignee, ItemAssignees } from "@/db";
import type {
  CreateItemAssigneeEntity,
  IItemAssigneeRepository,
  ItemAssigneeRepositoryOptions,
} from "@/features/item/repositories/IItemAssigneeRepository";

@injectable()
export class ItemAssigneeRepository implements IItemAssigneeRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async saveMany(
    entities: CreateItemAssigneeEntity[],
    options?: ItemAssigneeRepositoryOptions,
  ): Promise<ItemAssignee[]> {
    if (entities.length === 0) return [];

    const client = this.client(options);
    const now = new Date();

    return client
      .insert(ItemAssignees)
      .values(
        entities.map((entity) => ({
          id: entity.id ?? uuidv7(),
          itemId: entity.itemId,
          userId: entity.userId,
          createdAt: now,
          version: 1,
        })),
      )
      .returning();
  }

  private client(options?: ItemAssigneeRepositoryOptions) {
    return options?.tx ?? this.db;
  }
}
