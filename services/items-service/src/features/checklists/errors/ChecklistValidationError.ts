import { ApplicationError } from "@pine/errors";

export class ChecklistValidationError extends ApplicationError {
  constructor(message: string) {
    super("CHECKLIST_VALIDATION_ERROR", message, true);
  }
}
