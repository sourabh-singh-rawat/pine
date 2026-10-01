import { ApplicationError } from "@pine/errors";
import { ClientErrorCodes } from "@/features/clients/errors/ClientErrorCodes";

export class ClientNotFoundError extends ApplicationError {
  constructor(clientId: string) {
    super(ClientErrorCodes.CLIENT_NOT_FOUND, `OAuth client not found: ${clientId}`, true);
  }
}
