import { uuidv7 } from "@pine/common";
import { and, asc, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type ItemAttachment, ItemAttachments } from "@/db";
import { ITEM_ATTACHMENT_STATUS } from "@/features/item-attachments/constants";
import type {
  CreateItemAttachmentEntity,
  IItemAttachmentRepository,
  ItemAttachmentRepositoryOptions,
  UpdateItemAttachmentEntity,
} from "@/features/item-attachments/repositories/IItemAttachmentRepository";

@injectable()
export class ItemAttachmentRepository implements IItemAttachmentRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async save(
    entity: CreateItemAttachmentEntity,
    options?: ItemAttachmentRepositoryOptions,
  ): Promise<ItemAttachment> {
    const client = this.client(options);
    const now = new Date();

    const [created] = await client
      .insert(ItemAttachments)
      .values({
        id: entity.id ?? uuidv7(),
        itemId: entity.itemId,
        attachmentId: entity.attachmentId ?? null,
        status: entity.status,
        name: entity.name,
        originalName: entity.originalName,
        mimeType: entity.mimeType,
        size: entity.size ?? null,
        createdById: entity.createdById,
        createdAt: now,
        version: 1,
      })
      .returning();

    return created;
  }

  async update(
    id: string,
    entity: UpdateItemAttachmentEntity,
    options?: ItemAttachmentRepositoryOptions,
  ): Promise<ItemAttachment | null> {
    const client = this.client(options);
    const now = new Date();

    const [updated] = await client
      .update(ItemAttachments)
      .set({
        ...(entity.attachmentId !== undefined ? { attachmentId: entity.attachmentId } : {}),
        ...(entity.status !== undefined ? { status: entity.status } : {}),
        ...(entity.name !== undefined ? { name: entity.name } : {}),
        ...(entity.originalName !== undefined ? { originalName: entity.originalName } : {}),
        ...(entity.mimeType !== undefined ? { mimeType: entity.mimeType } : {}),
        ...(entity.size !== undefined ? { size: entity.size } : {}),
        updatedAt: now,
        version: sql`${ItemAttachments.version} + 1`,
      })
      .where(and(eq(ItemAttachments.id, id), isNull(ItemAttachments.deletedAt)))
      .returning();

    return updated ?? null;
  }

  async findById(
    id: string,
    options?: ItemAttachmentRepositoryOptions,
  ): Promise<ItemAttachment | null> {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(ItemAttachments)
      .where(and(eq(ItemAttachments.id, id), isNull(ItemAttachments.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async findByItemId(
    itemId: string,
    options?: ItemAttachmentRepositoryOptions,
  ): Promise<ItemAttachment[]> {
    const client = this.client(options);

    return client
      .select()
      .from(ItemAttachments)
      .where(and(eq(ItemAttachments.itemId, itemId), isNull(ItemAttachments.deletedAt)))
      .orderBy(desc(ItemAttachments.createdAt));
  }

  async findByItemAndAttachment(
    itemId: string,
    attachmentId: string,
    options?: ItemAttachmentRepositoryOptions,
  ): Promise<ItemAttachment | null> {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(ItemAttachments)
      .where(
        and(
          eq(ItemAttachments.itemId, itemId),
          eq(ItemAttachments.attachmentId, attachmentId),
          isNull(ItemAttachments.deletedAt),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async softDelete(id: string, options?: ItemAttachmentRepositoryOptions): Promise<boolean> {
    const client = this.client(options);
    const now = new Date();

    const deleted = await client
      .update(ItemAttachments)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${ItemAttachments.version} + 1`,
      })
      .where(and(eq(ItemAttachments.id, id), isNull(ItemAttachments.deletedAt)))
      .returning({ id: ItemAttachments.id });

    return deleted.length > 0;
  }

  async failStaleBefore(
    olderThan: Date,
    limit: number,
    options?: ItemAttachmentRepositoryOptions,
  ): Promise<number> {
    if (limit <= 0) {
      return 0;
    }

    const client = this.client(options);
    const stale = await client
      .select({ id: ItemAttachments.id })
      .from(ItemAttachments)
      .where(
        and(
          inArray(ItemAttachments.status, [
            ITEM_ATTACHMENT_STATUS.PENDING,
            ITEM_ATTACHMENT_STATUS.SCANNING,
          ]),
          isNull(ItemAttachments.deletedAt),
          lt(ItemAttachments.createdAt, olderThan),
        ),
      )
      .orderBy(asc(ItemAttachments.createdAt))
      .limit(limit);

    if (stale.length === 0) {
      return 0;
    }

    const now = new Date();
    const updated = await client
      .update(ItemAttachments)
      .set({
        status: ITEM_ATTACHMENT_STATUS.FAILED,
        updatedAt: now,
        version: sql`${ItemAttachments.version} + 1`,
      })
      .where(
        and(
          inArray(
            ItemAttachments.id,
            stale.map((row) => row.id),
          ),
          isNull(ItemAttachments.deletedAt),
        ),
      )
      .returning({ id: ItemAttachments.id });

    return updated.length;
  }

  private client(options?: ItemAttachmentRepositoryOptions) {
    return options?.tx ?? this.db;
  }
}
