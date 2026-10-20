import {
  IDENTITY,
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
        if (input.namespace === "Platform") {
          return [
            {
              object: { namespace: "Platform", id: PLATFORM_OBJECT_ID },
              relation: "admins",
              subject: { namespace: IDENTITY, id: targetIdentityId },
            },
          ];
        }
        if (input.namespace === "Tenant") {
          return [
            {
              object: { namespace: "Tenant", id: "tenant-1" },
              relation: "owners",
              subject: { namespace: IDENTITY, id: targetIdentityId },
            },
          ];
        }
        return [
          {
            object: { namespace: "Organization", id: "org-1" },
            relation: "members",
            subject: { namespace: IDENTITY, id: targetIdentityId },
          },
        ];
      });

    const authorizationClient = createAuthorizationClient({ listRelationships });
    const service = new IdentityRelationService(authorizationClient);
    const result = await service.list(targetIdentityId, callerIdentityId);

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "Platform",
      object: PLATFORM_OBJECT_ID,
      relation: "manage_admins",
      subject: `${IDENTITY}:${callerIdentityId}`,
    });
    expect(listRelationships).toHaveBeenCalledWith({
      namespace: "Platform",
      subject: { namespace: IDENTITY, id: targetIdentityId },
    });
    expect(listRelationships).toHaveBeenCalledWith({
      namespace: "Tenant",
      subject: { namespace: IDENTITY, id: targetIdentityId },
    });
    expect(listRelationships).toHaveBeenCalledWith({
      namespace: "Organization",
      subject: { namespace: IDENTITY, id: targetIdentityId },
    });
    expect(listRelationships).toHaveBeenCalledTimes(3);
    expect(result.identityId).toBe(targetIdentityId);
    expect(result.platform).toEqual([
      {
        id: `${PLATFORM_OBJECT_ID}:admins:${targetIdentityId}`,
        identityId: targetIdentityId,
        relation: "admins",
      },
    ]);
    expect(result.tenants).toEqual([
      {
        id: `tenant-1:owners:${targetIdentityId}`,
        tenantId: "tenant-1",
        identityId: targetIdentityId,
        relation: "owners",
      },
    ]);
    expect(result.organizations).toEqual([
      {
        id: `org-1:members:${targetIdentityId}`,
        organizationId: "org-1",
        identityId: targetIdentityId,
        relation: "members",
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
