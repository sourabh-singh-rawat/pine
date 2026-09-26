import { ApplicationError } from "@pine/errors";

export class StatusReorderError extends ApplicationError {
  constructor(message = "Status order is invalid") {
    super("STATUS_REORDER_ERROR", message, true);
  }
}
