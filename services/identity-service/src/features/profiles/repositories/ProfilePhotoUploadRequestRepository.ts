import { uuidv7 } from "@pine/common";
import { eq } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type ProfilePhotoUploadRequest, ProfilePhotoUploadRequests } from "@/db";
import type {
  IProfilePhotoUploadRequestRepository,
  ProfilePhotoUploadRequestRepositoryOptions,
} from "@/features/profiles/repositories/IProfilePhotoUploadRequestRepository";

@injectable()
export class ProfilePhotoUploadRequestRepository implements IProfilePhotoUploadRequestRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async save(
    entity: {
      profileId: string;
      status: string;
      attachmentId?: string | null;
    },
    options?: ProfilePhotoUploadRequestRepositoryOptions,
  ): Promise<ProfilePhotoUploadRequest> {
    const client = this.client(options);
    const now = new Date();

    const [created] = await client
      .insert(ProfilePhotoUploadRequests)
      .values({
        id: uuidv7(),
        profileId: entity.profileId,
        status: entity.status,
        attachmentId: entity.attachmentId ?? null,
        createdAt: now,
      })
      .returning();

    return created;
  }

  async findById(
    id: string,
    options?: ProfilePhotoUploadRequestRepositoryOptions,
  ): Promise<ProfilePhotoUploadRequest | null> {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(ProfilePhotoUploadRequests)
      .where(eq(ProfilePhotoUploadRequests.id, id))
      .limit(1);

    return row ?? null;
  }

  async update(
    id: string,
    entity: Partial<Pick<ProfilePhotoUploadRequest, "status" | "attachmentId" | "completedAt">>,
    options?: ProfilePhotoUploadRequestRepositoryOptions,
  ): Promise<ProfilePhotoUploadRequest> {
    const client = this.client(options);

    const [updated] = await client
      .update(ProfilePhotoUploadRequests)
      .set({
        ...(entity.status !== undefined ? { status: entity.status } : {}),
        ...(entity.attachmentId !== undefined ? { attachmentId: entity.attachmentId } : {}),
        ...(entity.completedAt !== undefined ? { completedAt: entity.completedAt } : {}),
      })
      .where(eq(ProfilePhotoUploadRequests.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Profile photo upload request not found for update: ${id}`);
    }

    return updated;
  }

  private client(options?: ProfilePhotoUploadRequestRepositoryOptions) {
    return options?.tx ?? this.db;
  }
}
