import {
  PLATFORM_OBJECT_ID,
  requirePermission,
  type IAuthorizationClient,
} from "@pine/authorization";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { Identity } from "@/db";
import type { IIdentityRepository } from "@/features/identities/repositories";
import type { IIdentityService } from "@/features/identities/services/IIdentityService";

@injectable()
export class IdentityService implements IIdentityService {
  constructor(
    @inject(TYPES.IdentityRepository)
    private readonly identityRepository: IIdentityRepository,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
  ) {}

  listIdentities = async (platformId: string, identityId: string): Promise<Identity[]> => {
    await requirePermission(
      this.authorizationClient,
      identityId,
      "read",
      `Platform:${PLATFORM_OBJECT_ID}`,
    );
    return this.identityRepository.findAll();
  };
}
