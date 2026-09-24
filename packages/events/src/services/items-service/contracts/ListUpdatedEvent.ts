import { defineEvent } from "../../../cloud-events";
import { ListDataSchema } from "../schemas";

export const ListUpdatedEvent = defineEvent({
  type: "items.list.updated",
  version: 1,
  schema: ListDataSchema,
});
