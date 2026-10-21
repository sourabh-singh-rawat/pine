import { uuidv7 } from "@pine/common";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { type Database, type OrganizationMember, OrganizationMembers } from "@/db";
import type {
  CreateOrganizationMemberEntity,
  IOrganizationMemberRepository,
  OrganizationMemberRepositoryOptions,
} from "@/features/organization-members/repositories/IOrganizationMemberRepository";

@injectable()
export class OrganizationMemberRepository implements IOrganizationMemberRepository {
  constructor(@inject(TYPES.Database) private readonly db: Database) {}

  async saveOrganizationMember(
    entity: CreateOrganizationMemberEntity,
    options?: OrganizationMemberRepositoryOptions,
  ): Promise<OrganizationMember> {
    const client = this.client(options);
    const now = new Date();

    const [created] = await client
      .insert(OrganizationMembers)
      .values({
        id: uuidv7(),
        organizationId: entity.organizationId,
        identityId: entity.identityId,
        role: entity.role,
        createdAt: now,
        version: 1,
      })
      .returning();

    return created;
  }

  async findOrganizationMemberById(
    id: string,
    options?: OrganizationMemberRepositoryOptions,
  ): Promise<OrganizationMember | null> {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(OrganizationMembers)
      .where(and(eq(OrganizationMembers.id, id), isNull(OrganizationMembers.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async findOrganizationMemberByOrganizationAndIdentity(
    organizationId: string,
    identityId: string,
    options?: OrganizationMemberRepositoryOptions,
  ): Promise<OrganizationMember | null> {
    const client = this.client(options);
    const [row] = await client
      .select()
      .from(OrganizationMembers)
      .where(
        and(
          eq(OrganizationMembers.organizationId, organizationId),
          eq(OrganizationMembers.identityId, identityId),
          isNull(OrganizationMembers.deletedAt),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async listOrganizationMembersByOrganizationId(
    organizationId: string,
    options?: OrganizationMemberRepositoryOptions,
  ): Promise<OrganizationMember[]> {
    const client = this.client(options);
    return client
      .select()
      .from(OrganizationMembers)
      .where(
        and(
          eq(OrganizationMembers.organizationId, organizationId),
          isNull(OrganizationMembers.deletedAt),
        ),
      )
      .orderBy(desc(OrganizationMembers.createdAt));
  }

  async updateOrganizationMemberRole(
    id: string,
    role: string,
    options?: OrganizationMemberRepositoryOptions,
  ): Promise<OrganizationMember | null> {
    const client = this.client(options);
    const now = new Date();

    const [updated] = await client
      .update(OrganizationMembers)
      .set({
        role,
        updatedAt: now,
        version: sql`${OrganizationMembers.version} + 1`,
      })
      .where(and(eq(OrganizationMembers.id, id), isNull(OrganizationMembers.deletedAt)))
      .returning();

    return updated ?? null;
  }

  async deleteOrganizationMember(
    id: string,
    options?: OrganizationMemberRepositoryOptions,
  ): Promise<boolean> {
    const client = this.client(options);
    const now = new Date();

    const deleted = await client
      .update(OrganizationMembers)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${OrganizationMembers.version} + 1`,
      })
      .where(and(eq(OrganizationMembers.id, id), isNull(OrganizationMembers.deletedAt)))
      .returning({ id: OrganizationMembers.id });

    return deleted.length > 0;
  }

  private client(options?: OrganizationMemberRepositoryOptions) {
    return options?.tx ?? this.db;
  }
}
