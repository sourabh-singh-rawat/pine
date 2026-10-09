import { InvalidPermissionKeyError, parsePermission } from "@pine/authorization";
import { describe, expect, it } from "vitest";

describe("parsePermission", () => {
  it("returns namespace and permission from a permission key", () => {
    expect(parsePermission("organization:read")).toEqual({
      namespace: "organization",
      permission: "read",
    });
    expect(parsePermission("platform:create_tenant")).toEqual({
      namespace: "platform",
      permission: "create_tenant",
    });
  });

  it("rejects keys that are not namespace:permission", () => {
    expect(() => parsePermission("organization")).toThrow(InvalidPermissionKeyError);
    expect(() => parsePermission("organization:")).toThrow(InvalidPermissionKeyError);
    expect(() => parsePermission(":read")).toThrow(InvalidPermissionKeyError);
    expect(() => parsePermission("organization:role:create")).toThrow(InvalidPermissionKeyError);
  });
});
