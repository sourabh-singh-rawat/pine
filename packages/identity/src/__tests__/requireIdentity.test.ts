import { UnauthorizedError } from "@pine/common";
import type { HttpIdentity } from "@pine/server";
import { describe, expect, it } from "vitest";
import { requireIdentity, requireIdentityId } from "../requireIdentity";

describe("requireIdentity", () => {
  it("returns identity when present", () => {
    const identity: HttpIdentity = { id: "user-123", authMethod: "access_token" };
    expect(requireIdentity({ identity })).toBe(identity);
  });

  it("throws UnauthorizedError when identity is missing", () => {
    expect(() => requireIdentity({})).toThrow(UnauthorizedError);
  });
});

describe("requireIdentityId", () => {
  it("returns identity id when present", () => {
    const identity: HttpIdentity = { id: "user-123", authMethod: "session" };
    expect(requireIdentityId({ identity })).toBe("user-123");
  });

  it("throws UnauthorizedError when identity is missing", () => {
    expect(() => requireIdentityId({})).toThrow(UnauthorizedError);
  });
});
