import { defineEvent } from "../../../cloud-events";
import { OrganizationUpdatedDataSchema } from "../schemas";

export const OrganizationUpdatedEvent = defineEvent({
  type: "platform.organization.updated",
  version: 1,
  schema: OrganizationUpdatedDataSchema,
});
