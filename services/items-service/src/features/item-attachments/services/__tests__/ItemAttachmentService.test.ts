import { ATTACHMENT_SCOPE_TYPE, type IAttachmentClient } from "@pine/attachment";
import { InsufficientPermissionError, type IAuthorizationClient } from "@pine/authorization";
import { ITEM_PRIORITY } from "@pine/common";
import { describe, expect, it, vi } from "vitest";
import type { Item, ItemAttachment, ItemAttachmentUploadRequest, List, Space } from "@/db";
import { ITEM_ATTACHMENT_STATUS } from "@/features/item-attachments/constants";
import {
  ItemAttachmentAlreadyLinkedError,
  ItemAttachmentNotFoundError,
  ItemAttachmentUploadRequestNotFoundError,
} from "@/features/item-attachments/errors";
import type {
  IItemAttachmentRepository,
  IItemAttachmentUploadRequestRepository,
} from "@/features/item-attachments/repositories";
import {
  ItemAttachmentService,
  type ItemAttachmentDatabase,
} from "@/features/item-attachments/services/ItemAttachmentService";
import { ItemNotFoundError } from "@/features/item/errors";
import type { IItemRepository } from "@/features/item/repositories";
import type { IListRepository } from "@/features/lists/repositories";
import type { ISpaceRepository } from "@/features/spaces/repositories";

