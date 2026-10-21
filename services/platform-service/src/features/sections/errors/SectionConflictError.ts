import { ApplicationError } from "@pine/errors";

export class SectionConflictError extends ApplicationError {
  constructor(message = "Section already exists") {
    super("SECTION_CONFLICT", message, true);
  }
}
