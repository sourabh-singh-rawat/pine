import { Readable } from "node:stream";
import Value from "typebox/value";
import type {
  CreateUploadTargetOptions,
  DownloadAttachmentOptions,
  IAttachmentClient,
} from "./IAttachmentClient";
import { CreateUploadTargetResponseSchema, type CreateUploadTargetResponse } from "./schemas";

export interface HttpAttachmentClientOptions {
  baseUrl: string;
}

export class HttpAttachmentClient implements IAttachmentClient {
  private readonly baseUrl: string;

  constructor(options: HttpAttachmentClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
  }

  async createUploadTarget(
    options: CreateUploadTargetOptions,
  ): Promise<CreateUploadTargetResponse> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-identity-id": options.identityId,
      "x-identity-auth-method": options.authMethod ?? "session",
    };

    const response = await fetch(`${this.baseUrl}/internal/attachments/createUploadTarget`, {
      method: "POST",
      headers,
      body: JSON.stringify(options.input),
    });

    if (!response.ok) {
      throw new Error(
        `/internal/attachments/createUploadTarget failed with status ${response.status}`,
      );
    }

    const body: unknown = await response.json();
    if (!Value.Check(CreateUploadTargetResponseSchema, body)) {
      throw new Error("createUploadTarget returned an invalid response body");
    }

    return body;
  }

  async downloadStream(options: DownloadAttachmentOptions): Promise<Readable> {
    const url = `${this.baseUrl}/internal/attachments/${options.attachmentId}/versions/${options.versionId}/content`;

    const response = await fetch(url);
    const body = response.body;

    if (!response.ok || !body) {
      throw new Error(`Failed to download attachment: ${response.statusText}`);
    }

    return Readable.from(body);
  }
}
