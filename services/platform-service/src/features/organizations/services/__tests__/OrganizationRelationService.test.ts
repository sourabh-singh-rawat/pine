import { ADMIN, MEMBER, OWNER } from "@pine/authorization";
import { OrganizationRelationCreatedEvent } from "@pine/events";
import { describe, expect, it, vi } from "vitest";
import { InvalidOrganizationRelationError } from "@/features/organizations/errors";
import { OrganizationRelationService } from "@/features/organizations/services/OrganizationRelationService";

const organizationId = "org-1";
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

describe("OrganizationRelationService", () => {
  it("schedules an organization relation created event", async () => {
    const authorizationClient = allowAuth();
    const outboxService = {
      schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
    };
    const db = createDbMock();
    const service = new OrganizationRelationService(authorizationClient, outboxService, db);

    const relation = await service.create(
      {
        organizationId,
        relation: ADMIN,
        identityId,
      },
      actorId,
    );

    expect(authorizationClient.ensureRelationship).not.toHaveBeenCalled();
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: OrganizationRelationCreatedEvent.type,
        eventVersion: OrganizationRelationCreatedEvent.version,
        aggregateType: "organization-relation",
        aggregateId: organizationId,
        payload: expect.objectContaining({
          type: OrganizationRelationCreatedEvent.type,
          subject: `${organizationId}:${ADMIN}:${identityId}`,
          data: expect.objectContaining({
            organizationId,
            identityId,
            relation: ADMIN,
          }),
        }),
      }),
      { tx: { tx: true } },
    );
    expect(relation.relation).toBe(ADMIN);
    expect(relation.organizationId).toBe(organizationId);
    expect(relation.identityId).toBe(identityId);
  });

  it("deletes an organization relation", async () => {
    const authorizationClient = allowAuth();
    const service = new OrganizationRelationService(
      authorizationClient,
      { schedule: vi.fn() },
      createDbMock(),
    );

    await service.delete(`${organizationId}:${ADMIN}:${identityId}`, actorId);

    expect(authorizationClient.deleteRelationship).toHaveBeenCalledWith({
      object: { namespace: "organization", id: organizationId },
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
            object: { namespace: "organization", id: organizationId },
            relation: OWNER,
            subject: { namespace: "identity", id: identityId },
          },
        ];
      }
      if (relation === MEMBER) {
        return [
          {
            object: { namespace: "organization", id: organizationId },
            relation: MEMBER,
            subject: { namespace: "identity", id: "user-2" },
          },
        ];
      }
      return [];
    });
    const service = new OrganizationRelationService(
      authorizationClient,
      { schedule: vi.fn() },
      createDbMock(),
    );

    await expect(service.list({ organizationId }, actorId)).resolves.toEqual([
      {
        id: `${organizationId}:${OWNER}:${identityId}`,
        organizationId,
        identityId,
        relation: OWNER,
      },
      {
        id: `${organizationId}:${MEMBER}:user-2`,
        organizationId,
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
        object: { namespace: "organization", id: organizationId },
        relation: ADMIN,
        subject: { namespace: "identity", id: identityId },
      },
    ]);
    const service = new OrganizationRelationService(
      authorizationClient,
      { schedule: vi.fn() },
      createDbMock(),
    );

    await expect(service.list({ organizationId, relation: ADMIN }, actorId)).resolves.toEqual([
      {
        id: `${organizationId}:${ADMIN}:${identityId}`,
        organizationId,
        identityId,
        relation: ADMIN,
      },
    ]);
    expect(authorizationClient.listRelationships).toHaveBeenCalledTimes(1);
  });

  it("rejects an invalid relation", async () => {
    const authorizationClient = allowAuth();
    const service = new OrganizationRelationService(
      authorizationClient,
      { schedule: vi.fn() },
      createDbMock(),
    );

    await expect(
      service.list({ organizationId, relation: "viewer" }, actorId),
    ).rejects.toBeInstanceOf(InvalidOrganizationRelationError);
  });
});
