import { ApplicationError } from "@pine/errors";

export class ChecklistNotFoundError extends ApplicationError {
  constructor(message = "Checklist not found") {
    super("CHECKLIST_NOT_FOUND", message, true);
  }
}
