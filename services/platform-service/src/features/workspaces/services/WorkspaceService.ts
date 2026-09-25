import { OWNER, requirePermission, type IAuthorizationClient } from "@pine/authorization";
import {
  CloudEvent,
  createCloudEvent,
  WorkspaceCreatedEvent,
  WorkspaceRelationCreatedEvent,
  type WorkspaceCreatedData,
  type WorkspaceRelationCreatedData,
} from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { Database, Workspace } from "@/db";
import {
  InvalidParentWorkspaceError,
  WorkspaceNameConflictError,
  WorkspaceNotFoundError,
  WorkspaceSlugConflictError,
} from "@/features/workspaces/errors";
import type { IWorkspaceRepository } from "@/features/workspaces/repositories";
import type {
  CreateWorkspaceInput,
  IWorkspaceService,
  ListWorkspacesInput,
  UpdateWorkspaceInput,
} from "@/features/workspaces/services/IWorkspaceService";
import { buildWorkspaceForest, type WorkspaceNode } from "@/features/workspaces/utils";
import { TenantNotFoundError } from "@/features/tenants/errors";
import type { ITenantRepository } from "@/features/tenants/repositories";

@injectable()
export class WorkspaceService implements IWorkspaceService {
  constructor(
    @inject(TYPES.WorkspaceRepository)
    private readonly workspaceRepository: IWorkspaceRepository,
    @inject(TYPES.TenantRepository)
    private readonly tenantRepository: ITenantRepository,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
    @inject(TYPES.Database)
    private readonly db: Database,
  ) {}

  async create(input: CreateWorkspaceInput, identityId: string): Promise<Workspace> {
    await requirePermission(
      this.authorizationClient,
      identityId,
      "create_workspace",
      `tenant:${input.tenantId}`,
    );

    const tenant = await this.tenantRepository.findById(input.tenantId);
    if (!tenant) {
      throw new TenantNotFoundError(`Tenant not found: ${input.tenantId}`);
    }

    if (input.parentWorkspaceId) {
      const parent = await this.workspaceRepository.findById(input.parentWorkspaceId);
      if (!parent || parent.tenantId !== input.tenantId) {
        throw new InvalidParentWorkspaceError(
          `Parent workspace not found in tenant: ${input.parentWorkspaceId}`,
        );
      }
    }

    const slugExists = await this.workspaceRepository.existsBySlugInTenant(
      input.tenantId,
      input.slug,
    );
    if (slugExists) {
      throw new WorkspaceSlugConflictError(
        `Workspace slug already exists in tenant: ${input.slug}`,
      );
    }

    const nameExists = await this.workspaceRepository.existsByNameInTenant(
      input.tenantId,
      input.name,
    );
    if (nameExists) {
      throw new WorkspaceNameConflictError(
        `Workspace name already exists in tenant: ${input.name}`,
      );
    }

    return this.db.transaction(async (tx) => {
      const workspace = await this.workspaceRepository.save(
        {
          tenantId: input.tenantId,
          parentWorkspaceId: input.parentWorkspaceId,
          name: input.name,
          slug: input.slug,
          description: input.description,
          isActive: input.isActive,
        },
        { tx },
      );

      const created: CloudEvent<WorkspaceCreatedData> = createCloudEvent({
        type: WorkspaceCreatedEvent.type,
        version: WorkspaceCreatedEvent.version,
        schema: WorkspaceCreatedEvent.schema,
        source: "pine/platform-service",
        subject: workspace.id,
        data: {
          id: workspace.id,
          tenantId: workspace.tenantId,
          name: workspace.name,
          slug: workspace.slug,
          isActive: workspace.isActive,
          version: workspace.version,
          createdAt: workspace.createdAt.toISOString(),
          ...(workspace.description != null ? { description: workspace.description } : {}),
          ...(workspace.parentWorkspaceId != null
            ? { parentWorkspaceId: workspace.parentWorkspaceId }
            : {}),
        },
      });

      await this.outboxService.schedule(
        {
          eventId: created.id,
          eventType: created.type,
          eventVersion: WorkspaceCreatedEvent.version,
          aggregateType: "workspace",
          aggregateId: workspace.id,
          payload: created,
        },
        { tx },
      );

      const ownerRelationId = `${workspace.id}:${OWNER}:${identityId}`;
      const ownerRelation: CloudEvent<WorkspaceRelationCreatedData> = createCloudEvent({
        type: WorkspaceRelationCreatedEvent.type,
        version: WorkspaceRelationCreatedEvent.version,
        schema: WorkspaceRelationCreatedEvent.schema,
        source: "pine/platform-service",
        subject: ownerRelationId,
        data: {
          id: ownerRelationId,
          workspaceId: workspace.id,
          identityId,
          relation: OWNER,
          createdAt: new Date().toISOString(),
        },
      });

      await this.outboxService.schedule(
        {
          eventId: ownerRelation.id,
          eventType: ownerRelation.type,
          eventVersion: WorkspaceRelationCreatedEvent.version,
          aggregateType: "workspace-relation",
          aggregateId: workspace.id,
          payload: ownerRelation,
        },
        { tx },
      );

      return workspace;
    });
  }

