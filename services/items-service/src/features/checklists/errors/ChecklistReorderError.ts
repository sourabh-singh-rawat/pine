import { ApplicationError } from "@pine/errors";

export class ChecklistReorderError extends ApplicationError {
  constructor(message = "Checklist entry reorder ids must match active entries") {
    super("CHECKLIST_REORDER_ERROR", message, true);
  }
}
