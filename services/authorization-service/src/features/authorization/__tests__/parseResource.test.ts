import { InvalidResourceKeyError, parseResource } from "@pine/authorization";
import { describe, expect, it } from "vitest";

describe("parseResource", () => {
  it("returns namespace and id from a resource key", () => {
    expect(parseResource("tenant:01900000-0000-7000-8000-000000000001")).toEqual({
      namespace: "tenant",
      id: "01900000-0000-7000-8000-000000000001",
    });
    expect(parseResource("platform:01900000-0000-7000-8000-000000000000")).toEqual({
      namespace: "platform",
      id: "01900000-0000-7000-8000-000000000000",
    });
  });

  it("rejects keys that are not namespace:id", () => {
    expect(() => parseResource("tenant")).toThrow(InvalidResourceKeyError);
    expect(() => parseResource("tenant:")).toThrow(InvalidResourceKeyError);
    expect(() => parseResource(":id")).toThrow(InvalidResourceKeyError);
    expect(() => parseResource("tenant:org:id")).toThrow(InvalidResourceKeyError);
  });
});
