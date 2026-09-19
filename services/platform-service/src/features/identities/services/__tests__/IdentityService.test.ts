import { InsufficientPermissionError } from "@pine/authorization";
import { describe, expect, it, vi } from "vitest";
import type { IIdentityRepository } from "@/features/identities/repositories";
import { IdentityService } from "@/features/identities/services/IdentityService";

const identity = {
  id: "identity-1",
  displayName: "Ada Lovelace",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
  version: 1,
};

const identityId = "user-1";
const platformId = "platform-1";

const allowAuth = () => ({
  checkRelationship: vi.fn().mockResolvedValue(true),
  ensureRelationship: vi.fn().mockResolvedValue(undefined),
  deleteRelationship: vi.fn().mockResolvedValue(undefined),
});

const denyAuth = () => ({
  checkRelationship: vi.fn().mockResolvedValue(false),
  ensureRelationship: vi.fn().mockResolvedValue(undefined),
  deleteRelationship: vi.fn().mockResolvedValue(undefined),
});

const emptyRepo = (): IIdentityRepository => ({
  save: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
  existsById: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
});

describe("IdentityService", () => {
  it("lists identities when the caller can read tenants", async () => {
    const identityRepository = emptyRepo();
    identityRepository.findAll = vi.fn().mockResolvedValue([identity]);
    const service = new IdentityService(identityRepository, allowAuth());

    await expect(service.listIdentities(platformId, identityId)).resolves.toEqual([identity]);
    expect(identityRepository.findAll).toHaveBeenCalledOnce();
  });

  it("rejects listing when the caller lacks permission", async () => {
    const identityRepository = emptyRepo();
    const service = new IdentityService(identityRepository, denyAuth());

    await expect(service.listIdentities(platformId, identityId)).rejects.toBeInstanceOf(
      InsufficientPermissionError,
    );
    expect(identityRepository.findAll).not.toHaveBeenCalled();
  });
});
