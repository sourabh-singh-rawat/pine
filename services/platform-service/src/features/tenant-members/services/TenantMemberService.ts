import { requirePermission } from "@pine/authorization";
import type { IAuthorizationClient, TenantPermission } from "@pine/authorization";
import { createCloudEvent, TenantMemberCreatedEvent, TenantMemberDeletedEvent } from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { Database, TenantMember } from "@/db";
import { TenantNotFoundError } from "@/features/tenants/errors";
import { InvalidTenantMemberRoleError, TenantMemberConflictError } from "../errors";
import { TenantMemberNotFoundError } from "../errors";
import { TenantMemberRole } from "@/features/tenant-members/constants";
import type { ITenantMemberRepository } from "@/features/tenant-members/repositories";
import type { CreateTenantMemberInput } from "./ITenantMemberService";
import type { ITenantMemberService } from "./ITenantMemberService";
import type { ITenantRepository } from "@/features/tenants/repositories";

@injectable()
export class TenantMemberService implements ITenantMemberService {
  constructor(
    @inject(TYPES.TenantMemberRepository)
    private readonly tenantMemberRepository: ITenantMemberRepository,
    @inject(TYPES.TenantRepository)
    private readonly tenantRepository: ITenantRepository,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
    @inject(TYPES.Database)
    private readonly db: Database,
  ) {}

  async createTenantMember(input: CreateTenantMemberInput, actorId: string): Promise<TenantMember> {
    const role = this.normalizeRole(input.role);
    const permission = this.permissionForRole(role);
    const target: `Tenant:${string}` = `Tenant:${input.tenantId}`;
    await requirePermission(this.authorizationClient, actorId, permission, target);

    const tenant = await this.tenantRepository.findById(input.tenantId);
    if (!tenant) {
      throw new TenantNotFoundError(`Tenant not found: ${input.tenantId}`);
    }

    const existing = await this.tenantMemberRepository.findTenantMemberByTenantAndIdentity(
      input.tenantId,
      input.identityId,
    );
    if (existing) {
      throw new TenantMemberConflictError(
        `Identity ${input.identityId} is already a member of tenant ${input.tenantId}`,
      );
    }

    return this.db.transaction(async (tx) => {
      const member = await this.tenantMemberRepository.saveTenantMember(
        { tenantId: input.tenantId, identityId: input.identityId, role },
        { tx },
      );

      const event = createCloudEvent({
        type: TenantMemberCreatedEvent.type,
        version: TenantMemberCreatedEvent.version,
        schema: TenantMemberCreatedEvent.schema,
        source: "pine/platform-service",
        subject: member.id,
        data: {
          id: member.id,
          tenantId: member.tenantId,
          identityId: member.identityId,
          role: member.role,
          createdAt: member.createdAt.toISOString(),
        },
      });

      await this.outboxService.schedule(
        {
          eventId: event.id,
          eventType: event.type,
          eventVersion: TenantMemberCreatedEvent.version,
          aggregateType: "tenant-member",
          aggregateId: member.tenantId,
          payload: event,
        },
        { tx },
      );

      return member;
    });
  }

  async getTenantMemberById(id: string, actorId: string): Promise<TenantMember> {
    const member = await this.tenantMemberRepository.findTenantMemberById(id);
    if (!member) {
      throw new TenantMemberNotFoundError(`Tenant member not found: ${id}`);
    }
    await requirePermission(this.authorizationClient, actorId, "read", `Tenant:${member.tenantId}`);
    return member;
  }

