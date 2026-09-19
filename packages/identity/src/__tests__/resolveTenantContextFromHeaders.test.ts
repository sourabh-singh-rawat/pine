import type { HttpRequest } from "@pine/server";
import { describe, expect, it } from "vitest";
import { resolveTenantContextFromHeaders } from "../resolveTenantContextFromHeaders";
import {
  X_WORKSPACE_ID_HEADER,
  X_TENANT_ID_HEADER,
} from "../tenantContextHeaders";

const createRequest = (headers: Record<string, string | undefined>): HttpRequest => ({
  method: "GET",
  url: "/",
  headers,
  query: {},
  params: {},
  cookies: {},
  body: undefined,
  file: async () => undefined,
  isMultipart: () => false,
});

describe("resolveTenantContextFromHeaders", () => {
  it("sets tenant and workspace when both headers are present", () => {
    const request = createRequest({
      [X_TENANT_ID_HEADER]: "tenant-1",
      [X_WORKSPACE_ID_HEADER]: "org-1",
    });

    resolveTenantContextFromHeaders(request);

    expect(request.tenantId).toBe("tenant-1");
    expect(request.workspaceId).toBe("org-1");
  });

  it("leaves context unset when either header is missing", () => {
    const request = createRequest({
      [X_TENANT_ID_HEADER]: "tenant-1",
    });

    resolveTenantContextFromHeaders(request);

    expect(request.tenantId).toBeUndefined();
    expect(request.workspaceId).toBeUndefined();
  });

  it("leaves context unset when either header is empty", () => {
    const request = createRequest({
      [X_TENANT_ID_HEADER]: "tenant-1",
      [X_WORKSPACE_ID_HEADER]: "",
    });

    resolveTenantContextFromHeaders(request);

    expect(request.tenantId).toBeUndefined();
    expect(request.workspaceId).toBeUndefined();
  });
});
