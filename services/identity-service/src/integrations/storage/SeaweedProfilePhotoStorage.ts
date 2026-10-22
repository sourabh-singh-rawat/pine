import { Readable } from "node:stream";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { injectable } from "inversify";
import { env } from "@/bootstrap/env";
import type {
  IProfilePhotoStorage,
  ProfilePhotoObject,
  PutProfilePhotoInput,
} from "@/integrations/storage/IProfilePhotoStorage";

const profilePhotoObjectKey = (identityId: string): string => `profiles/${identityId}`;

const isMissingObject = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null || !("name" in error)) {
    return false;
  }
  const name = error.name;
  return name === "NoSuchKey" || name === "NotFound";
};

@injectable()
export class SeaweedProfilePhotoStorage implements IProfilePhotoStorage {
  private readonly s3 = new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY,
      secretAccessKey: env.S3_SECRET_KEY,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  async putProfilePhoto(input: PutProfilePhotoInput): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: env.IDENTITY_S3_BUCKET,
      Key: profilePhotoObjectKey(input.identityId),
      ContentType: input.contentType,
      ContentLength: input.body.byteLength,
      Body: input.body,
    });
    await this.s3.send(command);
  }

  async getProfilePhoto(identityId: string): Promise<ProfilePhotoObject | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: env.IDENTITY_S3_BUCKET,
        Key: profilePhotoObjectKey(identityId),
      });
      const response = await this.s3.send(command);
      if (!response.Body) {
        return null;
      }

      const body = response.Body;
      const contentType = response.ContentType ?? "application/octet-stream";
      const contentLength = response.ContentLength;

      if (body instanceof Readable) {
        return {
          body,
          contentType,
          ...(contentLength !== undefined ? { contentLength } : {}),
        };
      }

      if ("transformToWebStream" in body && typeof body.transformToWebStream === "function") {
        return {
          body: Readable.from(body.transformToWebStream()),
          contentType,
          ...(contentLength !== undefined ? { contentLength } : {}),
        };
      }

      return null;
    } catch (error) {
      if (isMissingObject(error)) {
        return null;
      }
      throw error;
    }
  }
}
