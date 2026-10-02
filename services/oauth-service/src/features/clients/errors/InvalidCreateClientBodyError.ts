import { ApplicationError } from "@pine/errors";
import { ClientErrorCodes } from "@/features/clients/errors/ClientErrorCodes";

export class InvalidCreateClientBodyError extends ApplicationError {
  constructor(message = "Invalid create OAuth client body") {
    super(ClientErrorCodes.INVALID_CREATE_CLIENT_BODY, message, true);
  }
}
