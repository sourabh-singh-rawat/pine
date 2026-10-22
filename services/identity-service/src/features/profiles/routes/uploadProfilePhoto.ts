import { UnauthorizedError } from "@pine/common";
import type { HttpRoute } from "@pine/server";
import { json } from "@pine/server";
import { container } from "@/bootstrap";
import { TYPES } from "@/bootstrap/container-types";
import { InvalidProfilePhotoError } from "@/features/profiles/errors";
import {
  UploadProfilePhotoResponseSchema,
  type UploadProfilePhotoData,
} from "@/features/profiles/schemas";
import type { IProfileService } from "@/features/profiles/services";

export const uploadProfilePhoto: HttpRoute = {
  url: "/identity/me/photo",
  method: "POST",
  schema: {
    tags: ["auth"],
    summary: "Upload the current user's profile photo",
    description: "Store a JPEG, PNG, or WebP profile photo for the signed-in identity",
    operationId: "uploadProfilePhoto",
    response: {
      200: UploadProfilePhotoResponseSchema,
    },
  },
  handler: async (request) => {
    if (!request.identity) {
      throw new UnauthorizedError();
    }

    if (!request.isMultipart()) {
      throw new InvalidProfilePhotoError("Profile photo must be an image file");
    }

    const file = await request.file();
    if (!file) {
      throw new InvalidProfilePhotoError("Profile photo file is required");
    }

    const service = container.get<IProfileService>(TYPES.ProfileService);
    const profile = await service.uploadPhoto({
      identityId: request.identity.id,
      contentType: file.mimetype,
      body: await file.toBuffer(),
    });

    if (!profile.photoUrl) {
      throw new InvalidProfilePhotoError("Profile photo could not be saved");
    }

    const response: UploadProfilePhotoData = {
      photoUrl: profile.photoUrl,
    };

    return json(response);
  },
};
