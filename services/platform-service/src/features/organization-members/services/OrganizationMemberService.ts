import { requirePermission } from "@pine/authorization";
import type { IAuthorizationClient } from "@pine/authorization";
import {
  createCloudEvent,
  OrganizationMemberCreatedEvent,
  OrganizationMemberDeletedEvent,
} from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { Database, OrganizationMember } from "@/db";
import { OrganizationNotFoundError } from "@/features/organizations/errors";
import type { IOrganizationRepository } from "@/features/organizations/repositories";
import {
  InvalidOrganizationMemberRoleError,
  OrganizationMemberConflictError,
  OrganizationMemberNotFoundError,
} from "@/features/organization-members/errors";
import { OrganizationMemberRole } from "@/features/organization-members/constants";
import type { IOrganizationMemberRepository } from "@/features/organization-members/repositories";
import type {
  CreateOrganizationMemberInput,
  IOrganizationMemberService,
} from "./IOrganizationMemberService";

@injectable()
export class OrganizationMemberService implements IOrganizationMemberService {
  constructor(
    @inject(TYPES.OrganizationMemberRepository)
    private readonly organizationMemberRepository: IOrganizationMemberRepository,
    @inject(TYPES.OrganizationRepository)
    private readonly organizationRepository: IOrganizationRepository,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
    @inject(TYPES.Database)
    private readonly db: Database,
  ) {}

  async createOrganizationMember(
    input: CreateOrganizationMemberInput,
    actorId: string,
  ): Promise<OrganizationMember> {
    const role = this.normalizeRole(input.role);
    const target: `Organization:${string}` = `Organization:${input.organizationId}`;
    await requirePermission(this.authorizationClient, actorId, "manage_members", target);

    const organization = await this.organizationRepository.findById(input.organizationId);
    if (!organization) {
      throw new OrganizationNotFoundError(`Organization not found: ${input.organizationId}`);
    }

    const existing =
      await this.organizationMemberRepository.findOrganizationMemberByOrganizationAndIdentity(
        input.organizationId,
        input.identityId,
      );
    if (existing) {
      throw new OrganizationMemberConflictError(
        `Identity ${input.identityId} is already a member of organization ${input.organizationId}`,
      );
    }

    return this.db.transaction(async (tx) => {
      const member = await this.organizationMemberRepository.saveOrganizationMember(
        { organizationId: input.organizationId, identityId: input.identityId, role },
        { tx },
      );

      const event = createCloudEvent({
        type: OrganizationMemberCreatedEvent.type,
        version: OrganizationMemberCreatedEvent.version,
        schema: OrganizationMemberCreatedEvent.schema,
        source: "pine/platform-service",
        subject: member.id,
        data: {
          id: member.id,
          organizationId: member.organizationId,
          identityId: member.identityId,
          role: member.role,
          createdAt: member.createdAt.toISOString(),
        },
      });

      await this.outboxService.schedule(
        {
          eventId: event.id,
          eventType: event.type,
          eventVersion: OrganizationMemberCreatedEvent.version,
          aggregateType: "organization-member",
          aggregateId: member.organizationId,
          payload: event,
        },
        { tx },
      );

      return member;
    });
  }

  async getOrganizationMemberById(id: string, actorId: string): Promise<OrganizationMember> {
    const member = await this.organizationMemberRepository.findOrganizationMemberById(id);
    if (!member) {
      throw new OrganizationMemberNotFoundError(`Organization member not found: ${id}`);
    }
    await requirePermission(
      this.authorizationClient,
      actorId,
      "read",
      `Organization:${member.organizationId}`,
    );
    return member;
  }

