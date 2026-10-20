import { defineEvent } from "../../../cloud-events";
import { TenantMemberDeletedDataSchema } from "../schemas";

export const TenantMemberDeletedEvent = defineEvent({
  type: "platform.tenant-member.deleted",
  version: 1,
  schema: TenantMemberDeletedDataSchema,
});
