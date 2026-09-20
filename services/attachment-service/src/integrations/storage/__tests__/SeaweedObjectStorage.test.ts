import { describe, expect, it, vi } from "vitest";

const { send } = vi.hoisted(() => ({
  send: vi.fn().mockResolvedValue({}),
}));

vi.mock("@aws-sdk/client-s3", async (importOriginal) => {
  const original = await importOriginal<typeof import("@aws-sdk/client-s3")>();
  return {
    ...original,
    S3Client: class {
      send = send;
    },
  };
});

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("http://127.0.0.1:8333/attachments/tenant-1/object-1?X-Amz-Signature=xyz"),
}));

vi.mock("@/bootstrap/env", () => ({
  env: {
    DATA_GATEWAY_URL: "http://127.0.0.1:4001",
    S3_ENDPOINT: "http://127.0.0.1:8333",
    S3_REGION: "us-east-1",
    S3_BUCKET: "attachments",
    S3_ACCESS_KEY: "seaweed",
    S3_SECRET_KEY: "seaweed",
  },
}));

import { env } from "@/bootstrap/env";
import { SeaweedObjectStorage } from "@/integrations/storage/SeaweedObjectStorage";

describe("SeaweedObjectStorage", () => {
  it("generates an upload target link pointing to data-gateway instead of storage provider", async () => {
    const storage = new SeaweedObjectStorage();
    const expiresAt = new Date(Date.now() + 60_000);
    const target = await storage.createUploadTarget({
      storageObjectKey: "tenant-1/object-1",
      contentType: "image/png",
      size: 1024,
      expiresAt,
    });

    const expectedUrl = new URL(
      "/attachments/tenant-1/object-1?X-Amz-Signature=xyz",
      env.DATA_GATEWAY_URL,
    ).toString();

    expect(target.url).toBe(expectedUrl);
    expect(target.objectId).toBe("tenant-1/object-1");
    expect(target.headers).toEqual({ "Content-Type": "image/png" });
    expect(target.expiresAt).toEqual(expiresAt);
  });

  it("puts object to S3 storage bucket", async () => {
    const storage = new SeaweedObjectStorage();
    const body = Buffer.from("image content");
    await storage.putObject({
      storageObjectKey: "tenant-1/object-1",
      contentType: "image/png",
      body,
      contentLength: body.byteLength,
    });

    expect(send).toHaveBeenCalled();
  });

  it("copies, deletes, and moves object in S3 storage bucket", async () => {
    const storage = new SeaweedObjectStorage();
    await storage.moveObject("quarantine/att-1", "trusted/att-1");

    expect(send).toHaveBeenCalledTimes(2);
  });
});
