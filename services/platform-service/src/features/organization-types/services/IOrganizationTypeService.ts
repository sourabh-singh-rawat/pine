import type { OrganizationType } from "@/db";

export type CreateOrganizationTypeInput = {
  tenantId: string;
  parentOrganizationTypeId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
};

export interface IOrganizationTypeService {
  create: (input: CreateOrganizationTypeInput, identityId: string) => Promise<OrganizationType>;
  getById: (id: string, identityId: string) => Promise<OrganizationType>;
  list: (tenantId: string, identityId: string) => Promise<OrganizationType[]>;
  delete: (id: string, identityId: string) => Promise<void>;
}
