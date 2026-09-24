import type { Attachment, DbClient } from "@/db";

export type AttachmentRepositoryOptions = { tx?: DbClient };

export type UpsertAttachmentEntity = {
  id: string;
  scopeType: string;
  scopeId: string;
  status: string;
  createdBy: string;
  tenantId?: string | null;
};

export interface IAttachmentRepository {
  upsert: (
    entity: UpsertAttachmentEntity,
    options?: AttachmentRepositoryOptions,
  ) => Promise<Attachment>;
  findById: (id: string, options?: AttachmentRepositoryOptions) => Promise<Attachment | null>;
}
