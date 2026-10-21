import { defineEvent } from "../../../cloud-events";
import { OrganizationMemberCreatedDataSchema } from "../schemas";

export const OrganizationMemberCreatedEvent = defineEvent({
  type: "platform.organization-member.created",
  version: 1,
  schema: OrganizationMemberCreatedDataSchema,
});