  async getById(id: string, identityId: string): Promise<Workspace> {
    await requirePermission(this.authorizationClient, identityId, "read", `workspace:${id}`);

    const workspace = await this.workspaceRepository.findById(id);
    if (!workspace) {
      throw new WorkspaceNotFoundError(`Workspace not found: ${id}`);
    }

    return workspace;
  }

  async list(input: ListWorkspacesInput, identityId: string): Promise<Workspace[]> {
    await requirePermission(
      this.authorizationClient,
      identityId,
      "read_list",
      `tenant:${input.tenantId}`,
    );

    const tenant = await this.tenantRepository.findById(input.tenantId);
    if (!tenant) {
      throw new TenantNotFoundError(`Tenant not found: ${input.tenantId}`);
    }

    return this.workspaceRepository.findMany({
      tenantId: input.tenantId,
      parentWorkspaceId: input.parentWorkspaceId,
    });
  }

  async listMyWorkspaces(identityId: string): Promise<WorkspaceNode[]> {
    const relationships = await this.authorizationClient.listRelationships({
      namespace: "workspace",
      subject: { namespace: "identity", id: identityId },
    });

    const workspaceIds = Array.from(
      new Set(relationships.map((rel) => rel.object.id).filter((id) => id.length > 0)),
    );

    if (workspaceIds.length === 0) return [];

    const workspaces = await this.workspaceRepository.findByIds(workspaceIds);
    return buildWorkspaceForest(workspaces);
  }

  async update(id: string, input: UpdateWorkspaceInput, identityId: string): Promise<Workspace> {
    await requirePermission(this.authorizationClient, identityId, "update", `workspace:${id}`);

    const workspace = await this.workspaceRepository.findById(id);
    if (!workspace) {
      throw new WorkspaceNotFoundError(`Workspace not found: ${id}`);
    }

    if (input.parentWorkspaceId !== undefined) {
      await this.assertValidParentWorkspace(workspace, input.parentWorkspaceId);
    }

    const updated = await this.workspaceRepository.update(id, {
      parentWorkspaceId: input.parentWorkspaceId,
    });
    if (!updated) {
      throw new WorkspaceNotFoundError(`Workspace not found: ${id}`);
    }

    return updated;
  }

  async delete(id: string, identityId: string): Promise<void> {
    await requirePermission(this.authorizationClient, identityId, "delete", `workspace:${id}`);

    const deleted = await this.workspaceRepository.softDelete(id);
    if (!deleted) {
      throw new WorkspaceNotFoundError(`Workspace not found: ${id}`);
    }
  }

  private async assertValidParentWorkspace(
    workspace: Workspace,
    parentWorkspaceId: string | null,
  ): Promise<void> {
    if (!parentWorkspaceId) {
      return;
    }

    if (parentWorkspaceId === workspace.id) {
      throw new InvalidParentWorkspaceError(`Workspace cannot be its own parent: ${workspace.id}`);
    }

    const parent = await this.workspaceRepository.findById(parentWorkspaceId);
    if (!parent || parent.tenantId !== workspace.tenantId) {
      throw new InvalidParentWorkspaceError(
        `Parent workspace not found in tenant: ${parentWorkspaceId}`,
      );
    }

    let ancestorId = parent.parentWorkspaceId;
    const seen = new Set<string>([parent.id]);
    while (ancestorId) {
      if (ancestorId === workspace.id) {
        throw new InvalidParentWorkspaceError(
          `Parent workspace would create a cycle: ${parentWorkspaceId}`,
        );
      }
      if (seen.has(ancestorId)) {
        break;
      }
      seen.add(ancestorId);
      const ancestor = await this.workspaceRepository.findById(ancestorId);
      if (!ancestor) {
        break;
      }
      ancestorId = ancestor.parentWorkspaceId;
    }
  }
}
