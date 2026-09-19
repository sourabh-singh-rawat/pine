import { UnauthorizedError } from "@pine/common";
import { describe, expect, it } from "vitest";
import { requireWorkspaceId, requireTenantId } from "../requireTenantContext";

describe("requireTenantId", () => {
  it("returns tenant id when present", () => {
    expect(requireTenantId({ tenantId: "tenant-1" })).toBe("tenant-1");
  });

  it("throws UnauthorizedError when tenant id is missing", () => {
    expect(() => requireTenantId({})).toThrow(UnauthorizedError);
  });
});

describe("requireWorkspaceId", () => {
  it("returns workspace id when present", () => {
    expect(requireWorkspaceId({ workspaceId: "org-1" })).toBe("org-1");
  });

  it("throws UnauthorizedError when workspace id is missing", () => {
    expect(() => requireWorkspaceId({})).toThrow(UnauthorizedError);
  });
});
