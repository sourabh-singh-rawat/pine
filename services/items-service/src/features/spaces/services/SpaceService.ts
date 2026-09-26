import { requirePermission, type IAuthorizationClient } from "@pine/authorization";
import { UserNotFoundError } from "@pine/common";
import { createCloudEvent, SpaceCreatedEvent, SpaceUpdatedEvent } from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { DbClient, Space } from "@/db";
import type { IIdentityRepository } from "@/features/identities/repositories";
import { SpaceNotFoundError } from "@/features/spaces/errors";
import type { ISpaceRepository } from "@/features/spaces/repositories";
import type {
  CreateSpaceInput,
  ISpaceService,
  ListSpacesInput,
  UpdateSpaceOptions,
} from "@/features/spaces/services/ISpaceService";

export type SpaceDatabase = {
  transaction: <T>(callback: (tx: DbClient) => Promise<T>) => Promise<T>;
};

@injectable()
export class SpaceService implements ISpaceService {
  constructor(
    @inject(TYPES.SpaceRepository)
    private readonly spaceRepository: ISpaceRepository,
    @inject(TYPES.IdentityRepository)
    private readonly identityRepository: IIdentityRepository,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
    @inject(TYPES.Database)
    private readonly db: SpaceDatabase,
  ) {}

  async create(input: CreateSpaceInput, identityId: string): Promise<Space> {
    await requirePermission(
      this.authorizationClient,
      identityId,
      "create_space",
      `workspace:${input.workspaceId}`,
    );

    return this.db.transaction(async (tx) => {
      const identity = await this.identityRepository.findById(identityId, { tx });
      if (!identity) {
        throw new UserNotFoundError();
      }

      const space = await this.spaceRepository.save(
        {
          workspaceId: input.workspaceId,
          name: input.name,
          createdById: identityId,
        },
        { tx },
      );

      const event = createCloudEvent({
        type: SpaceCreatedEvent.type,
        version: SpaceCreatedEvent.version,
        schema: SpaceCreatedEvent.schema,
        source: "pine/items-service",
        subject: space.id,
        data: this.toSpaceEventData(space),
      });

      await this.outboxService.schedule(
        {
          eventId: event.id,
          eventType: event.type,
          eventVersion: SpaceCreatedEvent.version,
          aggregateType: "space",
          aggregateId: space.id,
          payload: event,
        },
        { tx },
      );

      return space;
    });
  }

  async getById(id: string, identityId: string): Promise<Space> {
    const space = await this.spaceRepository.findById(id);
    if (!space) {
      throw new SpaceNotFoundError(`Space not found: ${id}`);
    }

    await requirePermission(
      this.authorizationClient,
      identityId,
      "read",
      `workspace:${space.workspaceId}`,
    );

    return space;
  }

  async list(input: ListSpacesInput, identityId: string): Promise<Space[]> {
    await requirePermission(
      this.authorizationClient,
      identityId,
      "read",
      `workspace:${input.workspaceId}`,
    );

    return this.spaceRepository.findMany({ workspaceId: input.workspaceId });
  }

  async update(options: UpdateSpaceOptions): Promise<void> {
    const { id, name, identityId } = options;

    const space = await this.spaceRepository.findById(id);
    if (!space) {
      throw new SpaceNotFoundError(`Space not found: ${id}`);
    }

    await requirePermission(
      this.authorizationClient,
      identityId,
      "update",
      `workspace:${space.workspaceId}`,
    );

    await this.db.transaction(async (tx) => {
      const updatedSpace = await this.spaceRepository.update(id, { name }, { tx });

      const event = createCloudEvent({
        type: SpaceUpdatedEvent.type,
        version: SpaceUpdatedEvent.version,
        schema: SpaceUpdatedEvent.schema,
        source: "pine/items-service",
        subject: updatedSpace.id,
        data: this.toSpaceEventData(updatedSpace),
      });

      await this.outboxService.schedule(
        {
          eventId: event.id,
          eventType: event.type,
          eventVersion: SpaceUpdatedEvent.version,
          aggregateType: "space",
          aggregateId: updatedSpace.id,
          payload: event,
        },
        { tx },
      );
    });
  }

  private toSpaceEventData(space: Space) {
    return {
      id: space.id,
      workspaceId: space.workspaceId,
      name: space.name,
      createdById: space.createdById,
      createdAt: space.createdAt.toISOString(),
      ...(space.updatedAt != null ? { updatedAt: space.updatedAt.toISOString() } : {}),
    };
  }
}
