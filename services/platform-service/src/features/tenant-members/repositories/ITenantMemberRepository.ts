import type { DbClient, TenantMember } from "@/db";

export type TenantMemberRepositoryOptions = { tx?: DbClient };

export type CreateTenantMemberEntity = {
  tenantId: string;
  identityId: string;
  role: string;
};

export interface ITenantMemberRepository {
  saveTenantMember: (
    entity: CreateTenantMemberEntity,
    options?: TenantMemberRepositoryOptions,
  ) => Promise<TenantMember>;
  findTenantMemberById: (
    id: string,
    options?: TenantMemberRepositoryOptions,
  ) => Promise<TenantMember | null>;
  findTenantMemberByTenantAndIdentity: (
    tenantId: string,
    identityId: string,
    options?: TenantMemberRepositoryOptions,
  ) => Promise<TenantMember | null>;
  listTenantMembersByTenantId: (
    tenantId: string,
    options?: TenantMemberRepositoryOptions,
  ) => Promise<TenantMember[]>;
  updateTenantMemberRole: (
    id: string,
    role: string,
    options?: TenantMemberRepositoryOptions,
  ) => Promise<TenantMember | null>;
  deleteTenantMember: (id: string, options?: TenantMemberRepositoryOptions) => Promise<boolean>;
}
