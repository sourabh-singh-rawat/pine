import { defineEvent } from "../../../cloud-events";
import { ProjectDataSchema } from "../schemas";

export const ProjectCreatedEvent = defineEvent({
  type: "items.project.created",
  version: 1,
  schema: ProjectDataSchema,
});
