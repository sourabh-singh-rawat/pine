import { defineEvent } from "../../../cloud-events";
import { SpaceDataSchema } from "../schemas";

export const SpaceUpdatedEvent = defineEvent({
  type: "items.space.updated",
  version: 1,
  schema: SpaceDataSchema,
});
