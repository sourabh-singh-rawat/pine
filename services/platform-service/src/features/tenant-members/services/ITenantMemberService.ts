import type { TenantMember } from "@/db";

export type CreateTenantMemberInput = {
  tenantId: string;
  identityId: string;
  role: string;
};

export interface ITenantMemberService {
  createTenantMember: (input: CreateTenantMemberInput, actorId: string) => Promise<TenantMember>;
  getTenantMemberById: (id: string, actorId: string) => Promise<TenantMember>;
  listTenantMembers: (tenantId: string, actorId: string) => Promise<TenantMember[]>;
  updateTenantMemberRole: (id: string, role: string, actorId: string) => Promise<TenantMember>;
  deleteTenantMember: (id: string, actorId: string) => Promise<void>;
}
