import { ApplicationError } from "@pine/errors";

export class StatusValidationError extends ApplicationError {
  constructor(message: string) {
    super("STATUS_VALIDATION_ERROR", message, true);
  }
}
