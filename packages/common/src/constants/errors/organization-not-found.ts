import { Errors } from "./errors";
import { NotFoundError } from "./http";

export class OrganizationNotFound extends NotFoundError {
  errorCode: string;
  errorMessage: string;

  constructor() {
    const message = "Organization not found";
    super(message);
    this.errorCode = Errors.ERR_ORGANIZATION_NOT_FOUND;
    this.errorMessage = message;
  }
}
