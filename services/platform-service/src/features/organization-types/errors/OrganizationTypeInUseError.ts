import { ApplicationError } from "@pine/errors";

export class OrganizationTypeInUseError extends ApplicationError {
  constructor(message = "Organization type is used as a parent") {
    super("ORGANIZATION_TYPE_IN_USE", message, true);
  }
}
