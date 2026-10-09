import { requirePermission, type IAuthorizationClient } from "@pine/authorization";
import { ATTACHMENT_SCOPE_TYPE, type IAttachmentClient } from "@pine/attachment";
import { uuidv7 } from "@pine/common";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { DbClient, Item, ItemAttachment } from "@/db";
import {
  ITEM_ATTACHMENT_STATUS,
  ITEM_ATTACHMENT_STALE_TTL_MS,
  ITEM_ATTACHMENT_SWEEP_BATCH_SIZE,
} from "@/features/item-attachments/constants";
import {
  ItemAttachmentAlreadyLinkedError,
  ItemAttachmentNotFoundError,
  ItemAttachmentUploadRequestNotFoundError,
} from "@/features/item-attachments/errors";
import type {
  IItemAttachmentRepository,
  IItemAttachmentUploadRequestRepository,
} from "@/features/item-attachments/repositories";
import { ItemNotFoundError } from "@/features/item/errors";
import type { IItemRepository } from "@/features/item/repositories";
import type { IListRepository } from "@/features/lists/repositories";
import { SpaceNotFoundError } from "@/features/spaces/errors";
import type { ISpaceRepository } from "@/features/spaces/repositories";
import type {
  CompleteItemAttachmentUploadOptions,
  CreateItemAttachmentOptions,
  CreateItemAttachmentUploadRequestOptions,
  CreateItemAttachmentUploadRequestResult,
  DeleteItemAttachmentOptions,
  FailStaleItemAttachmentsOptions,
  IItemAttachmentService,
  ListItemAttachmentsOptions,
  MarkItemAttachmentFailedOptions,
  MarkItemAttachmentScanningOptions,
} from "./IItemAttachmentService";

export type ItemAttachmentDatabase = {
  transaction: <T>(callback: (tx: DbClient) => Promise<T>) => Promise<T>;
};

@injectable()
export class ItemAttachmentService implements IItemAttachmentService {
  constructor(
    @inject(TYPES.Database)
    private readonly db: ItemAttachmentDatabase,
    @inject(TYPES.ItemRepository)
    private readonly itemRepository: IItemRepository,
    @inject(TYPES.ItemAttachmentRepository)
    private readonly itemAttachmentRepository: IItemAttachmentRepository,
    @inject(TYPES.ItemAttachmentUploadRequestRepository)
    private readonly itemAttachmentUploadRequestRepository: IItemAttachmentUploadRequestRepository,
    @inject(TYPES.ListRepository)
    private readonly listRepository: IListRepository,
    @inject(TYPES.SpaceRepository)
    private readonly spaceRepository: ISpaceRepository,
    @inject(TYPES.AttachmentClient)
    private readonly attachmentClient: IAttachmentClient,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
  ) {}

  async create(options: CreateItemAttachmentOptions): Promise<ItemAttachment> {
    const { itemId, attachmentId, name, originalName, mimeType, size, identityId } = options;

    const item = await this.requireItem(itemId);
    const organizationId = await this.resolveOrganizationId(item);

    await requirePermission(
      this.authorizationClient,
      identityId,
      "create_list",
      `Organization:${organizationId}`,
    );

    const existing = await this.itemAttachmentRepository.findByItemAndAttachment(
      itemId,
      attachmentId,
    );
    if (existing) {
      throw new ItemAttachmentAlreadyLinkedError();
    }

    return this.itemAttachmentRepository.save({
      itemId,
      attachmentId,
      status: ITEM_ATTACHMENT_STATUS.READY,
      name,
      originalName,
      mimeType,
      size,
      createdById: identityId,
    });
  }

  async list(options: ListItemAttachmentsOptions): Promise<ItemAttachment[]> {
    const { itemId, identityId } = options;

    const item = await this.requireItem(itemId);
    const organizationId = await this.resolveOrganizationId(item);

    await requirePermission(
      this.authorizationClient,
      identityId,
      "read",
      `Organization:${organizationId}`,
    );

    return this.itemAttachmentRepository.findByItemId(itemId);
  }

  async delete(options: DeleteItemAttachmentOptions): Promise<void> {
    const { id, identityId } = options;

    const link = await this.itemAttachmentRepository.findById(id);
    if (!link) {
      throw new ItemAttachmentNotFoundError(`Item attachment not found: ${id}`);
    }

    const item = await this.requireItem(link.itemId);
    const organizationId = await this.resolveOrganizationId(item);

    await requirePermission(
      this.authorizationClient,
      identityId,
      "create_list",
      `Organization:${organizationId}`,
    );

    const deleted = await this.itemAttachmentRepository.softDelete(id);
    if (!deleted) {
      throw new ItemAttachmentNotFoundError(`Item attachment not found: ${id}`);
    }
  }

