import { BadRequestError } from "@pine/common";

export class InvalidProfilePhotoError extends BadRequestError {
  constructor(message = "Invalid profile photo") {
    super(message);
  }
}
