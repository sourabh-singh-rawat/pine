import type { OrganizationOfficeType } from "@/db";

export type CreateOfficeTypeInput = {
  tenantId: string;
  parentOfficeTypeId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
};

export interface IOfficeTypeService {
  create: (input: CreateOfficeTypeInput, identityId: string) => Promise<OrganizationOfficeType>;
  getById: (id: string, identityId: string) => Promise<OrganizationOfficeType>;
  list: (tenantId: string, identityId: string) => Promise<OrganizationOfficeType[]>;
  delete: (id: string, identityId: string) => Promise<void>;
}
