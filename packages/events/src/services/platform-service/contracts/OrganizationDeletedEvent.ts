import { defineEvent } from "../../../cloud-events";
import { OrganizationDeletedDataSchema } from "../schemas";

export const OrganizationDeletedEvent = defineEvent({
  type: "platform.organization.deleted",
  version: 1,
  schema: OrganizationDeletedDataSchema,
});
