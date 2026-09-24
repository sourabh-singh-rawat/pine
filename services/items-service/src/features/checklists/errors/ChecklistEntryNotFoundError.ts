import { ApplicationError } from "@pine/errors";

export class ChecklistEntryNotFoundError extends ApplicationError {
  constructor(message = "Checklist entry not found") {
    super("CHECKLIST_ENTRY_NOT_FOUND", message, true);
  }
}
