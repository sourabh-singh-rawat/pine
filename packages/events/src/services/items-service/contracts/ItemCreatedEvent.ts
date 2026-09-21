import { defineEvent } from "../../../cloud-events";
import { ItemCreatedDataSchema } from "../schemas";

export const ItemCreatedEvent = defineEvent({
  type: "items.item.created",
  version: 1,
  schema: ItemCreatedDataSchema,
});
