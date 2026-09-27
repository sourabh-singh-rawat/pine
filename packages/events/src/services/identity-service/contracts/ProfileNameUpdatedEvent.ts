import { defineEvent } from "../../../cloud-events";
import { ProfileNameUpdatedDataSchema } from "../schemas";

export const ProfileNameUpdatedEvent = defineEvent({
  type: "identity.profile.name-updated",
  version: 1,
  schema: ProfileNameUpdatedDataSchema,
});
