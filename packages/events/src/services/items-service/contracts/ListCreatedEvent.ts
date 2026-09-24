import { defineEvent } from "../../../cloud-events";
import { ListDataSchema } from "../schemas";

export const ListCreatedEvent = defineEvent({
  type: "items.list.created",
  version: 1,
  schema: ListDataSchema,
});
