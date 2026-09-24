import {
  requirePermission,
  type IAuthorizationClient,
} from "@pine/authorization";
import { ATTACHMENT_SCOPE_TYPE, type IAttachmentClient } from "@pine/attachment";
import { inject, injectable } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import type { Item, ItemAttachment } from "@/db";
import {
  ItemAttachmentAlreadyLinkedError,
  ItemAttachmentNotFoundError,
  ItemAttachmentUploadRequestNotFoundError,
  ItemNotFoundError,
} from "@/features/item/errors";
import type {
  IItemAttachmentRepository,
  IItemAttachmentUploadRequestRepository,
  IItemRepository,
} from "@/features/item/repositories";
import type { IProjectRepository } from "@/features/project/repositories";
import { SpaceNotFoundError } from "@/features/spaces/errors";
import type { ISpaceRepository } from "@/features/spaces/repositories";
import type {
  CompleteItemAttachmentUploadOptions,
  CreateItemAttachmentOptions,
  CreateItemAttachmentUploadRequestOptions,
  CreateItemAttachmentUploadRequestResult,
  DeleteItemAttachmentOptions,
  IItemAttachmentService,
  ListItemAttachmentsOptions,
} from "./IItemAttachmentService";

@injectable()
export class ItemAttachmentService implements IItemAttachmentService {
  constructor(
    @inject(TYPES.ItemRepository)
    private readonly itemRepository: IItemRepository,
    @inject(TYPES.ItemAttachmentRepository)
    private readonly itemAttachmentRepository: IItemAttachmentRepository,
    @inject(TYPES.ItemAttachmentUploadRequestRepository)
    private readonly itemAttachmentUploadRequestRepository: IItemAttachmentUploadRequestRepository,
    @inject(TYPES.ProjectRepository)
    private readonly projectRepository: IProjectRepository,
    @inject(TYPES.SpaceRepository)
    private readonly spaceRepository: ISpaceRepository,
    @inject(TYPES.AttachmentClient)
    private readonly attachmentClient: IAttachmentClient,
    @inject(TYPES.AuthorizationClient)
    private readonly authorizationClient: IAuthorizationClient,
  ) {}

  async create(options: CreateItemAttachmentOptions): Promise<ItemAttachment> {
    const {
      itemId,
      attachmentId,
      name,
      originalName,
      mimeType,
      size,
      identityId,
    } = options;

    const item = await this.requireItem(itemId);
    const workspaceId = await this.resolveWorkspaceId(item);

    await requirePermission(
      this.authorizationClient,
      identityId,
      "create_project",
      `workspace:${workspaceId}`,
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
    const workspaceId = await this.resolveWorkspaceId(item);

    await requirePermission(
      this.authorizationClient,
      identityId,
      "read",
      `workspace:${workspaceId}`,
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
    const workspaceId = await this.resolveWorkspaceId(item);

    await requirePermission(
      this.authorizationClient,
      identityId,
      "create_project",
      `workspace:${workspaceId}`,
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
    const workspaceId = await this.resolveWorkspaceId(item);

    await requirePermission(
      this.authorizationClient,
      identityId,
      "create_project",
      `workspace:${workspaceId}`,
    );

    const requestRecord = await this.itemAttachmentUploadRequestRepository.save({
      itemId,
      status: "pending",
      name: filename,
      originalName: filename,
      mimeType: contentType,
      size,
      createdById: identityId,
    });

    const uploadTarget = await this.attachmentClient.createUploadTarget({
      input: {
        scopeType: ATTACHMENT_SCOPE_TYPE.WORKSPACE,
        scopeId: workspaceId,
        filename,
        contentType,
        size,
        operationId: requestRecord.id,
        metadata: {
          itemId,
          uploadRequestId: requestRecord.id,
        },
      },
      identityId,
      authMethod,
    });

    return {
      uploadRequestId: requestRecord.id,
      url: uploadTarget.url,
      headers: uploadTarget.headers,
      expiresAt: uploadTarget.expiresAt,
    };
  }

  async completeUpload(
    options: CompleteItemAttachmentUploadOptions,
  ): Promise<ItemAttachment | null> {
    const { uploadRequestId, attachmentId } = options;

    const request = await this.itemAttachmentUploadRequestRepository.findById(
      uploadRequestId,
    );
    if (!request) {
      throw new ItemAttachmentUploadRequestNotFoundError(
        `Item attachment upload request not found: ${uploadRequestId}`,
      );
    }

    if (request.status === "completed") {
      const existing = await this.itemAttachmentRepository.findByItemAndAttachment(
        request.itemId,
        attachmentId,
      );
      return existing;
    }

    const existing = await this.itemAttachmentRepository.findByItemAndAttachment(
      request.itemId,
      attachmentId,
    );
    if (existing) {
      await this.itemAttachmentUploadRequestRepository.update(uploadRequestId, {
        status: "completed",
        attachmentId,
        completedAt: new Date(),
      });
      return existing;
    }

    const link = await this.itemAttachmentRepository.save({
      itemId: request.itemId,
      attachmentId,
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

  private async requireItem(itemId: string): Promise<Item> {
    const item = await this.itemRepository.findById(itemId);
    if (!item) {
      throw new ItemNotFoundError(`Item not found: ${itemId}`);
    }
    return item;
  }

  private async resolveWorkspaceId(item: Item): Promise<string> {
    const project = await this.projectRepository.findById(item.projectId);
    if (!project) {
      throw new ItemNotFoundError(`Project not found for item: ${item.id}`);
    }

    const space = await this.spaceRepository.findById(project.spaceId);
    if (!space) {
      throw new SpaceNotFoundError(`Space not found: ${project.spaceId}`);
    }

    return space.workspaceId;
  }
}
