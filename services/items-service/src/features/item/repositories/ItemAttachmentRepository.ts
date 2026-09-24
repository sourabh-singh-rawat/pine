import { uuidv7 } from "@pine/common";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type ItemAttachment, ItemAttachments } from "@/db";
import type {
  CreateItemAttachmentEntity,
  IItemAttachmentRepository,
  ItemAttachmentRepositoryOptions,
} from "@/features/item/repositories/IItemAttachmentRepository";

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
        attachmentId: entity.attachmentId,
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
      .where(
        and(eq(ItemAttachments.itemId, itemId), isNull(ItemAttachments.deletedAt)),
      )
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

  async softDelete(
    id: string,
    options?: ItemAttachmentRepositoryOptions,
  ): Promise<boolean> {
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

  private client(options?: ItemAttachmentRepositoryOptions) {
    return options?.tx ?? this.db;
  }
}
