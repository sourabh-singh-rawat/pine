import { InvalidPermissionKeyError, parsePermission } from "@pine/authorization";
import { describe, expect, it } from "vitest";

describe("parsePermission", () => {
  it("returns namespace and permission from a permission key", () => {
    expect(parsePermission("Organization:read")).toEqual({
      namespace: "Organization",
      permission: "read",
    });
    expect(parsePermission("Platform:create_tenant")).toEqual({
      namespace: "Platform",
      permission: "create_tenant",
    });
  });

  it("rejects keys that are not namespace:permission", () => {
    expect(() => parsePermission("Organization")).toThrow(InvalidPermissionKeyError);
    expect(() => parsePermission("Organization:")).toThrow(InvalidPermissionKeyError);
    expect(() => parsePermission(":read")).toThrow(InvalidPermissionKeyError);
    expect(() => parsePermission("Organization:role:create")).toThrow(InvalidPermissionKeyError);
  });
});
