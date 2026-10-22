import { defineEvent } from "../../../cloud-events";
import { ProfilePhotoUpdatedDataSchema } from "../schemas";

export const ProfilePhotoUpdatedEvent = defineEvent({
  type: "identity.profile.photo-updated",
  version: 1,
  schema: ProfilePhotoUpdatedDataSchema,
});
