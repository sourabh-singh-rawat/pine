import {
  requirePermission,
  type IAuthorizationClient,
} from "@pine/authorization";
import { ListNotFoundError, STATUS_TYPE, UserNotFoundError } from "@pine/common";
import { createCloudEvent, ListCreatedEvent, ListUpdatedEvent } from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { Database, List } from "@/db";
import type { IIdentityRepository } from "@/features/identities/repositories";
import type { IListRepository } from "@/features/lists/repositories";
import { SpaceNotFoundError } from "@/features/spaces/errors";
import type { ISpaceRepository } from "@/features/spaces/repositories";
import type { IStatusService } from "@/features/status/services/IStatusService";
import type {
  CreateListOptions,
  GetListOptions,
  IListService,
  ListListsOptions,
  UpdateListOptions,
} from "./IListService";

@injectable()
export class ListService implements IListService {
  constructor(
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.ListRepository)
    private readonly listRepository: IListRepository,
    @inject(TYPES.SpaceRepository)
    private readonly spaceRepository: ISpaceRepository,
    @inject(TYPES.IdentityRepository)
    private readonly identityRepository: IIdentityRepository,
    @inject(TYPES.StatusService)
    private readonly statusService: IStatusService,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
    @inject(TYPES.OutboxService)
    private readonly outboxService: IOutboxService,
  ) {}

  async create(options: CreateListOptions) {
    const { name, userId, spaceId } = options;

    const space = await this.spaceRepository.findById(spaceId);
    if (!space) {
      throw new SpaceNotFoundError();
    }

    await requirePermission(
      this.authorizationClient,
      userId,
      "create_list",
      `workspace:${space.workspaceId}`,
    );

    return this.db.transaction(async (tx) => {
      const identity = await this.identityRepository.findById(userId, { tx });
      if (!identity) throw new UserNotFoundError();

      const savedList = await this.listRepository.save(
        {
          spaceId,
          name,
          createdById: userId,
        },
        { tx },
      );

      await this.statusService.createOptions({
        listId: savedList.id,
        statuses: [
          { name: "To Do", type: STATUS_TYPE.NOT_STARTED, orderIndex: 0 },
          { name: "In Progress", type: STATUS_TYPE.ACTIVE, orderIndex: 1 },
          { name: "Done", type: STATUS_TYPE.COMPLETED, orderIndex: 2 },
          { name: "Cancelled", type: STATUS_TYPE.CLOSED, orderIndex: 3 },
        ],
        tx,
      });

      const event = createCloudEvent({
        type: ListCreatedEvent.type,
        version: ListCreatedEvent.version,
        schema: ListCreatedEvent.schema,
        source: "pine/items-service",
        subject: savedList.id,
        data: this.toListEventData(savedList),
      });

      await this.outboxService.schedule(
        {
          eventId: event.id,
          eventType: event.type,
          eventVersion: ListCreatedEvent.version,
          aggregateType: "list",
          aggregateId: savedList.id,
          payload: event,
        },
        { tx },
      );

      return savedList.id;
    });
  }

  async list(options: ListListsOptions) {
    const { page, pageSize, userId, spaceId } = options;

    const space = await this.spaceRepository.findById(spaceId);
    if (!space) {
      throw new SpaceNotFoundError();
    }

    await requirePermission(
      this.authorizationClient,
      userId,
      "read",
      `workspace:${space.workspaceId}`,
    );

    return this.listRepository.findBySpaceId(spaceId, page, pageSize);
  }

  async getById(options: GetListOptions) {
    const { id, userId } = options;
    const list = await this.listRepository.findById(id);
    if (!list) {
      throw new ListNotFoundError();
    }

    const space = await this.spaceRepository.findById(list.spaceId);
    if (!space) {
      throw new SpaceNotFoundError();
    }

    await requirePermission(
      this.authorizationClient,
      userId,
      "read",
      `workspace:${space.workspaceId}`,
    );

    return list;
  }

  async update(options: UpdateListOptions) {
    const { id, name } = options;

    await this.db.transaction(async (tx) => {
      const updatedList = await this.listRepository.update(id, { name }, { tx });

      const event = createCloudEvent({
        type: ListUpdatedEvent.type,
        version: ListUpdatedEvent.version,
        schema: ListUpdatedEvent.schema,
        source: "pine/items-service",
        subject: updatedList.id,
        data: this.toListEventData(updatedList),
      });

      await this.outboxService.schedule(
        {
          eventId: event.id,
          eventType: event.type,
          eventVersion: ListUpdatedEvent.version,
          aggregateType: "list",
          aggregateId: updatedList.id,
          payload: event,
        },
        { tx },
      );
    });
  }

  private toListEventData(list: List) {
    return {
      id: list.id,
      spaceId: list.spaceId,
      name: list.name,
      status: "active",
      ownerUserId: list.createdById,
      createdAt: list.createdAt.toISOString(),
      ...(list.updatedAt != null ? { updatedAt: list.updatedAt.toISOString() } : {}),
    };
  }
}
