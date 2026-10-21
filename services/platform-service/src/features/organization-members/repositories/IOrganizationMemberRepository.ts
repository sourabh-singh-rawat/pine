import type { DbClient, OrganizationMember } from "@/db";

export type OrganizationMemberRepositoryOptions = { tx?: DbClient };

export type CreateOrganizationMemberEntity = {
  organizationId: string;
  identityId: string;
  role: string;
};

export interface IOrganizationMemberRepository {
  saveOrganizationMember: (
    entity: CreateOrganizationMemberEntity,
    options?: OrganizationMemberRepositoryOptions,
  ) => Promise<OrganizationMember>;
  findOrganizationMemberById: (
    id: string,
    options?: OrganizationMemberRepositoryOptions,
  ) => Promise<OrganizationMember | null>;
  findOrganizationMemberByOrganizationAndIdentity: (
    organizationId: string,
    identityId: string,
    options?: OrganizationMemberRepositoryOptions,
  ) => Promise<OrganizationMember | null>;
  listOrganizationMembersByOrganizationId: (
    organizationId: string,
    options?: OrganizationMemberRepositoryOptions,
  ) => Promise<OrganizationMember[]>;
  updateOrganizationMemberRole: (
    id: string,
    role: string,
    options?: OrganizationMemberRepositoryOptions,
  ) => Promise<OrganizationMember | null>;
  deleteOrganizationMember: (
    id: string,
    options?: OrganizationMemberRepositoryOptions,
  ) => Promise<boolean>;
}
