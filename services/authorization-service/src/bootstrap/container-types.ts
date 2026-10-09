export const TYPES = {
  Logger: Symbol.for("Logger"),
  Broker: Symbol.for("Broker"),
  HttpServer: Symbol.for("IHttpServer"),
  AuthorizationService: Symbol.for("IAuthorizationService"),
  AuthorizationClient: Symbol.for("IAuthorizationClient"),
  KetoClient: Symbol.for("KetoClient"),
  AuthorizationGraphProvider: Symbol.for("IAuthorizationGraphProvider"),
  AuthorizationTenantSyncConsumer: Symbol.for("AuthorizationTenantSyncConsumer"),
  AuthorizationOrganizationSyncConsumer: Symbol.for("AuthorizationOrganizationSyncConsumer"),
  AuthorizationOrganizationRelationSyncConsumer: Symbol.for(
    "AuthorizationOrganizationRelationSyncConsumer",
  ),
  AuthorizationTenantRelationSyncConsumer: Symbol.for("AuthorizationTenantRelationSyncConsumer"),
  AuthorizationPlatformRelationSyncConsumer: Symbol.for(
    "AuthorizationPlatformRelationSyncConsumer",
  ),
  AuthorizationProfileSyncConsumer: Symbol.for("AuthorizationProfileSyncConsumer"),
  AuthorizationSpaceSyncConsumer: Symbol.for("AuthorizationSpaceSyncConsumer"),
  AuthorizationListSyncConsumer: Symbol.for("AuthorizationListSyncConsumer"),
  AuthorizationItemSyncConsumer: Symbol.for("AuthorizationItemSyncConsumer"),
} as const;
