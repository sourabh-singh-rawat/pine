import {
  OWNER,
  PLATFORM_OBJECT_ID,
  tenantOwnerRelationship,
  type IAuthorizationClient,
} from "@pine/authorization";
import {
  CloudEvent,
  createCloudEvent,
  TenantCreatedEvent,
  WorkspaceCreatedEvent,
  WorkspaceRelationCreatedEvent,
  type TenantCreatedData,
  type WorkspaceCreatedData,
  type WorkspaceRelationCreatedData,
} from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { Database, DbClient, Tenant, Workspace } from "@/db";
import type { IIdentityRepository } from "@/features/identities/repositories";
import type {
  IOnboardingService,
  PersonalWorkspaceProvision,
} from "@/features/onboarding/services/IOnboardingService";
import type { ITenantRepository } from "@/features/tenants/repositories";
import type {
  IWorkspacePreferenceRepository,
  IWorkspaceRepository,
} from "@/features/workspaces/repositories";

const PERSONAL_TENANT_NAME = "Personal";
const PERSONAL_WORKSPACE_NAME = "Personal workspace";
const PERSONAL_WORKSPACE_SLUG = "default";

const personalTenantSlug = (identityId: string): string => `personal-${identityId}`;

@injectable()
export class OnboardingService implements IOnboardingService {
  constructor(
    @inject(TYPES.IdentityRepository)
    private readonly identityRepository: IIdentityRepository,
    @inject(TYPES.TenantRepository)
    private readonly tenantRepository: ITenantRepository,
    @inject(TYPES.WorkspaceRepository)
    private readonly workspaceRepository: IWorkspaceRepository,
    @inject(TYPES.WorkspacePreferenceRepository)
    private readonly workspacePreferenceRepository: IWorkspacePreferenceRepository,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
    @inject(TYPES.Database)
    private readonly db: Database,
  ) {}

  async provisionPersonalWorkspace(identityId: string): Promise<PersonalWorkspaceProvision> {
    const tenantSlug = personalTenantSlug(identityId);

    return this.db.transaction(async (tx) => {
      await this.identityRepository.upsert({ identityId }, { tx });

      const existingTenant = await this.tenantRepository.findBySlug(tenantSlug, { tx });
      if (existingTenant) {
        const workspace = await this.ensureDefaultWorkspace(existingTenant, identityId, tx);
        await this.workspacePreferenceRepository.upsert(
          {
            identityId,
            workspaceId: workspace.id,
            tenantId: existingTenant.id,
          },
          { tx },
        );
        return { tenant: existingTenant, workspace, created: false };
      }

      const tenant = await this.tenantRepository.save(
        {
          name: PERSONAL_TENANT_NAME,
          slug: tenantSlug,
          description: "Personal tenant",
          isActive: true,
        },
        { tx },
      );

      await this.authorizationClient.ensureRelationship(
        tenantOwnerRelationship(tenant.id, identityId),
      );

      const tenantCreated: CloudEvent<TenantCreatedData> = createCloudEvent({
        type: TenantCreatedEvent.type,
        version: TenantCreatedEvent.version,
        schema: TenantCreatedEvent.schema,
        source: "pine/platform-service",
        subject: tenant.id,
        data: {
          id: tenant.id,
          platformId: PLATFORM_OBJECT_ID,
          name: tenant.name,
          slug: tenant.slug,
          isActive: tenant.isActive,
          version: tenant.version,
          createdAt: tenant.createdAt.toISOString(),
          ...(tenant.description != null ? { description: tenant.description } : {}),
        },
      });

      await this.outboxService.schedule(
        {
          eventId: tenantCreated.id,
          eventType: tenantCreated.type,
          eventVersion: TenantCreatedEvent.version,
          aggregateType: "tenant",
          aggregateId: tenant.id,
          payload: tenantCreated,
        },
        { tx },
      );

      const workspace = await this.createDefaultWorkspace(tenant, identityId, tx);

      await this.workspacePreferenceRepository.upsert(
        {
          identityId,
          workspaceId: workspace.id,
          tenantId: tenant.id,
        },
        { tx },
      );

      return { tenant, workspace, created: true };
    });
  }

  private async ensureDefaultWorkspace(
    tenant: Tenant,
    identityId: string,
    tx: DbClient,
  ): Promise<Workspace> {
    const existing = await this.workspaceRepository.findMany({
      tenantId: tenant.id,
    });
    const defaultWorkspace = existing.find(
      (workspace) => workspace.slug === PERSONAL_WORKSPACE_SLUG,
    );
    if (defaultWorkspace) {
      return defaultWorkspace;
    }

    return this.createDefaultWorkspace(tenant, identityId, tx);
  }

  private async createDefaultWorkspace(
    tenant: Tenant,
    identityId: string,
    tx: DbClient,
  ): Promise<Workspace> {
    const workspace = await this.workspaceRepository.save(
      {
        tenantId: tenant.id,
        name: PERSONAL_WORKSPACE_NAME,
        slug: PERSONAL_WORKSPACE_SLUG,
        description: "Default personal workspace",
        isActive: true,
      },
      { tx },
    );

    const workspaceCreated: CloudEvent<WorkspaceCreatedData> = createCloudEvent({
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
      },
    });

    await this.outboxService.schedule(
      {
        eventId: workspaceCreated.id,
        eventType: workspaceCreated.type,
        eventVersion: WorkspaceCreatedEvent.version,
        aggregateType: "workspace",
        aggregateId: workspace.id,
        payload: workspaceCreated,
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
  }
}
