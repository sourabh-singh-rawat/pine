import { defineEvent } from "../../../cloud-events";
import { ProjectDataSchema } from "../schemas";

export const ProjectUpdatedEvent = defineEvent({
  type: "items.project.updated",
  version: 1,
  schema: ProjectDataSchema,
});
