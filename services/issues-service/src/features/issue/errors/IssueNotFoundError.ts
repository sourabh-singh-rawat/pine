import { ApplicationError } from "@pine/errors";

export class IssueNotFoundError extends ApplicationError {
  constructor(message = "Issue not found") {
    super("ISSUE_NOT_FOUND", message, true);
  }
}
