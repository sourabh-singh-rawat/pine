import { defineEvent } from "../../../cloud-events";
import { OrganizationCreatedDataSchema } from "../schemas";

export const OrganizationCreatedEvent = defineEvent({
  type: "platform.organization.created",
  version: 1,
  schema: OrganizationCreatedDataSchema,
});
