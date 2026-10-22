import type { HttpRoute } from "@pine/server";
import { StatusCodes } from "http-status-codes";
import Value from "typebox/value";
import { container } from "@/bootstrap";
import { TYPES } from "@/bootstrap/container-types";
import { InvalidProfilePhotoError } from "@/features/profiles/errors";
import { GetProfilePhotoParamsSchema } from "@/features/profiles/schemas";
import type { IProfileService } from "@/features/profiles/services";

const photoExtension = (contentType: string): string => {
  if (contentType === "image/png") {
    return "png";
  }
  if (contentType === "image/webp") {
    return "webp";
  }
  return "jpg";
};

export const getProfilePhoto: HttpRoute = {
  url: "/identity/profiles/:identityId/photo",
  method: "GET",
  schema: {
    tags: ["auth"],
    summary: "Get a profile photo",
    description: "Download the profile photo stored for an identity",
    operationId: "getProfilePhoto",
    params: GetProfilePhotoParamsSchema,
  },
  handler: async (request) => {
    if (!Value.Check(GetProfilePhotoParamsSchema, request.params)) {
      throw new InvalidProfilePhotoError("Profile photo identity is required");
    }

    const service = container.get<IProfileService>(TYPES.ProfileService);
    const content = await service.getProfilePhoto(request.params.identityId);
    const headers: Record<string, string> = {
      "content-type": content.contentType,
      "cache-control": "private, no-cache",
      "content-disposition": `inline; filename="photo.${photoExtension(content.contentType)}"`,
    };
    if (content.contentLength !== undefined) {
      headers["content-length"] = content.contentLength.toString();
    }

    return {
      status: StatusCodes.OK,
      headers,
      body: content.body,
    };
  },
};
