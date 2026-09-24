import { Errors } from "./errors";
import { NotFoundError } from "./http";

export class ListNotFoundError extends NotFoundError {
  errorCode: string;
  errorMessage: string;

  constructor() {
    const message = "List not found";
    super(message);
    this.errorCode = Errors.ERR_LIST_NOT_FOUND;
    this.errorMessage = message;
  }
}
