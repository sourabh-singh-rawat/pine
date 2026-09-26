import { ApplicationError } from "@pine/errors";

export class StatusNotFoundError extends ApplicationError {
  constructor(message = "Status not found") {
    super("STATUS_NOT_FOUND", message, true);
  }
}
