import type { OrganizationMember } from "@/db";

export type CreateOrganizationMemberInput = {
  organizationId: string;
  identityId: string;
  role: string;
};

export interface IOrganizationMemberService {
  createOrganizationMember: (
    input: CreateOrganizationMemberInput,
    actorId: string,
  ) => Promise<OrganizationMember>;
  getOrganizationMemberById: (id: string, actorId: string) => Promise<OrganizationMember>;
  listOrganizationMembers: (
    organizationId: string,
    actorId: string,
  ) => Promise<OrganizationMember[]>;
  updateOrganizationMemberRole: (
    id: string,
    role: string,
    actorId: string,
  ) => Promise<OrganizationMember>;
  deleteOrganizationMember: (id: string, actorId: string) => Promise<void>;
}
