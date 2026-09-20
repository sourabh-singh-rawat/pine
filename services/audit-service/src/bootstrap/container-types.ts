export const TYPES = {
  Database: Symbol.for("Database"),
  Logger: Symbol.for("Logger"),
  Broker: Symbol.for("Broker"),

  IdentityRepository: Symbol.for("IdentityRepository"),
  SpaceRepository: Symbol.for("SpaceRepository"),
  ItemRepository: Symbol.for("ItemRepository"),
  WorkspaceRepository: Symbol.for("WorkspaceRepository"),
  AttachmentRepository: Symbol.for("AttachmentRepository"),
  AuditLogRepository: Symbol.for("AuditLogRepository"),

  AuditIdentitySyncConsumer: Symbol.for("AuditIdentitySyncConsumer"),
  AuditIssuesSyncConsumer: Symbol.for("AuditIssuesSyncConsumer"),
  AuditPlatformSyncConsumer: Symbol.for("AuditPlatformSyncConsumer"),
  AuditAttachmentSyncConsumer: Symbol.for("AuditAttachmentSyncConsumer"),
};
