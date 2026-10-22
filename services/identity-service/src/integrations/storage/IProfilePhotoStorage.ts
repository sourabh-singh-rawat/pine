import type { Readable } from "node:stream";

export type PutProfilePhotoInput = {
  identityId: string;
  contentType: string;
  body: Buffer;
};

export type ProfilePhotoObject = {
  body: Readable;
  contentType: string;
  contentLength?: number;
};

export interface IProfilePhotoStorage {
  putProfilePhoto: (input: PutProfilePhotoInput) => Promise<void>;
  getProfilePhoto: (identityId: string) => Promise<ProfilePhotoObject | null>;
}
