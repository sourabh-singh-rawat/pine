import { ApplicationError } from "@pine/errors";

export class SpaceNotFoundError extends ApplicationError {
  constructor(message = "Space not found") {
    super("SPACE_NOT_FOUND", message, true);
  }
}
