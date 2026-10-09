import { UnauthorizedError } from "@pine/common";
import { describe, expect, it } from "vitest";
import { requireOrganizationId, requireTenantId } from "../requireTenantContext";

describe("requireTenantId", () => {
  it("returns tenant id when present", () => {
    expect(requireTenantId({ tenantId: "tenant-1" })).toBe("tenant-1");
  });

  it("throws UnauthorizedError when tenant id is missing", () => {
    expect(() => requireTenantId({})).toThrow(UnauthorizedError);
  });
});

describe("requireOrganizationId", () => {
  it("returns organization id when present", () => {
    expect(requireOrganizationId({ organizationId: "org-1" })).toBe("org-1");
  });

  it("throws UnauthorizedError when organization id is missing", () => {
    expect(() => requireOrganizationId({})).toThrow(UnauthorizedError);
  });
});
