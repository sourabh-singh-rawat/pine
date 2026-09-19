import { describe, expect, it, vi } from "vitest";
import type { Database } from "@/db";
import { ATTACHMENT_SCAN_TYPE, MALWARE_ATTACHMENT_SCAN_STATUS } from "@/constants";
import { AttachmentScanRepository } from "../AttachmentScanRepository";

const toDatabase = (_val: unknown): _val is Database => true;

const createMockDb = () => {
  const insertReturning = vi.fn().mockResolvedValue([
    {
      id: "scan-1",
      attachmentId: "att-1",
      versionId: "ver-1",
      scopeType: "IDENTITY",
      scopeId: "user-1",
      tenantId: "tenant-1",
      type: ATTACHMENT_SCAN_TYPE.MALWARE,
      status: MALWARE_ATTACHMENT_SCAN_STATUS.PENDING,
      storageProvider: "seaweed",
      storageObjectKey: "quarantine/att-1/ver-1",
      scanner: null,
      durationMs: null,
      result: null,
      metadata: null,
      scannedAt: null,
      createdAt: new Date(),
      updatedAt: null,
    },
  ]);

  const selectLimit = vi.fn().mockResolvedValue([
    {
      id: "scan-1",
      attachmentId: "att-1",
      versionId: "ver-1",
      scopeType: "IDENTITY",
      scopeId: "user-1",
      tenantId: "tenant-1",
      type: ATTACHMENT_SCAN_TYPE.MALWARE,
      status: MALWARE_ATTACHMENT_SCAN_STATUS.PENDING,
      storageProvider: "seaweed",
      storageObjectKey: "quarantine/att-1/ver-1",
      scanner: null,
      durationMs: null,
      result: null,
      metadata: null,
      scannedAt: null,
      createdAt: new Date(),
      updatedAt: null,
    },
  ]);

  const updateReturning = vi.fn().mockResolvedValue([
    {
      id: "scan-1",
      attachmentId: "att-1",
      versionId: "ver-1",
      scopeType: "IDENTITY",
      scopeId: "user-1",
      tenantId: "tenant-1",
      type: ATTACHMENT_SCAN_TYPE.MALWARE,
      status: MALWARE_ATTACHMENT_SCAN_STATUS.CLEAN,
      storageProvider: "seaweed",
      storageObjectKey: "quarantine/att-1/ver-1",
      scanner: "clamav",
      durationMs: 120,
      result: {
        isInfected: false,
        threats: [],
        rawOutput: "stream: OK",
      },
      metadata: null,
      scannedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const rawDb: unknown = {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: insertReturning,
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: selectLimit,
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: updateReturning,
        })),
      })),
    })),
  };

  const db = toDatabase(rawDb) ? rawDb : undefined;

  return { db, insertReturning, selectLimit, updateReturning };
};

describe("AttachmentScanRepository", () => {
  it("saves an attachment scan record", async () => {
    const { db } = createMockDb();
    if (!db) {
      throw new Error("db not defined");
    }
    const repository = new AttachmentScanRepository(db);

    const result = await repository.save({
      id: "scan-1",
      attachmentId: "att-1",
      versionId: "ver-1",
      scopeType: "IDENTITY",
      scopeId: "user-1",
      tenantId: "tenant-1",
      type: ATTACHMENT_SCAN_TYPE.MALWARE,
      status: MALWARE_ATTACHMENT_SCAN_STATUS.PENDING,
      storageProvider: "seaweed",
      storageObjectKey: "quarantine/att-1/ver-1",
    });

    expect(result.id).toBe("scan-1");
  });

  it("finds scan by id", async () => {
    const { db } = createMockDb();
    if (!db) {
      throw new Error("db not defined");
    }
    const repository = new AttachmentScanRepository(db);

    const result = await repository.findById("scan-1");
    expect(result?.id).toBe("scan-1");
  });

  it("finds scan by attachment and version with type", async () => {
    const { db } = createMockDb();
    if (!db) {
      throw new Error("db not defined");
    }
    const repository = new AttachmentScanRepository(db);

    const result = await repository.findByAttachmentAndVersion("att-1", "ver-1", ATTACHMENT_SCAN_TYPE.MALWARE);
    expect(result?.id).toBe("scan-1");
  });

  it("updates scan result", async () => {
    const { db } = createMockDb();
    if (!db) {
      throw new Error("db not defined");
    }
    const repository = new AttachmentScanRepository(db);

    const result = await repository.updateResult("scan-1", {
      status: MALWARE_ATTACHMENT_SCAN_STATUS.CLEAN,
      scanner: "clamav",
      durationMs: 120,
      result: {
        isInfected: false,
        threats: [],
        rawOutput: "stream: OK",
      },
    });

    expect(result?.status).toBe(MALWARE_ATTACHMENT_SCAN_STATUS.CLEAN);
    expect(result?.result).toEqual({
      isInfected: false,
      threats: [],
      rawOutput: "stream: OK",
    });
  });

  it("updates scan status", async () => {
    const { db } = createMockDb();
    if (!db) {
      throw new Error("db not defined");
    }
    const repository = new AttachmentScanRepository(db);

    const result = await repository.updateStatus("scan-1", MALWARE_ATTACHMENT_SCAN_STATUS.CLEAN);
    expect(result?.status).toBe(MALWARE_ATTACHMENT_SCAN_STATUS.CLEAN);
  });
});
