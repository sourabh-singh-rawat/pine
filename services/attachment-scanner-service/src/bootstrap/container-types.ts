export const TYPES = {
  Broker: Symbol.for("Broker"),
  Logger: Symbol.for("Logger"),
  AttachmentScannerService: Symbol.for("IAttachmentScannerService"),
  AttachmentQuarantinedConsumer: Symbol.for("AttachmentQuarantinedConsumer"),
  AttachmentClient: Symbol.for("IAttachmentClient"),
  MalwareScanner: Symbol.for("IMalwareScanner"),
  MalwareScannerService: Symbol.for("IMalwareScannerService"),
  ClamClient: Symbol.for("ClamClient"),
};
