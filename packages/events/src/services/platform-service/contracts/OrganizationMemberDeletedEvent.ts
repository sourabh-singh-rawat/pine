import { defineEvent } from "../../../cloud-events";
import { OrganizationMemberDeletedDataSchema } from "../schemas";

export const OrganizationMemberDeletedEvent = defineEvent({
  type: "platform.organization-member.deleted",
  version: 1,
  schema: OrganizationMemberDeletedDataSchema,
});
