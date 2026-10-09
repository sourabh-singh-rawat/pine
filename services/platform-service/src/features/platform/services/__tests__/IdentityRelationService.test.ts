import {
  ADMIN,
  IDENTITY,
  MEMBER,
  OWNER,
  PLATFORM_OBJECT_ID,
  InsufficientPermissionError,
  type GraphRelationship,
  type IAuthorizationClient,
  type ListRelationshipsInput,
} from "@pine/authorization";
import { describe, expect, it, vi } from "vitest";
import { IdentityRelationService } from "@/features/platform/services/IdentityRelationService";

const targetIdentityId = "user-1";
const callerIdentityId = "admin-1";

const createAuthorizationClient = (
  overrides: Partial<IAuthorizationClient> = {},
): IAuthorizationClient => ({
  checkRelationship: vi.fn().mockResolvedValue(true),
  ensureRelationship: vi.fn().mockResolvedValue({ created: true }),
  deleteRelationship: vi.fn().mockResolvedValue({ deleted: true }),
  listRelationships: vi.fn().mockResolvedValue([]),
  ...overrides,
});

describe("IdentityRelationService", () => {
  it("lists platform, tenant, and organization memberships for an identity", async () => {
    const listRelationships = vi
      .fn()
      .mockImplementation(async (input: ListRelationshipsInput): Promise<GraphRelationship[]> => {
        if (input.namespace === "platform") {
          return [
            {
              object: { namespace: "platform", id: PLATFORM_OBJECT_ID },
              relation: ADMIN,
              subject: { namespace: IDENTITY, id: targetIdentityId },
            },
          ];
        }
        if (input.namespace === "tenant") {
          return [
            {
              object: { namespace: "tenant", id: "tenant-1" },
              relation: OWNER,
              subject: { namespace: IDENTITY, id: targetIdentityId },
            },
          ];
        }
        return [
          {
            object: { namespace: "organization", id: "org-1" },
            relation: MEMBER,
            subject: { namespace: IDENTITY, id: targetIdentityId },
          },
        ];
      });

    const authorizationClient = createAuthorizationClient({ listRelationships });
    const service = new IdentityRelationService(authorizationClient);
    const result = await service.list(targetIdentityId, callerIdentityId);

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "platform",
      object: PLATFORM_OBJECT_ID,
      relation: "manage_admins",
      subject: `${IDENTITY}:${callerIdentityId}`,
    });
    expect(listRelationships).toHaveBeenCalledWith({
      namespace: "platform",
      subject: { namespace: IDENTITY, id: targetIdentityId },
    });
    expect(listRelationships).toHaveBeenCalledWith({
      namespace: "tenant",
      subject: { namespace: IDENTITY, id: targetIdentityId },
    });
    expect(listRelationships).toHaveBeenCalledWith({
      namespace: "organization",
      subject: { namespace: IDENTITY, id: targetIdentityId },
    });
    expect(listRelationships).toHaveBeenCalledTimes(3);
    expect(result.identityId).toBe(targetIdentityId);
    expect(result.platform).toEqual([
      {
        id: `${PLATFORM_OBJECT_ID}:${ADMIN}:${targetIdentityId}`,
        identityId: targetIdentityId,
        relation: ADMIN,
      },
    ]);
    expect(result.tenants).toEqual([
      {
        id: `tenant-1:${OWNER}:${targetIdentityId}`,
        tenantId: "tenant-1",
        identityId: targetIdentityId,
        relation: OWNER,
      },
    ]);
    expect(result.organizations).toEqual([
      {
        id: `org-1:${MEMBER}:${targetIdentityId}`,
        organizationId: "org-1",
        identityId: targetIdentityId,
        relation: MEMBER,
      },
    ]);
  });

  it("rejects callers without manage_admins", async () => {
    const authorizationClient = createAuthorizationClient({
      checkRelationship: vi.fn().mockResolvedValue(false),
    });
    const service = new IdentityRelationService(authorizationClient);

    await expect(service.list(targetIdentityId, callerIdentityId)).rejects.toBeInstanceOf(
      InsufficientPermissionError,
    );
    expect(authorizationClient.listRelationships).not.toHaveBeenCalled();
  });
});
