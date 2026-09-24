import { defineEvent } from "../../../cloud-events";
import { SpaceDataSchema } from "../schemas";

export const SpaceCreatedEvent = defineEvent({
  type: "items.space.created",
  version: 1,
  schema: SpaceDataSchema,
});
