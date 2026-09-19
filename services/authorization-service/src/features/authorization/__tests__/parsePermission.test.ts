import {
  InvalidPermissionKeyError,
  parsePermission,
} from "@pine/authorization";
import { describe, expect, it } from "vitest";

describe("parsePermission", () => {
  it("returns namespace and permission from a permission key", () => {
    expect(parsePermission("workspace:read")).toEqual({
      namespace: "workspace",
      permission: "read",
    });
    expect(parsePermission("platform:create_tenant")).toEqual({
      namespace: "platform",
      permission: "create_tenant",
    });
  });

  it("rejects keys that are not namespace:permission", () => {
    expect(() => parsePermission("workspace")).toThrow(InvalidPermissionKeyError);
    expect(() => parsePermission("workspace:")).toThrow(InvalidPermissionKeyError);
    expect(() => parsePermission(":read")).toThrow(InvalidPermissionKeyError);
    expect(() => parsePermission("workspace:role:create")).toThrow(InvalidPermissionKeyError);
  });
});
