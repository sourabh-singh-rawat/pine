import { eq, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type Attachment, Attachments } from "@/db";
import type {
  IAttachmentRepository,
  AttachmentRepositoryOptions,
  UpsertAttachmentEntity,
} from "@/features/attachments/repositories/IAttachmentRepository";

@injectable()
export class AttachmentRepository implements IAttachmentRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  upsert = async (
    entity: UpsertAttachmentEntity,
    options?: AttachmentRepositoryOptions,
  ): Promise<Attachment> => {
    const client = options?.tx ?? this.db;
    const now = new Date();

    const [inserted] = await client
      .insert(Attachments)
      .values({
        id: entity.id,
        tenantId: entity.tenantId ?? null,
        scopeType: entity.scopeType,
        scopeId: entity.scopeId,
        status: entity.status,
        createdBy: entity.createdBy,
        createdAt: now,
        version: 1,
      })
      .onConflictDoNothing({ target: Attachments.id })
      .returning();

    if (inserted) {
      return inserted;
    }

    const [updated] = await client
      .update(Attachments)
      .set({
        scopeType: entity.scopeType,
        scopeId: entity.scopeId,
        status: entity.status,
        ...(entity.tenantId !== undefined ? { tenantId: entity.tenantId } : {}),
        updatedAt: now,
        version: sql`${Attachments.version} + 1`,
      })
      .where(eq(Attachments.id, entity.id))
      .returning();

    return updated;
  };

  findById = async (
    id: string,
    options?: AttachmentRepositoryOptions,
  ): Promise<Attachment | null> => {
    const client = options?.tx ?? this.db;
    const [row] = await client.select().from(Attachments).where(eq(Attachments.id, id)).limit(1);

    return row ?? null;
  };
}