  async listOrganizationMembers(
    organizationId: string,
    actorId: string,
  ): Promise<OrganizationMember[]> {
    await requirePermission(
      this.authorizationClient,
      actorId,
      "read",
      `Organization:${organizationId}`,
    );
    const organization = await this.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new OrganizationNotFoundError(`Organization not found: ${organizationId}`);
    }
    return this.organizationMemberRepository.listOrganizationMembersByOrganizationId(
      organizationId,
    );
  }

  async updateOrganizationMemberRole(
    id: string,
    newRoleInput: string,
    actorId: string,
  ): Promise<OrganizationMember> {
    const member = await this.organizationMemberRepository.findOrganizationMemberById(id);
    if (!member) {
      throw new OrganizationMemberNotFoundError(`Organization member not found: ${id}`);
    }

    const newRole = this.normalizeRole(newRoleInput);
    const memberRole = this.normalizeRole(member.role);
    if (memberRole === newRole) {
      return member;
    }

    const target: `Organization:${string}` = `Organization:${member.organizationId}`;
    await requirePermission(this.authorizationClient, actorId, "manage_members", target);

    return this.db.transaction(async (tx) => {
      const updated = await this.organizationMemberRepository.updateOrganizationMemberRole(
        id,
        newRole,
        { tx },
      );
      if (!updated) {
        throw new OrganizationMemberNotFoundError(`Organization member not found: ${id}`);
      }

      const deletedEvent = createCloudEvent({
        type: OrganizationMemberDeletedEvent.type,
        version: OrganizationMemberDeletedEvent.version,
        schema: OrganizationMemberDeletedEvent.schema,
        source: "pine/platform-service",
        subject: member.id,
        data: {
          id: member.id,
          organizationId: member.organizationId,
          identityId: member.identityId,
          role: member.role,
        },
      });

      await this.outboxService.schedule(
        {
          eventId: deletedEvent.id,
          eventType: deletedEvent.type,
          eventVersion: OrganizationMemberDeletedEvent.version,
          aggregateType: "organization-member",
          aggregateId: member.organizationId,
          payload: deletedEvent,
        },
        { tx },
      );

      const createdEvent = createCloudEvent({
        type: OrganizationMemberCreatedEvent.type,
        version: OrganizationMemberCreatedEvent.version,
        schema: OrganizationMemberCreatedEvent.schema,
        source: "pine/platform-service",
        subject: updated.id,
        data: {
          id: updated.id,
          organizationId: updated.organizationId,
          identityId: updated.identityId,
          role: updated.role,
          createdAt: updated.createdAt.toISOString(),
        },
      });

      await this.outboxService.schedule(
        {
          eventId: createdEvent.id,
          eventType: createdEvent.type,
          eventVersion: OrganizationMemberCreatedEvent.version,
          aggregateType: "organization-member",
          aggregateId: updated.organizationId,
          payload: createdEvent,
        },
        { tx },
      );

      return updated;
    });
  }

  async deleteOrganizationMember(id: string, actorId: string): Promise<void> {
    const member = await this.organizationMemberRepository.findOrganizationMemberById(id);
    if (!member) {
      throw new OrganizationMemberNotFoundError(`Organization member not found: ${id}`);
    }

    const target: `Organization:${string}` = `Organization:${member.organizationId}`;
    await requirePermission(this.authorizationClient, actorId, "manage_members", target);

    await this.db.transaction(async (tx) => {
      const deleted = await this.organizationMemberRepository.deleteOrganizationMember(id, { tx });
      if (!deleted) {
        throw new OrganizationMemberNotFoundError(`Organization member not found: ${id}`);
      }

      const event = createCloudEvent({
        type: OrganizationMemberDeletedEvent.type,
        version: OrganizationMemberDeletedEvent.version,
        schema: OrganizationMemberDeletedEvent.schema,
        source: "pine/platform-service",
        subject: member.id,
        data: {
          id: member.id,
          organizationId: member.organizationId,
          identityId: member.identityId,
          role: member.role,
        },
      });

      await this.outboxService.schedule(
        {
          eventId: event.id,
          eventType: event.type,
          eventVersion: OrganizationMemberDeletedEvent.version,
          aggregateType: "organization-member",
          aggregateId: member.organizationId,
          payload: event,
        },
        { tx },
      );
    });
  }

  private normalizeRole(role: string): OrganizationMemberRole {
    if (role === OrganizationMemberRole.OWNER || role === "owner") {
      return OrganizationMemberRole.OWNER;
    }
    if (role === OrganizationMemberRole.ADMIN || role === "admin") {
      return OrganizationMemberRole.ADMIN;
    }
    if (role === OrganizationMemberRole.MEMBER || role === "member") {
      return OrganizationMemberRole.MEMBER;
    }
    throw new InvalidOrganizationMemberRoleError(
      `Invalid organization member role: ${role}. Expected one of: owners, admins, members`,
    );
  }
}
