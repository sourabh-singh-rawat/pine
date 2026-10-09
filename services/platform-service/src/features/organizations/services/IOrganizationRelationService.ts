export type OrganizationRelation = {
  id: string;
  organizationId: string;
  identityId: string;
  relation: string;
};

export type CreateOrganizationRelationInput = {
  organizationId: string;
  relation: string;
  identityId: string;
};

export type ListOrganizationRelationsInput = {
  organizationId: string;
  relation?: string;
  identityId?: string;
};

export type CreateOrganizationRelationOptions = {
  skipAuthorization?: boolean;
};

export interface IOrganizationRelationService {
  create: (
    input: CreateOrganizationRelationInput,
    identityId: string,
    options?: CreateOrganizationRelationOptions,
  ) => Promise<OrganizationRelation>;
  getById: (id: string, identityId: string) => Promise<OrganizationRelation>;
  list: (
    input: ListOrganizationRelationsInput,
    identityId: string,
  ) => Promise<OrganizationRelation[]>;
  delete: (id: string, identityId: string) => Promise<void>;
}
