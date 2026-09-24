import { defineEvent } from "../../../cloud-events";
import { ListMemberDataSchema } from "../schemas";

export const ListMemberInvitedEvent = defineEvent({
  type: "items.list.member-invited",
  version: 1,
  schema: ListMemberDataSchema,
});
