import { ApplicationError } from "@pine/errors";

export class SectionNotFoundError extends ApplicationError {
  constructor(message = "Section not found") {
    super("SECTION_NOT_FOUND", message, true);
  }
}
