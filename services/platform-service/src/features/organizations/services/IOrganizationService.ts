import type { Organization } from "@/db";
import type { OrganizationNode } from "@/features/organizations/utils";

export type CreateOrganizationInput = {
  tenantId: string;
  parentOrganizationId?: string | null;
  organizationTypeId: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
};

export type ListOrganizationsInput = {
  tenantId: string;
  parentOrganizationId?: string | null;
};

export type UpdateOrganizationInput = {
  parentOrganizationId?: string | null;
};

export interface IOrganizationService {
  createOrganization: (input: CreateOrganizationInput, actorId: string) => Promise<Organization>;
  getOrganizationById: (id: string, actorId: string) => Promise<Organization>;
  listOrganizations: (input: ListOrganizationsInput, actorId: string) => Promise<Organization[]>;
  listMyOrganizations: (actorId: string) => Promise<OrganizationNode[]>;
  updateOrganization: (
    id: string,
    input: UpdateOrganizationInput,
    actorId: string,
  ) => Promise<Organization>;
  deleteOrganization: (id: string, actorId: string) => Promise<void>;
}
