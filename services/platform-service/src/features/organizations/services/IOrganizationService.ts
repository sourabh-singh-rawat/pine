import type { Organization } from "@/db";
import type { OrganizationNode } from "@/features/organizations/utils";

export type CreateOrganizationInput = {
  tenantId: string;
  parentOrganizationId?: string | null;
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
  create: (input: CreateOrganizationInput, identityId: string) => Promise<Organization>;
  getById: (id: string, identityId: string) => Promise<Organization>;
  list: (input: ListOrganizationsInput, identityId: string) => Promise<Organization[]>;
  listMyOrganizations: (identityId: string) => Promise<OrganizationNode[]>;
  update: (id: string, input: UpdateOrganizationInput, identityId: string) => Promise<Organization>;
  delete: (id: string, identityId: string) => Promise<void>;
}
