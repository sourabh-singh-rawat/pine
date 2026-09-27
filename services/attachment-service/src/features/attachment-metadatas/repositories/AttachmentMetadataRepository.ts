import { and, eq } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import {
  type AttachmentMetadata,
  AttachmentMetadatas,
  type Database,
  type DbClient,
  type NewAttachmentMetadata,
} from "@/db";
import type {
  AttachmentMetadataRepositoryOptions,
  IAttachmentMetadataRepository,
} from "./IAttachmentMetadataRepository";

@injectable()
export class AttachmentMetadataRepository implements IAttachmentMetadataRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async save(
    entity: NewAttachmentMetadata,
    options?: AttachmentMetadataRepositoryOptions,
  ): Promise<AttachmentMetadata> {
    const client = this.client(options);
    const [created] = await client.insert(AttachmentMetadatas).values(entity).returning();

    return created;
  }

  async findByVersionId(
    attachmentId: string,
    versionId: string,
    options?: AttachmentMetadataRepositoryOptions,
  ): Promise<AttachmentMetadata | null> {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(AttachmentMetadatas)
      .where(
        and(
          eq(AttachmentMetadatas.attachmentId, attachmentId),
          eq(AttachmentMetadatas.versionId, versionId),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  private client(options?: AttachmentMetadataRepositoryOptions): DbClient {
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