const item: Item = {
  id: "item-1",
  name: "Fix login",
  description: "Users cannot sign in",
  type: "task",
  statusId: "status-1",
  priority: ITEM_PRIORITY.NORMAL,
  listId: "list-1",
  startDate: null,
  dueDate: null,
  createdById: "user-1",
  updatedById: null,
  parentItemId: null,
  estimate: null,
  component: null,
  orderIndex: 0,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const list: List = {
  id: "list-1",
  spaceId: "space-1",
  name: "List",
  createdById: "user-1",
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const space: Space = {
  id: "space-1",
  organizationId: "organization-1",
  name: "Space",
  createdById: "user-1",
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const attachmentLink: ItemAttachment = {
  id: "link-1",
  itemId: "item-1",
  attachmentId: "att-1",
  status: ITEM_ATTACHMENT_STATUS.READY,
  name: "screenshot.png",
  originalName: "screenshot.png",
  mimeType: "image/png",
  size: 1024,
  createdById: "user-1",
  version: 1,
  createdAt: new Date("2026-01-02T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const pendingLink: ItemAttachment = {
  id: "upload-req-1",
  itemId: "item-1",
  attachmentId: null,
  status: ITEM_ATTACHMENT_STATUS.PENDING,
  name: "screenshot.png",
  originalName: "screenshot.png",
  mimeType: "image/png",
  size: 1024,
  createdById: "user-1",
  version: 1,
  createdAt: new Date("2026-01-02T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const uploadRequest: ItemAttachmentUploadRequest = {
  id: "upload-req-1",
  itemId: "item-1",
  status: "pending",
  name: "screenshot.png",
  originalName: "screenshot.png",
  mimeType: "image/png",
  size: 1024,
  createdById: "user-1",
  attachmentId: null,
  createdAt: new Date("2026-01-02T00:00:00.000Z"),
  completedAt: null,
};

const createDatabase = (): ItemAttachmentDatabase => ({
  transaction: vi.fn(async (callback) => callback({} as never)),
});

const createItemRepository = (overrides: Partial<IItemRepository> = {}): IItemRepository => ({
  save: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  findById: vi.fn().mockResolvedValue(item),
  findByIdWithList: vi.fn(),
  findRootsByList: vi.fn(),
  findRootsByStatus: vi.fn(),
  findRootPageByStatus: vi.fn(),
  findRootFirstPagesByList: vi.fn(),
  countRootsByListGrouped: vi.fn(),
  findChildren: vi.fn(),
  findMaxOrderIndex: vi.fn(),
  replaceOrderIndexes: vi.fn(),
  countByStatusId: vi.fn().mockResolvedValue(0),
  reassignStatus: vi.fn().mockResolvedValue(0),
  ...overrides,
});

const createItemAttachmentRepository = (
  overrides: Partial<IItemAttachmentRepository> = {},
): IItemAttachmentRepository => ({
  save: vi.fn().mockResolvedValue(attachmentLink),
  update: vi.fn().mockResolvedValue({
    ...pendingLink,
    attachmentId: "att-1",
    status: ITEM_ATTACHMENT_STATUS.READY,
  }),
  findById: vi.fn().mockResolvedValue(attachmentLink),
  findByItemId: vi.fn().mockResolvedValue([attachmentLink]),
  findByItemAndAttachment: vi.fn().mockResolvedValue(null),
  softDelete: vi.fn().mockResolvedValue(true),
  failStaleBefore: vi.fn().mockResolvedValue(0),
  ...overrides,
});

const createUploadRequestRepository = (
  overrides: Partial<IItemAttachmentUploadRequestRepository> = {},
): IItemAttachmentUploadRequestRepository => ({
  save: vi.fn().mockResolvedValue(uploadRequest),
  findById: vi.fn().mockResolvedValue(uploadRequest),
  update: vi.fn().mockResolvedValue({
    ...uploadRequest,
    status: "completed",
    attachmentId: "att-1",
    completedAt: new Date("2026-01-02T00:01:00.000Z"),
  }),
  ...overrides,
});

const createListRepository = (overrides: Partial<IListRepository> = {}): IListRepository => ({
  save: vi.fn(),
  update: vi.fn(),
  findById: vi.fn().mockResolvedValue(list),
  findBySpaceId: vi.fn(),
  ...overrides,
});

const createSpaceRepository = (overrides: Partial<ISpaceRepository> = {}): ISpaceRepository => ({
  save: vi.fn(),
  update: vi.fn(),
  findById: vi.fn().mockResolvedValue(space),
  findMany: vi.fn(),
  ...overrides,
});

const createAttachmentClient = (overrides: Partial<IAttachmentClient> = {}): IAttachmentClient => ({
  createUploadTarget: vi.fn().mockResolvedValue({
    objectId: "obj-1",
    url: "https://localhost:4001/attachments/upload/upload-1",
    headers: { "Content-Type": "image/png" },
    expiresAt: "2026-01-02T00:15:00.000Z",
  }),
  downloadStream: vi.fn(),
  ...overrides,
});

const createAuthorizationClient = (
  overrides: Partial<IAuthorizationClient> = {},
): IAuthorizationClient => ({
  checkRelationship: vi.fn().mockResolvedValue(true),
  ensureRelationship: vi.fn().mockResolvedValue({ created: true }),
  deleteRelationship: vi.fn().mockResolvedValue({ deleted: true }),
  listRelationships: vi.fn().mockResolvedValue([]),
  ...overrides,
});

const createService = (
  deps: {
    db?: ItemAttachmentDatabase;
    itemRepository?: IItemRepository;
    itemAttachmentRepository?: IItemAttachmentRepository;
    itemAttachmentUploadRequestRepository?: IItemAttachmentUploadRequestRepository;
    listRepository?: IListRepository;
    spaceRepository?: ISpaceRepository;
    attachmentClient?: IAttachmentClient;
    authorizationClient?: IAuthorizationClient;
  } = {},
) =>
  new ItemAttachmentService(
    deps.db ?? createDatabase(),
    deps.itemRepository ?? createItemRepository(),
    deps.itemAttachmentRepository ?? createItemAttachmentRepository(),
    deps.itemAttachmentUploadRequestRepository ?? createUploadRequestRepository(),
    deps.listRepository ?? createListRepository(),
    deps.spaceRepository ?? createSpaceRepository(),
    deps.attachmentClient ?? createAttachmentClient(),
    deps.authorizationClient ?? createAuthorizationClient(),
  );

describe("ItemAttachmentService", () => {
  it("creates a link after authorizing create_list on the organization", async () => {
    const itemAttachmentRepository = createItemAttachmentRepository();
    const authorizationClient = createAuthorizationClient();
    const service = createService({ itemAttachmentRepository, authorizationClient });

    const result = await service.create({
      itemId: "item-1",
      attachmentId: "att-1",
      name: "screenshot.png",
      originalName: "screenshot.png",
      mimeType: "image/png",
      size: 1024,
      identityId: "user-1",
    });

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "Organization",
      object: "organization-1",
      relation: "create_list",
      subject: "Identity:user-1",
    });
    expect(itemAttachmentRepository.save).toHaveBeenCalledWith({
      itemId: "item-1",
      attachmentId: "att-1",
      status: ITEM_ATTACHMENT_STATUS.READY,
      name: "screenshot.png",
      originalName: "screenshot.png",
      mimeType: "image/png",
      size: 1024,
      createdById: "user-1",
    });
    expect(result).toEqual(attachmentLink);
  });

  it("throws ItemAttachmentAlreadyLinkedError when the attachment is already linked", async () => {
    const itemAttachmentRepository = createItemAttachmentRepository({
      findByItemAndAttachment: vi.fn().mockResolvedValue(attachmentLink),
    });
    const service = createService({ itemAttachmentRepository });

    await expect(
      service.create({
        itemId: "item-1",
        attachmentId: "att-1",
        name: "screenshot.png",
        originalName: "screenshot.png",
        mimeType: "image/png",
        identityId: "user-1",
      }),
    ).rejects.toBeInstanceOf(ItemAttachmentAlreadyLinkedError);
    expect(itemAttachmentRepository.save).not.toHaveBeenCalled();
  });

  it("throws ItemNotFoundError when creating for a missing item", async () => {
    const itemRepository = createItemRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    const authorizationClient = createAuthorizationClient();
    const itemAttachmentRepository = createItemAttachmentRepository();
    const service = createService({
      itemRepository,
      itemAttachmentRepository,
      authorizationClient,
    });

    await expect(
      service.create({
        itemId: "missing",
        attachmentId: "att-1",
        name: "screenshot.png",
        originalName: "screenshot.png",
        mimeType: "image/png",
        identityId: "user-1",
      }),
    ).rejects.toBeInstanceOf(ItemNotFoundError);
    expect(authorizationClient.checkRelationship).not.toHaveBeenCalled();
    expect(itemAttachmentRepository.save).not.toHaveBeenCalled();
  });

  it("lists links after authorizing read on the organization", async () => {
    const itemAttachmentRepository = createItemAttachmentRepository();
    const authorizationClient = createAuthorizationClient();
    const service = createService({ itemAttachmentRepository, authorizationClient });

    const result = await service.list({ itemId: "item-1", identityId: "user-1" });

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "Organization",
      object: "organization-1",
      relation: "read",
      subject: "Identity:user-1",
    });
    expect(itemAttachmentRepository.findByItemId).toHaveBeenCalledWith("item-1");
    expect(result).toEqual([attachmentLink]);
  });

  it("soft-deletes a link after authorizing create_list on the organization", async () => {
    const itemAttachmentRepository = createItemAttachmentRepository();
    const authorizationClient = createAuthorizationClient();
    const service = createService({ itemAttachmentRepository, authorizationClient });

    await expect(service.delete({ id: "link-1", identityId: "user-1" })).resolves.toBeUndefined();

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "Organization",
      object: "organization-1",
      relation: "create_list",
      subject: "Identity:user-1",
    });
    expect(itemAttachmentRepository.softDelete).toHaveBeenCalledWith("link-1");
  });

  it("throws ItemAttachmentNotFoundError when deleting a missing link", async () => {
    const itemAttachmentRepository = createItemAttachmentRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    const authorizationClient = createAuthorizationClient();
    const service = createService({ itemAttachmentRepository, authorizationClient });

    await expect(service.delete({ id: "missing", identityId: "user-1" })).rejects.toBeInstanceOf(
      ItemAttachmentNotFoundError,
    );
    expect(authorizationClient.checkRelationship).not.toHaveBeenCalled();
    expect(itemAttachmentRepository.softDelete).not.toHaveBeenCalled();
  });

  it("throws InsufficientPermissionError when create is not allowed", async () => {
    const itemAttachmentRepository = createItemAttachmentRepository();
    const authorizationClient = createAuthorizationClient({
      checkRelationship: vi.fn().mockResolvedValue(false),
    });
    const service = createService({ itemAttachmentRepository, authorizationClient });

    await expect(
      service.create({
        itemId: "item-1",
        attachmentId: "att-1",
        name: "screenshot.png",
        originalName: "screenshot.png",
        mimeType: "image/png",
        identityId: "user-1",
      }),
    ).rejects.toBeInstanceOf(InsufficientPermissionError);
    expect(itemAttachmentRepository.save).not.toHaveBeenCalled();
  });

  it("creates an upload request and pending attachment link after authorizing create_list", async () => {
    const db = createDatabase();
    const uploadRequestRepository = createUploadRequestRepository();
    const itemAttachmentRepository = createItemAttachmentRepository({
      save: vi.fn().mockResolvedValue(pendingLink),
    });
    const attachmentClient = createAttachmentClient();
    const authorizationClient = createAuthorizationClient();
    const service = createService({
      db,
      itemAttachmentUploadRequestRepository: uploadRequestRepository,
      itemAttachmentRepository,
      attachmentClient,
      authorizationClient,
    });

    const result = await service.createUploadRequest({
      itemId: "item-1",
      filename: "screenshot.png",
      contentType: "image/png",
      size: 1024,
      identityId: "user-1",
      authMethod: "session",
    });

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "Organization",
      object: "organization-1",
      relation: "create_list",
      subject: "Identity:user-1",
    });
    expect(db.transaction).toHaveBeenCalled();
    expect(uploadRequestRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "item-1",
        status: "pending",
        name: "screenshot.png",
        originalName: "screenshot.png",
        mimeType: "image/png",
        size: 1024,
        createdById: "user-1",
      }),
      expect.objectContaining({ tx: expect.anything() }),
    );
    expect(itemAttachmentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "item-1",
        attachmentId: null,
        status: ITEM_ATTACHMENT_STATUS.PENDING,
        name: "screenshot.png",
        originalName: "screenshot.png",
        mimeType: "image/png",
        size: 1024,
        createdById: "user-1",
      }),
      expect.objectContaining({ tx: expect.anything() }),
    );

    const savedUpload = vi.mocked(uploadRequestRepository.save).mock.calls[0]?.[0];
    const savedLink = vi.mocked(itemAttachmentRepository.save).mock.calls[0]?.[0];
    expect(savedUpload?.id).toEqual(savedLink?.id);
    expect(typeof savedUpload?.id).toBe("string");

    expect(attachmentClient.createUploadTarget).toHaveBeenCalledWith({
      input: {
        scopeType: ATTACHMENT_SCOPE_TYPE.ORGANIZATION,
        scopeId: "organization-1",
        filename: "screenshot.png",
        contentType: "image/png",
        size: 1024,
        operationId: savedUpload?.id,
        metadata: {
          itemId: "item-1",
          uploadRequestId: savedUpload?.id,
        },
      },
      identityId: "user-1",
      authMethod: "session",
    });
    expect(result).toEqual({
      uploadRequestId: savedUpload?.id,
      url: "https://localhost:4001/attachments/upload/upload-1",
      headers: { "Content-Type": "image/png" },
      expiresAt: "2026-01-02T00:15:00.000Z",
    });
  });

  it("soft-deletes the pending link when createUploadTarget fails", async () => {
    const db = createDatabase();
    const uploadRequestRepository = createUploadRequestRepository();
    const itemAttachmentRepository = createItemAttachmentRepository({
      save: vi.fn().mockResolvedValue(pendingLink),
    });
    const attachmentClient = createAttachmentClient({
      createUploadTarget: vi.fn().mockRejectedValue(new Error("attachment-service unavailable")),
    });
    const service = createService({
      db,
      itemAttachmentUploadRequestRepository: uploadRequestRepository,
      itemAttachmentRepository,
      attachmentClient,
    });

    await expect(
      service.createUploadRequest({
        itemId: "item-1",
        filename: "screenshot.png",
        contentType: "image/png",
        size: 1024,
        identityId: "user-1",
        authMethod: "session",
      }),
    ).rejects.toThrow("attachment-service unavailable");

    const savedLink = vi.mocked(itemAttachmentRepository.save).mock.calls[0]?.[0];
    expect(typeof savedLink?.id).toBe("string");
    expect(itemAttachmentRepository.softDelete).toHaveBeenCalledWith(savedLink?.id);
    expect(uploadRequestRepository.update).toHaveBeenCalledWith(savedLink?.id, {
      status: "failed",
    });
  });

  it("completes an upload by marking the pending link ready", async () => {
    const itemAttachmentRepository = createItemAttachmentRepository({
      findById: vi.fn().mockResolvedValue(pendingLink),
      findByItemAndAttachment: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({
        ...pendingLink,
        attachmentId: "att-1",
        status: ITEM_ATTACHMENT_STATUS.READY,
      }),
    });
    const uploadRequestRepository = createUploadRequestRepository();
    const service = createService({
      itemAttachmentRepository,
      itemAttachmentUploadRequestRepository: uploadRequestRepository,
    });

    const result = await service.completeUpload({
      uploadRequestId: "upload-req-1",
      attachmentId: "att-1",
    });

    expect(itemAttachmentRepository.update).toHaveBeenCalledWith("upload-req-1", {
      attachmentId: "att-1",
      status: ITEM_ATTACHMENT_STATUS.READY,
    });
    expect(itemAttachmentRepository.save).not.toHaveBeenCalled();
    expect(uploadRequestRepository.update).toHaveBeenCalledWith(
      "upload-req-1",
      expect.objectContaining({
        status: "completed",
        attachmentId: "att-1",
      }),
    );
    expect(result).toEqual({
      ...pendingLink,
      attachmentId: "att-1",
      status: ITEM_ATTACHMENT_STATUS.READY,
    });
  });

  it("completes an upload by creating a ready link when no pending row exists", async () => {
    const itemAttachmentRepository = createItemAttachmentRepository({
      findById: vi.fn().mockResolvedValue(null),
      findByItemAndAttachment: vi.fn().mockResolvedValue(null),
    });
    const uploadRequestRepository = createUploadRequestRepository();
    const service = createService({
      itemAttachmentRepository,
      itemAttachmentUploadRequestRepository: uploadRequestRepository,
    });

    const result = await service.completeUpload({
      uploadRequestId: "upload-req-1",
      attachmentId: "att-1",
    });

    expect(itemAttachmentRepository.save).toHaveBeenCalledWith({
      itemId: "item-1",
      attachmentId: "att-1",
      status: ITEM_ATTACHMENT_STATUS.READY,
      name: "screenshot.png",
      originalName: "screenshot.png",
      mimeType: "image/png",
      size: 1024,
      createdById: "user-1",
    });
    expect(uploadRequestRepository.update).toHaveBeenCalledWith(
      "upload-req-1",
      expect.objectContaining({
        status: "completed",
        attachmentId: "att-1",
      }),
    );
    expect(result).toEqual(attachmentLink);
  });

  it("throws ItemAttachmentUploadRequestNotFoundError when completing a missing request", async () => {
    const uploadRequestRepository = createUploadRequestRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    const itemAttachmentRepository = createItemAttachmentRepository();
    const service = createService({
      itemAttachmentUploadRequestRepository: uploadRequestRepository,
      itemAttachmentRepository,
    });

    await expect(
      service.completeUpload({
        uploadRequestId: "missing",
        attachmentId: "att-1",
      }),
    ).rejects.toBeInstanceOf(ItemAttachmentUploadRequestNotFoundError);
    expect(itemAttachmentRepository.save).not.toHaveBeenCalled();
    expect(itemAttachmentRepository.update).not.toHaveBeenCalled();
  });

  it("marks a pending link as scanning", async () => {
    const itemAttachmentRepository = createItemAttachmentRepository({
      findById: vi.fn().mockResolvedValue(pendingLink),
      update: vi.fn().mockResolvedValue({
        ...pendingLink,
        attachmentId: "att-1",
        status: ITEM_ATTACHMENT_STATUS.SCANNING,
      }),
    });
    const service = createService({ itemAttachmentRepository });

    const result = await service.markScanning({
      uploadRequestId: "upload-req-1",
      attachmentId: "att-1",
    });

    expect(itemAttachmentRepository.update).toHaveBeenCalledWith("upload-req-1", {
      attachmentId: "att-1",
      status: ITEM_ATTACHMENT_STATUS.SCANNING,
    });
    expect(result).toEqual({
      ...pendingLink,
      attachmentId: "att-1",
      status: ITEM_ATTACHMENT_STATUS.SCANNING,
    });
  });

  it("does not downgrade a ready link when marking scanning", async () => {
    const itemAttachmentRepository = createItemAttachmentRepository({
      findById: vi.fn().mockResolvedValue(attachmentLink),
    });
    const service = createService({ itemAttachmentRepository });

    const result = await service.markScanning({
      uploadRequestId: "link-1",
      attachmentId: "att-1",
    });

    expect(itemAttachmentRepository.update).not.toHaveBeenCalled();
    expect(result).toEqual(attachmentLink);
  });

  it("marks a scanning link as failed", async () => {
    const scanningLink: ItemAttachment = {
      ...pendingLink,
      attachmentId: "att-1",
      status: ITEM_ATTACHMENT_STATUS.SCANNING,
    };
    const itemAttachmentRepository = createItemAttachmentRepository({
      findById: vi.fn().mockResolvedValue(scanningLink),
      update: vi.fn().mockResolvedValue({
        ...scanningLink,
        status: ITEM_ATTACHMENT_STATUS.FAILED,
      }),
    });
    const service = createService({ itemAttachmentRepository });

    const result = await service.markFailed({ uploadRequestId: "upload-req-1" });

    expect(itemAttachmentRepository.update).toHaveBeenCalledWith("upload-req-1", {
      status: ITEM_ATTACHMENT_STATUS.FAILED,
    });
    expect(result).toEqual({
      ...scanningLink,
      status: ITEM_ATTACHMENT_STATUS.FAILED,
    });
  });

  it("returns null when marking scanning for a missing link", async () => {
    const itemAttachmentRepository = createItemAttachmentRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    const service = createService({ itemAttachmentRepository });

    const result = await service.markScanning({
      uploadRequestId: "missing",
      attachmentId: "att-1",
    });

    expect(result).toBeNull();
    expect(itemAttachmentRepository.update).not.toHaveBeenCalled();
  });

  it("fails stale pending and scanning attachments via the repository", async () => {
    const itemAttachmentRepository = createItemAttachmentRepository({
      failStaleBefore: vi.fn().mockResolvedValue(3),
    });
    const service = createService({ itemAttachmentRepository });
    const olderThan = new Date("2026-01-01T00:00:00.000Z");

    const result = await service.failStale({ olderThan, limit: 50 });

    expect(itemAttachmentRepository.failStaleBefore).toHaveBeenCalledWith(olderThan, 50);
    expect(result).toBe(3);
  });
});
