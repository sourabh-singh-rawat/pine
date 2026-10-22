import { NotFoundError } from "@pine/common";

export class ProfilePhotoNotFoundError extends NotFoundError {
  constructor() {
    super("Profile photo");
  }
}
