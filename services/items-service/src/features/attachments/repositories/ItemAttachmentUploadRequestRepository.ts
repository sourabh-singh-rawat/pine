import { uuidv7 } from "@pine/common";
import { eq } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import {
  type Database,
  type ItemAttachmentUploadRequest,
  ItemAttachmentUploadRequests,
} from "@/db";
import type {
  CreateItemAttachmentUploadRequestEntity,
  IItemAttachmentUploadRequestRepository,
  ItemAttachmentUploadRequestRepositoryOptions,
} from "@/features/attachments/repositories/IItemAttachmentUploadRequestRepository";

@injectable()
export class ItemAttachmentUploadRequestRepository implements IItemAttachmentUploadRequestRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async save(
    entity: CreateItemAttachmentUploadRequestEntity,
    options?: ItemAttachmentUploadRequestRepositoryOptions,
  ): Promise<ItemAttachmentUploadRequest> {
    const client = this.client(options);
    const now = new Date();

    const [created] = await client
      .insert(ItemAttachmentUploadRequests)
      .values({
        id: uuidv7(),
        itemId: entity.itemId,
        status: entity.status,
        name: entity.name,
        originalName: entity.originalName,
        mimeType: entity.mimeType,
        size: entity.size ?? null,
        createdById: entity.createdById,
        attachmentId: entity.attachmentId ?? null,
        createdAt: now,
      })
      .returning();

    return created;
  }

  async findById(
    id: string,
    options?: ItemAttachmentUploadRequestRepositoryOptions,
  ): Promise<ItemAttachmentUploadRequest | null> {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(ItemAttachmentUploadRequests)
      .where(eq(ItemAttachmentUploadRequests.id, id))
      .limit(1);

    return row ?? null;
  }

  async update(
    id: string,
    entity: Partial<Pick<ItemAttachmentUploadRequest, "status" | "attachmentId" | "completedAt">>,
    options?: ItemAttachmentUploadRequestRepositoryOptions,
  ): Promise<ItemAttachmentUploadRequest> {
    const client = this.client(options);

    const [updated] = await client
      .update(ItemAttachmentUploadRequests)
      .set({
        ...(entity.status !== undefined ? { status: entity.status } : {}),
        ...(entity.attachmentId !== undefined ? { attachmentId: entity.attachmentId } : {}),
        ...(entity.completedAt !== undefined ? { completedAt: entity.completedAt } : {}),
      })
      .where(eq(ItemAttachmentUploadRequests.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Item attachment upload request not found for update: ${id}`);
    }

    return updated;
  }

  private client(options?: ItemAttachmentUploadRequestRepositoryOptions) {
    return options?.tx ?? this.db;
  }
}