  async createUploadRequest(
    options: CreateItemAttachmentUploadRequestOptions,
  ): Promise<CreateItemAttachmentUploadRequestResult> {
    const { itemId, filename, contentType, size, identityId, authMethod } = options;

    const item = await this.requireItem(itemId);
    const organizationId = await this.resolveOrganizationId(item);

    await requirePermission(
      this.authorizationClient,
      identityId,
      "create_list",
      `Organization:${organizationId}`,
    );

    const requestId = uuidv7();

    await this.db.transaction(async (tx) => {
      await this.itemAttachmentUploadRequestRepository.save(
        {
          id: requestId,
          itemId,
          status: "pending",
          name: filename,
          originalName: filename,
          mimeType: contentType,
          size,
          createdById: identityId,
        },
        { tx },
      );

      await this.itemAttachmentRepository.save(
        {
          id: requestId,
          itemId,
          attachmentId: null,
          status: ITEM_ATTACHMENT_STATUS.PENDING,
          name: filename,
          originalName: filename,
          mimeType: contentType,
          size,
          createdById: identityId,
        },
        { tx },
      );
    });

    try {
      const uploadTarget = await this.attachmentClient.createUploadTarget({
        input: {
          scopeType: ATTACHMENT_SCOPE_TYPE.ORGANIZATION,
          scopeId: organizationId,
          filename,
          contentType,
          size,
          operationId: requestId,
          metadata: {
            itemId,
            uploadRequestId: requestId,
          },
        },
        identityId,
        authMethod,
      });

      return {
        uploadRequestId: requestId,
        url: uploadTarget.url,
        headers: uploadTarget.headers,
        expiresAt: uploadTarget.expiresAt,
      };
    } catch (error) {
      await this.itemAttachmentRepository.softDelete(requestId);
      await this.itemAttachmentUploadRequestRepository.update(requestId, {
        status: "failed",
      });
      throw error;
    }
  }

  async completeUpload(
    options: CompleteItemAttachmentUploadOptions,
  ): Promise<ItemAttachment | null> {
    const { uploadRequestId, attachmentId } = options;

    const request = await this.itemAttachmentUploadRequestRepository.findById(uploadRequestId);
    if (!request) {
      throw new ItemAttachmentUploadRequestNotFoundError(
        `Item attachment upload request not found: ${uploadRequestId}`,
      );
    }

    const existingByAttachment = await this.itemAttachmentRepository.findByItemAndAttachment(
      request.itemId,
      attachmentId,
    );
    if (existingByAttachment) {
      if (request.status !== "completed") {
        await this.itemAttachmentUploadRequestRepository.update(uploadRequestId, {
          status: "completed",
          attachmentId,
          completedAt: new Date(),
        });
      }
      if (existingByAttachment.status !== ITEM_ATTACHMENT_STATUS.READY) {
        const updated = await this.itemAttachmentRepository.update(existingByAttachment.id, {
          attachmentId,
          status: ITEM_ATTACHMENT_STATUS.READY,
        });
        return updated ?? existingByAttachment;
      }
      return existingByAttachment;
    }

    const pendingLink = await this.itemAttachmentRepository.findById(uploadRequestId);
    if (pendingLink) {
      const updated = await this.itemAttachmentRepository.update(uploadRequestId, {
        attachmentId,
        status: ITEM_ATTACHMENT_STATUS.READY,
      });

      await this.itemAttachmentUploadRequestRepository.update(uploadRequestId, {
        status: "completed",
        attachmentId,
        completedAt: new Date(),
      });

      return updated;
    }

    const link = await this.itemAttachmentRepository.save({
      itemId: request.itemId,
      attachmentId,
      status: ITEM_ATTACHMENT_STATUS.READY,
      name: request.name,
      originalName: request.originalName,
      mimeType: request.mimeType,
      size: request.size,
      createdById: request.createdById,
    });

    await this.itemAttachmentUploadRequestRepository.update(uploadRequestId, {
      status: "completed",
      attachmentId,
      completedAt: new Date(),
    });

    return link;
  }

  async markScanning(options: MarkItemAttachmentScanningOptions): Promise<ItemAttachment | null> {
    const { uploadRequestId, attachmentId } = options;

    const link = await this.itemAttachmentRepository.findById(uploadRequestId);
    if (!link) {
      return null;
    }

    if (
      link.status === ITEM_ATTACHMENT_STATUS.READY ||
      link.status === ITEM_ATTACHMENT_STATUS.FAILED
    ) {
      return link;
    }

    if (link.status === ITEM_ATTACHMENT_STATUS.SCANNING && link.attachmentId === attachmentId) {
      return link;
    }

    const updated = await this.itemAttachmentRepository.update(uploadRequestId, {
      attachmentId,
      status: ITEM_ATTACHMENT_STATUS.SCANNING,
    });

    return updated ?? link;
  }

  async markFailed(options: MarkItemAttachmentFailedOptions): Promise<ItemAttachment | null> {
    const { uploadRequestId } = options;

    const link = await this.itemAttachmentRepository.findById(uploadRequestId);
    if (!link) {
      return null;
    }

    if (
      link.status === ITEM_ATTACHMENT_STATUS.READY ||
      link.status === ITEM_ATTACHMENT_STATUS.FAILED
    ) {
      return link;
    }

    const updated = await this.itemAttachmentRepository.update(uploadRequestId, {
      status: ITEM_ATTACHMENT_STATUS.FAILED,
    });

    return updated ?? link;
  }

  async failStale(options?: FailStaleItemAttachmentsOptions): Promise<number> {
    options?.signal?.throwIfAborted();

    const olderThan = options?.olderThan ?? new Date(Date.now() - ITEM_ATTACHMENT_STALE_TTL_MS);
    const limit = options?.limit ?? ITEM_ATTACHMENT_SWEEP_BATCH_SIZE;

    return this.itemAttachmentRepository.failStaleBefore(olderThan, limit);
  }

  private async requireItem(itemId: string): Promise<Item> {
    const item = await this.itemRepository.findById(itemId);
    if (!item) {
      throw new ItemNotFoundError(`Item not found: ${itemId}`);
    }
    return item;
  }

  private async resolveOrganizationId(item: Item): Promise<string> {
    const list = await this.listRepository.findById(item.listId);
    if (!list) {
      throw new ItemNotFoundError(`List not found for item: ${item.id}`);
    }

    const space = await this.spaceRepository.findById(list.spaceId);
    if (!space) {
      throw new SpaceNotFoundError(`Space not found: ${list.spaceId}`);
    }

    return space.organizationId;
  }
}
