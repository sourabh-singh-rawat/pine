export const TYPES = {
  Logger: Symbol.for("Logger"),
  Broker: Symbol.for("Broker"),
  HttpServer: Symbol.for("IHttpServer"),
  AuthorizationService: Symbol.for("IAuthorizationService"),
  AuthorizationClient: Symbol.for("IAuthorizationClient"),
  KetoClient: Symbol.for("KetoClient"),
  AuthorizationGraphProvider: Symbol.for("IAuthorizationGraphProvider"),
  AuthorizationTenantSyncConsumer: Symbol.for("AuthorizationTenantSyncConsumer"),
  AuthorizationWorkspaceSyncConsumer: Symbol.for("AuthorizationWorkspaceSyncConsumer"),
  AuthorizationWorkspaceRelationSyncConsumer: Symbol.for(
    "AuthorizationWorkspaceRelationSyncConsumer",
  ),
  AuthorizationTenantRelationSyncConsumer: Symbol.for("AuthorizationTenantRelationSyncConsumer"),
  AuthorizationPlatformRelationSyncConsumer: Symbol.for(
    "AuthorizationPlatformRelationSyncConsumer",
  ),
  AuthorizationProfileSyncConsumer: Symbol.for("AuthorizationProfileSyncConsumer"),
  AuthorizationSpaceSyncConsumer: Symbol.for("AuthorizationSpaceSyncConsumer"),
  AuthorizationProjectSyncConsumer: Symbol.for("AuthorizationProjectSyncConsumer"),
  AuthorizationItemSyncConsumer: Symbol.for("AuthorizationItemSyncConsumer"),
} as const;

