import { defineEvent } from "../../../cloud-events";
import { OrganizationRelationCreatedDataSchema } from "../schemas";

export const OrganizationRelationCreatedEvent = defineEvent({
  type: "platform.organization-relation.created",
  version: 1,
  schema: OrganizationRelationCreatedDataSchema,
});
