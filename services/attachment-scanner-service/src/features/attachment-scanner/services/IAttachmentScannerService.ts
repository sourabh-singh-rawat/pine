export type ScanAttachmentInput = {
  attachmentId: string;
  versionId: string;
  scopeType: "IDENTITY" | "WORKSPACE";
  scopeId: string;
  tenantId?: string;
};

export interface IAttachmentScannerService {
  scan: (input: ScanAttachmentInput) => Promise<void>;
}
