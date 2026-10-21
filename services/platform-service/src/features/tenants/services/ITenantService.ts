import type { Tenant } from "@/db";

export type CreateTenantInput = {
  platformId: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
};

export interface ITenantService {
  createTenant: (input: CreateTenantInput, actorId: string) => Promise<Tenant>;
  getTenantById: (id: string, actorId: string) => Promise<Tenant>;
  listTenants: (platformId: string, actorId: string) => Promise<Tenant[]>;
  listMyTenants: (actorId: string) => Promise<Tenant[]>;
  suspendTenant: (id: string, platformId: string, actorId: string) => Promise<Tenant>;
  deleteTenant: (id: string, platformId: string, actorId: string) => Promise<void>;
}
