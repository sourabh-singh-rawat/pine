import { and, eq } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import {
  type Attachment,
  Attachments,
  type AttachmentVersion,
  AttachmentVersions,
  type Database,
  type DbClient,
  type NewAttachment,
  type NewAttachmentVersion,
} from "@/db";
import type {
  AttachmentRepositoryOptions,
  IAttachmentRepository,
  UpdateAttachmentStatusInput,
} from "@/features/attachment/repositories/IAttachmentRepository";

@injectable()
export class AttachmentRepository implements IAttachmentRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async save(entity: NewAttachment, options?: AttachmentRepositoryOptions): Promise<Attachment> {
    const client = this.client(options);
    const [created] = await client.insert(Attachments).values(entity).returning();

    return created;
  }

  async saveVersion(
    entity: NewAttachmentVersion,
    options?: AttachmentRepositoryOptions,
  ): Promise<AttachmentVersion> {
    const client = this.client(options);
    const [created] = await client.insert(AttachmentVersions).values(entity).returning();

    return created;
  }

  async findById(id: string, options?: AttachmentRepositoryOptions): Promise<Attachment | null> {
    const client = this.client(options);
    const [row] = await client.select().from(Attachments).where(eq(Attachments.id, id)).limit(1);

    return row ?? null;
  }

  async findVersionById(
    attachmentId: string,
    versionId: string,
    options?: AttachmentRepositoryOptions,
  ): Promise<AttachmentVersion | null> {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(AttachmentVersions)
      .where(
        and(
          eq(AttachmentVersions.attachmentId, attachmentId),
          eq(AttachmentVersions.id, versionId),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async updateStatus(
    id: string,
    input: UpdateAttachmentStatusInput,
    options?: AttachmentRepositoryOptions,
  ): Promise<Attachment | null> {
    const client = this.client(options);
    const now = new Date();
    const [updated] = await client
      .update(Attachments)
      .set({
        ...input,
        updatedAt: now,
      })
      .where(eq(Attachments.id, id))
      .returning();

    return updated ?? null;
  }

  async updateVersionStorageKey(
    versionId: string,
    storageObjectKey: string,
    options?: AttachmentRepositoryOptions,
  ): Promise<AttachmentVersion | null> {
    const client = this.client(options);
    const [updated] = await client
      .update(AttachmentVersions)
      .set({ storageObjectKey })
      .where(eq(AttachmentVersions.id, versionId))
      .returning();

    return updated ?? null;
  }

  async deleteById(id: string, options?: AttachmentRepositoryOptions): Promise<void> {
    const client = this.client(options);
    await client.delete(Attachments).where(eq(Attachments.id, id));
  }

  private client(options?: AttachmentRepositoryOptions): DbClient {
    if (this.isDbClient(options?.tx)) {
      return options.tx;
    }
    return this.db;
  }

  private isDbClient(tx: unknown): tx is DbClient {
    return (
      typeof tx === "object" && tx !== null && "insert" in tx && typeof tx.insert === "function"
    );
  }
}
