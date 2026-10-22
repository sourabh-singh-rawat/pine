import type { DbClient, Profile } from "@/db";
import type { ProfileGender } from "@/features/profiles/constants";
import type { ProfilePhotoObject } from "@/integrations/storage";

export type CreateProfileOptions = {
  tx?: DbClient;
  identityId: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  description?: string;
  gender?: ProfileGender;
};

export type UpdateNameOptions = {
  identityId: string;
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
};

export type UpdateGenderOptions = {
  identityId: string;
  gender: ProfileGender;
};

export type DeleteProfileOptions = {
  tx: DbClient;
  identityId: string;
};

export type UploadProfilePhotoOptions = {
  identityId: string;
  contentType: string;
  body: Buffer;
};

export interface IProfileService {
  create: (options: CreateProfileOptions) => Promise<Profile>;
  getByIdentityId: (identityId: string) => Promise<Profile>;
  updateName: (options: UpdateNameOptions) => Promise<Profile>;
  updateGender: (options: UpdateGenderOptions) => Promise<Profile>;
  uploadPhoto: (options: UploadProfilePhotoOptions) => Promise<Profile>;
  getProfilePhoto: (identityId: string) => Promise<ProfilePhotoObject>;
  delete: (options: DeleteProfileOptions) => Promise<void>;
}