  async listTenantMembers(tenantId: string, actorId: string): Promise<TenantMember[]> {
    await requirePermission(this.authorizationClient, actorId, "read", `Tenant:${tenantId}`);
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new TenantNotFoundError(`Tenant not found: ${tenantId}`);
    }
    return this.tenantMemberRepository.listTenantMembersByTenantId(tenantId);
  }

  async updateTenantMemberRole(
    id: string,
    newRoleInput: string,
    actorId: string,
  ): Promise<TenantMember> {
    const member = await this.tenantMemberRepository.findTenantMemberById(id);
    if (!member) {
      throw new TenantMemberNotFoundError(`Tenant member not found: ${id}`);
    }

    const newRole = this.normalizeRole(newRoleInput);
    const memberRole = this.normalizeRole(member.role);
    if (memberRole === newRole) {
      return member;
    }

    const currentPermission = this.permissionForRole(memberRole);
    const newPermission = this.permissionForRole(newRole);
    const target: `Tenant:${string}` = `Tenant:${member.tenantId}`;
    await requirePermission(this.authorizationClient, actorId, currentPermission, target);
    await requirePermission(this.authorizationClient, actorId, newPermission, target);

    return this.db.transaction(async (tx) => {
      const updated = await this.tenantMemberRepository.updateTenantMemberRole(id, newRole, { tx });
      if (!updated) {
        throw new TenantMemberNotFoundError(`Tenant member not found: ${id}`);
      }

      const deletedEvent = createCloudEvent({
        type: TenantMemberDeletedEvent.type,
        version: TenantMemberDeletedEvent.version,
        schema: TenantMemberDeletedEvent.schema,
        source: "pine/platform-service",
        subject: member.id,
        data: {
          id: member.id,
          tenantId: member.tenantId,
          identityId: member.identityId,
          role: member.role,
        },
      });

      await this.outboxService.schedule(
        {
          eventId: deletedEvent.id,
          eventType: deletedEvent.type,
          eventVersion: TenantMemberDeletedEvent.version,
          aggregateType: "tenant-member",
          aggregateId: member.tenantId,
          payload: deletedEvent,
        },
        { tx },
      );

      const createdEvent = createCloudEvent({
        type: TenantMemberCreatedEvent.type,
        version: TenantMemberCreatedEvent.version,
        schema: TenantMemberCreatedEvent.schema,
        source: "pine/platform-service",
        subject: updated.id,
        data: {
          id: updated.id,
          tenantId: updated.tenantId,
          identityId: updated.identityId,
          role: updated.role,
          createdAt: updated.createdAt.toISOString(),
        },
      });

      await this.outboxService.schedule(
        {
          eventId: createdEvent.id,
          eventType: createdEvent.type,
          eventVersion: TenantMemberCreatedEvent.version,
          aggregateType: "tenant-member",
          aggregateId: updated.tenantId,
          payload: createdEvent,
        },
        { tx },
      );

      return updated;
    });
  }

  async deleteTenantMember(id: string, actorId: string): Promise<void> {
    const member = await this.tenantMemberRepository.findTenantMemberById(id);
    if (!member) {
      throw new TenantMemberNotFoundError(`Tenant member not found: ${id}`);
    }

    const role = this.normalizeRole(member.role);
    const permission = this.permissionForRole(role);
    const target: `Tenant:${string}` = `Tenant:${member.tenantId}`;
    await requirePermission(this.authorizationClient, actorId, permission, target);

    await this.db.transaction(async (tx) => {
      const deleted = await this.tenantMemberRepository.deleteTenantMember(id, { tx });
      if (!deleted) {
        throw new TenantMemberNotFoundError(`Tenant member not found: ${id}`);
      }

      const event = createCloudEvent({
        type: TenantMemberDeletedEvent.type,
        version: TenantMemberDeletedEvent.version,
        schema: TenantMemberDeletedEvent.schema,
        source: "pine/platform-service",
        subject: member.id,
        data: {
          id: member.id,
          tenantId: member.tenantId,
          identityId: member.identityId,
          role: member.role,
        },
      });

      await this.outboxService.schedule(
        {
          eventId: event.id,
          eventType: event.type,
          eventVersion: TenantMemberDeletedEvent.version,
          aggregateType: "tenant-member",
          aggregateId: member.tenantId,
          payload: event,
        },
        { tx },
      );
    });
  }

  private normalizeRole(role: string): TenantMemberRole {
    if (role === TenantMemberRole.OWNER || role === "owner") return TenantMemberRole.OWNER;
    if (role === TenantMemberRole.ADMIN || role === "admin") return TenantMemberRole.ADMIN;
    if (role === TenantMemberRole.MEMBER || role === "member") return TenantMemberRole.MEMBER;
    throw new InvalidTenantMemberRoleError(
      `Invalid tenant member role: ${role}. Expected one of: owners, admins, members`,
    );
  }

  private permissionForRole(role: TenantMemberRole): TenantPermission {
    if (role === TenantMemberRole.OWNER) return "assign_owner";
    if (role === TenantMemberRole.ADMIN) return "assign_admin";
    return "manage_members";
  }
}
