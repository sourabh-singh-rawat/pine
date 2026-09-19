import type { HttpRequest } from "@pine/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@/bootstrap", () => ({
  container: { get },
}));

import { TYPES } from "@/bootstrap/container-types";
import { InvalidCheckRelationshipBodyError } from "@/features/authorization/errors";
import { checkRelationship } from "@/features/authorization/routes/checkRelationship";

const httpRequest = (partial: Partial<HttpRequest>): HttpRequest => ({
  method: partial.method ?? "POST",
  url: partial.url ?? "/authorization/checkRelationship",
  headers: partial.headers ?? {},
  query: partial.query ?? {},
  params: partial.params ?? {},
  cookies: partial.cookies ?? {},
  body: partial.body,
  user: partial.user,
  file: partial.file ?? (async () => undefined),
});

describe("checkRelationship route", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("returns allowed for a subject relationship check", async () => {
    const hasRelationship = vi.fn().mockResolvedValue(true);
    get.mockReturnValue({ hasRelationship });

    const response = await checkRelationship.handler(
      httpRequest({
        body: {
          namespace: "permission",
          object: "workspace:update",
          relation: "has",
          subject: "identity:user-1",
        },
      }),
    );

    expect(get).toHaveBeenCalledWith(TYPES.AuthorizationService);
    expect(hasRelationship).toHaveBeenCalledWith({
      namespace: "permission",
      object: "workspace:update",
      relation: "has",
      subject: "identity:user-1",
    });
    expect(response).toEqual({
      status: 200,
      body: { allowed: true },
    });
  });

  it("returns allowed false when the relationship does not hold", async () => {
    const hasRelationship = vi.fn().mockResolvedValue(false);
    get.mockReturnValue({ hasRelationship });

    const response = await checkRelationship.handler(
      httpRequest({
        body: {
          namespace: "permission",
          object: "workspace:update",
          relation: "has",
          subject: "identity:user-1",
        },
      }),
    );

    expect(response).toEqual({
      status: 200,
      body: { allowed: false },
    });
  });

  it("throws when the body is invalid", async () => {
    const hasRelationship = vi.fn();
    get.mockReturnValue({ hasRelationship });

    await expect(
      checkRelationship.handler(
        httpRequest({
          body: { relation: "has" },
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidCheckRelationshipBodyError);

    expect(hasRelationship).not.toHaveBeenCalled();
  });

  it("throws when subject is missing", async () => {
    const hasRelationship = vi.fn();
    get.mockReturnValue({ hasRelationship });

    await expect(
      checkRelationship.handler(
        httpRequest({
          body: {
            namespace: "permission",
            object: "workspace:update",
            relation: "has",
          },
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidCheckRelationshipBodyError);

    expect(hasRelationship).not.toHaveBeenCalled();
  });
});
