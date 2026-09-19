import { ADMIN, MEMBER, OWNER } from "@pine/authorization";
import { WorkspaceRelationCreatedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { InvalidWorkspaceRelationError } from "@/features/workspaces/errors";
import { WorkspaceRelationService } from "@/features/workspaces/services/WorkspaceRelationService";

const workspaceId = "org-1";
const identityId = "user-1";
const actorId = "actor-1";

const allowAuth = () => ({
  checkRelationship: vi.fn().mockResolvedValue(true),
  ensureRelationship: vi.fn().mockResolvedValue(undefined),
  deleteRelationship: vi.fn().mockResolvedValue(undefined),
  listRelationships: vi.fn().mockResolvedValue([]),
});

const createDbMock = (tx: { tx: boolean } = { tx: true }) => ({
  transaction: vi.fn(async (cb: (tx: { tx: boolean }) => Promise<unknown>) => cb(tx)),
});

describe("WorkspaceRelationService", () => {
  it("schedules an workspace relation created event", async () => {
    const authorizationClient = allowAuth();
    const outboxService = {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    };
    const db = createDbMock();
    const service = new WorkspaceRelationService(authorizationClient, outboxService, db);

    const relation = await service.create(
      {
        workspaceId,
        relation: ADMIN,
        identityId,
      },
      actorId,
    );

    expect(authorizationClient.ensureRelationship).not.toHaveBeenCalled();
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: WorkspaceRelationCreatedEvent.type,
        eventVersion: WorkspaceRelationCreatedEvent.version,
        aggregateType: "workspace-relation",
        aggregateId: workspaceId,
        payload: expect.objectContaining({
          type: WorkspaceRelationCreatedEvent.type,
          subject: `${workspaceId}:${ADMIN}:${identityId}`,
          data: expect.objectContaining({
            workspaceId,
            identityId,
            relation: ADMIN,
          }),
        }),
      }),
      { tx: { tx: true } },
    );
    expect(relation.relation).toBe(ADMIN);
    expect(relation.workspaceId).toBe(workspaceId);
    expect(relation.identityId).toBe(identityId);
  });

  it("deletes an workspace relation", async () => {
    const authorizationClient = allowAuth();
    const service = new WorkspaceRelationService(
      authorizationClient,
      { schedule: vi.fn() },
      createDbMock(),
    );

    await service.delete(`${workspaceId}:${ADMIN}:${identityId}`, actorId);

    expect(authorizationClient.deleteRelationship).toHaveBeenCalledWith({
      object: { namespace: "workspace", id: workspaceId },
      relation: ADMIN,
      subject: { namespace: "identity", id: identityId },
    });
  });

  it("lists owner, admin, and member relations", async () => {
    const authorizationClient = allowAuth();
    authorizationClient.listRelationships.mockImplementation(async ({ relation }) => {
      if (relation === OWNER) {
        return [
          {
            object: { namespace: "workspace", id: workspaceId },
            relation: OWNER,
            subject: { namespace: "identity", id: identityId },
          },
        ];
      }
      if (relation === MEMBER) {
        return [
          {
            object: { namespace: "workspace", id: workspaceId },
            relation: MEMBER,
            subject: { namespace: "identity", id: "user-2" },
          },
        ];
      }
      return [];
    });
    const service = new WorkspaceRelationService(
      authorizationClient,
      { schedule: vi.fn() },
      createDbMock(),
    );

    await expect(service.list({ workspaceId }, actorId)).resolves.toEqual([
      {
        id: `${workspaceId}:${OWNER}:${identityId}`,
        workspaceId,
        identityId,
        relation: OWNER,
      },
      {
        id: `${workspaceId}:${MEMBER}:user-2`,
        workspaceId,
        identityId: "user-2",
        relation: MEMBER,
      },
    ]);
    expect(authorizationClient.checkRelationship).toHaveBeenCalled();
  });

  it("filters by relation", async () => {
    const authorizationClient = allowAuth();
    authorizationClient.listRelationships.mockResolvedValue([
      {
        object: { namespace: "workspace", id: workspaceId },
        relation: ADMIN,
        subject: { namespace: "identity", id: identityId },
      },
    ]);
    const service = new WorkspaceRelationService(
      authorizationClient,
      { schedule: vi.fn() },
      createDbMock(),
    );

    await expect(
      service.list({ workspaceId, relation: ADMIN }, actorId),
    ).resolves.toEqual([
      {
        id: `${workspaceId}:${ADMIN}:${identityId}`,
        workspaceId,
        identityId,
        relation: ADMIN,
      },
    ]);
    expect(authorizationClient.listRelationships).toHaveBeenCalledTimes(1);
  });

  it("rejects an invalid relation", async () => {
    const authorizationClient = allowAuth();
    const service = new WorkspaceRelationService(
      authorizationClient,
      { schedule: vi.fn() },
      createDbMock(),
    );

    await expect(
      service.list({ workspaceId, relation: "viewer" }, actorId),
    ).rejects.toBeInstanceOf(InvalidWorkspaceRelationError);
  });
});
