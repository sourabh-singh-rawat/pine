import { uuidv7 } from "@pine/common";
import { and, eq, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type StatusOption, StatusOptions } from "@/db";
import type {
  CreateStatusEntity,
  IStatusRepository,
  StatusRepositoryOptions,
} from "@/features/status/repositories/IStatusRepository";

@injectable()
export class StatusRepository implements IStatusRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  private client(options?: StatusRepositoryOptions) {
    return options?.tx ?? this.db;
  }

  async saveMany(
    entities: CreateStatusEntity[],
    options?: StatusRepositoryOptions,
  ): Promise<StatusOption[]> {
    if (entities.length === 0) return [];

    const client = this.client(options);
    const now = new Date();

    return client
      .insert(StatusOptions)
      .values(
        entities.map((entity) => ({
          id: entity.id ?? uuidv7(),
          name: entity.name,
          type: entity.type,
          orderIndex: entity.orderIndex,
          projectId: entity.projectId,
          createdAt: now,
          version: 1,
        })),
      )
      .returning();
  }

  async findByProjectId(
    projectId: string,
    options?: StatusRepositoryOptions,
  ): Promise<StatusOption[]> {
    const client = this.client(options);
    return client
      .select()
      .from(StatusOptions)
      .where(and(eq(StatusOptions.projectId, projectId), isNull(StatusOptions.deletedAt)));
  }
}
