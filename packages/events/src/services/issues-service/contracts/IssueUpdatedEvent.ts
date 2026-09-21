import { defineEvent } from "../../../cloud-events";
import { IssueUpdatedDataSchema } from "../schemas";

export const IssueUpdatedEvent = defineEvent({
  type: "issues.issue.updated",
  version: 1,
  schema: IssueUpdatedDataSchema,
});
