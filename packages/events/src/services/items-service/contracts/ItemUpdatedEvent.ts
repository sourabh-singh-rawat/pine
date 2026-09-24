import { defineEvent } from "../../../cloud-events";
import { ItemUpdatedDataSchema } from "../schemas";

export const ItemUpdatedEvent = defineEvent({
  type: "items.item.updated",
  version: 1,
  schema: ItemUpdatedDataSchema,
});
