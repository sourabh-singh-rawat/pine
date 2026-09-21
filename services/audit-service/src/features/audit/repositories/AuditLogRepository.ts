import { uuidv7 } from "@pine/common";
import { and, desc, eq, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type AuditLog, AuditLogs } from "@/db";
import type {
  CreateAuditLogEntity,
  IAuditLogRepository,
  AuditLogRepositoryOptions,
  ListAuditLogsFilter,
} from "@/features/audit/repositories/IAuditLogRepository";

@injectable()
export class AuditLogRepository implements IAuditLogRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  save = async (
    entity: CreateAuditLogEntity,
    options?: AuditLogRepositoryOptions,
  ): Promise<AuditLog> => {
    const client = options?.tx ?? this.db;
    const now = new Date();

    const [created] = await client
      .insert(AuditLogs)
      .values({
        id: entity.id ?? uuidv7(),
        entityType: entity.entityType,
        entityId: entity.entityId,
        action: entity.action,
        actorId: entity.actorId ?? null,
        workspaceId: entity.workspaceId ?? null,
        tenantId: entity.tenantId ?? null,
        payload: entity.payload ?? null,
        createdAt: now,
        version: 1,
      })
      .returning();

    return created;
  };

  findMany = async (
    filter: ListAuditLogsFilter,
    options?: AuditLogRepositoryOptions,
  ): Promise<AuditLog[]> => {
    const client = options?.tx ?? this.db;

    return client
      .select()
      .from(AuditLogs)
      .where(
        and(
          eq(AuditLogs.entityType, filter.entityType),
          eq(AuditLogs.entityId, filter.entityId),
          isNull(AuditLogs.deletedAt),
        ),
      )
      .orderBy(desc(AuditLogs.createdAt));
  };
}
