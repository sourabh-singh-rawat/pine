import { requirePermission, type IAuthorizationClient } from "@pine/authorization";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { IdentityOrganizationPreference } from "@/db";
import { OrganizationNotFoundError } from "@/features/organizations/errors";
import type { IOrganizationPreferenceRepository } from "@/features/organizations/repositories/IOrganizationPreferenceRepository";
import type { IOrganizationRepository } from "@/features/organizations/repositories/IOrganizationRepository";
import type { IOrganizationPreferenceService } from "@/features/organizations/services/IOrganizationPreferenceService";

@injectable()
export class OrganizationPreferenceService implements IOrganizationPreferenceService {
  constructor(
    @inject(TYPES.OrganizationPreferenceRepository)
    private readonly preferenceRepository: IOrganizationPreferenceRepository,
    @inject(TYPES.OrganizationRepository)
    private readonly organizationRepository: IOrganizationRepository,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
  ) {}

  async get(identityId: string) {
    return this.preferenceRepository.findByIdentityId(identityId);
  }

  async set(organizationId: string, identityId: string): Promise<IdentityOrganizationPreference> {
    const organization = await this.organizationRepository.findById(organizationId);
    if (!organization || organization.isActive === false) {
      throw new OrganizationNotFoundError(`Organization not found: ${organizationId}`);
    }

    await requirePermission(
      this.authorizationClient,
      identityId,
      "read",
      `organization:${organizationId}`,
    );

    return this.preferenceRepository.upsert({
      identityId,
      organizationId: organization.id,
      tenantId: organization.tenantId,
    });
  }
}
