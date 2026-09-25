import type { DbClient, ProfilePhotoUploadRequest } from "@/db";

export type ProfilePhotoUploadRequestRepositoryOptions = { tx: DbClient };

export interface IProfilePhotoUploadRequestRepository {
  save(
    entity: {
      profileId: string;
      status: string;
      attachmentId?: string | null;
    },
    options?: ProfilePhotoUploadRequestRepositoryOptions,
  ): Promise<ProfilePhotoUploadRequest>;
  findById(
    id: string,
    options?: ProfilePhotoUploadRequestRepositoryOptions,
  ): Promise<ProfilePhotoUploadRequest | null>;
  update(
    id: string,
    entity: Partial<Pick<ProfilePhotoUploadRequest, "status" | "attachmentId" | "completedAt">>,
    options?: ProfilePhotoUploadRequestRepositoryOptions,
  ): Promise<ProfilePhotoUploadRequest>;
}
