import { uuidv7 } from "@pine/common";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type TenantMember, TenantMembers } from "@/db";
import type {
  CreateTenantMemberEntity,
  ITenantMemberRepository,
  TenantMemberRepositoryOptions,
} from "@/features/tenant-members/repositories/ITenantMemberRepository";

@injectable()
export class TenantMemberRepository implements ITenantMemberRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async saveTenantMember(
    entity: CreateTenantMemberEntity,
    options?: TenantMemberRepositoryOptions,
  ): Promise<TenantMember> {
    const client = this.client(options);
    const now = new Date();

    const [created] = await client
      .insert(TenantMembers)
      .values({
        id: uuidv7(),
        tenantId: entity.tenantId,
        identityId: entity.identityId,
        role: entity.role,
        createdAt: now,
        version: 1,
      })
      .returning();

    return created;
  }

  async findTenantMemberById(
    id: string,
    options?: TenantMemberRepositoryOptions,
  ): Promise<TenantMember | null> {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(TenantMembers)
      .where(and(eq(TenantMembers.id, id), isNull(TenantMembers.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async findTenantMemberByTenantAndIdentity(
    tenantId: string,
    identityId: string,
    options?: TenantMemberRepositoryOptions,
  ): Promise<TenantMember | null> {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(TenantMembers)
      .where(
        and(
          eq(TenantMembers.tenantId, tenantId),
          eq(TenantMembers.identityId, identityId),
          isNull(TenantMembers.deletedAt),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async listTenantMembersByTenantId(
    tenantId: string,
    options?: TenantMemberRepositoryOptions,
  ): Promise<TenantMember[]> {
    const client = this.client(options);
    return client
      .select()
      .from(TenantMembers)
      .where(and(eq(TenantMembers.tenantId, tenantId), isNull(TenantMembers.deletedAt)))
      .orderBy(desc(TenantMembers.createdAt));
  }

  async updateTenantMemberRole(
    id: string,
    role: string,
    options?: TenantMemberRepositoryOptions,
  ): Promise<TenantMember | null> {
    const client = this.client(options);
    const now = new Date();

    const [updated] = await client
      .update(TenantMembers)
      .set({
        role,
        updatedAt: now,
        version: sql`${TenantMembers.version} + 1`,
      })
      .where(and(eq(TenantMembers.id, id), isNull(TenantMembers.deletedAt)))
      .returning();

    return updated ?? null;
  }

  async deleteTenantMember(id: string, options?: TenantMemberRepositoryOptions): Promise<boolean> {
    const client = this.client(options);
    const now = new Date();

    const deleted = await client
      .update(TenantMembers)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${TenantMembers.version} + 1`,
      })
      .where(and(eq(TenantMembers.id, id), isNull(TenantMembers.deletedAt)))
      .returning({ id: TenantMembers.id });

    return deleted.length > 0;
  }

  private client(options?: TenantMemberRepositoryOptions) {
    return options?.tx ?? this.db;
  }
}
