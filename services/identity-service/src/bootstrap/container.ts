import { HttpAttachmentClient, type IAttachmentClient } from "@pine/attachment";
import { HttpAuthorizationClient, type IAuthorizationClient } from "@pine/authorization";
import { NatsPublisher, type IPublisher } from "@pine/events";
import { resolveIdentityFromHeaders, resolveTenantContextFromHeaders } from "@pine/identity";
import { createGraphQLServer, createHttpServer, type IHttpServer } from "@pine/server";
import {
  ExponentialBackoffPolicy,
  OutboxCleanupService,
  OutboxCleanupWorker,
  OutboxRepository,
  OutboxService,
  OutboxWorker,
  type IOutboxCleanupService,
  type IOutboxCleanupWorker,
  type IOutboxPublisher,
  type IOutboxRepository,
  type IOutboxService,
  type IOutboxWorker,
  type IRetryPolicy,
} from "@pine/outbox";
import { Container } from "inversify";
import { readFileSync } from "node:fs";
import path from "node:path";
import { broker } from "@/bootstrap/broker";
import { TYPES } from "@/bootstrap/container-types";
import { db } from "@/bootstrap/db";
import { env } from "@/bootstrap/env";
import { hydraClient } from "@/bootstrap/hydra-client";
import { kratosClient } from "@/bootstrap/kratos-client";
import { logger } from "@/bootstrap/logger";
import { createContext } from "@/graphql";
import { schema } from "@/graphql/schema";
import { IAdminService, AdminService } from "@/features/admin";
import { ISignInService, SignInService } from "@/features/signin";
import { ILogoutService, LogoutService } from "@/features/logout";
import { IMeService, MeService } from "@/features/me";
import { ISessionService, SessionService } from "@/features/session";
import { IOAuthService, OAuthService } from "@/features/oauth";
import { IRegistrationService, RegistrationService } from "@/features/registration";
import { IVerificationService, VerificationService } from "@/features/verification";
import { ClientSeederService, ClientService, IClientSeederService, IClientService } from "@/features/clients";
import { IIdentityRepository, IIdentityService, IdentityRepository, IdentityService } from "@/features/identities";
import {
  IProfilePhotoUploadRequestRepository,
  IProfileRepository,
  IProfileService,
  ProfilePhotoAttachmentConsumer,
  ProfilePhotoUploadRequestRepository,
  ProfileRepository,
  ProfileService,
} from "@/features/profiles";
import {
  IIdentityAdminProvider,
  IRegistrationProvider,
  ISessionProvider,
  IVerificationProvider,
  KratosErrorMapper,
  KratosIdentityAdminProvider,
  KratosRegistrationProvider,
  KratosSessionProvider,
  KratosVerificationProvider,
} from "@/integrations/identity";
import {
  HydraOAuthClientProvider,
  HydraOAuthFlowProvider,
  HydraOAuthTokenProvider,
  IOAuthClientProvider,
  IOAuthFlowProvider,
  IOAuthTokenProvider,
} from "@/integrations/oauth";
import { routes } from "@/routes";

export const container = new Container({ defaultScope: "Singleton" });

container.bind(TYPES.Database).toConstantValue(db);
container.bind(TYPES.Logger).toConstantValue(logger);
container.bind(TYPES.Broker).toConstantValue(broker);
container.bind<IPublisher>(TYPES.Publisher).toConstantValue(new NatsPublisher(broker));
container.bind<IOutboxRepository>(TYPES.OutboxRepository).toConstantValue(new OutboxRepository(db));
container.bind<IRetryPolicy>(TYPES.RetryPolicy).toConstantValue(new ExponentialBackoffPolicy());
container
  .bind<IOutboxService>(TYPES.OutboxService)
  .toConstantValue(new OutboxService(container.get<IOutboxRepository>(TYPES.OutboxRepository), container.get<IRetryPolicy>(TYPES.RetryPolicy)));
container
  .bind<IOutboxWorker>(TYPES.OutboxWorker)
  .toConstantValue(new OutboxWorker(container.get<IOutboxService>(TYPES.OutboxService), container.get<IPublisher>(TYPES.Publisher) as IOutboxPublisher));
container
  .bind<IOutboxCleanupService>(TYPES.OutboxCleanupService)
  .toConstantValue(new OutboxCleanupService(container.get<IOutboxRepository>(TYPES.OutboxRepository)));
container
  .bind<IOutboxCleanupWorker>(TYPES.OutboxCleanupWorker)
  .toConstantValue(new OutboxCleanupWorker(container.get<IOutboxCleanupService>(TYPES.OutboxCleanupService)));
container.bind(TYPES.KratosClient).toConstantValue(kratosClient);
container.bind(TYPES.HydraClient).toConstantValue(hydraClient);
container.bind(TYPES.KratosErrorMapper).to(KratosErrorMapper);

container.bind<IIdentityRepository>(TYPES.IdentityRepository).to(IdentityRepository);
container.bind<IIdentityService>(TYPES.IdentityService).to(IdentityService);
container.bind<IProfileRepository>(TYPES.ProfileRepository).to(ProfileRepository);
container.bind<IProfilePhotoUploadRequestRepository>(TYPES.ProfilePhotoUploadRequestRepository).to(ProfilePhotoUploadRequestRepository);
container.bind<IProfileService>(TYPES.ProfileService).to(ProfileService);
container.bind<ProfilePhotoAttachmentConsumer>(TYPES.ProfilePhotoAttachmentConsumer).to(ProfilePhotoAttachmentConsumer);
container.bind<IAuthorizationClient>(TYPES.AuthorizationClient).toConstantValue(new HttpAuthorizationClient({ baseUrl: env.AUTHORIZATION_SERVICE_URL }));
container.bind<IAttachmentClient>(TYPES.AttachmentClient).toConstantValue(new HttpAttachmentClient({ baseUrl: env.ATTACHMENT_SERVICE_URL }));
container.bind<IClientService>(TYPES.ClientService).to(ClientService);
container.bind<IClientSeederService>(TYPES.ClientSeederService).to(ClientSeederService);
container.bind<IRegistrationProvider>(TYPES.RegistrationProvider).to(KratosRegistrationProvider);
container.bind<ISessionProvider>(TYPES.SessionProvider).to(KratosSessionProvider);
container.bind<IIdentityAdminProvider>(TYPES.IdentityAdminProvider).to(KratosIdentityAdminProvider);
container.bind<IVerificationProvider>(TYPES.VerificationProvider).to(KratosVerificationProvider);
container.bind<IOAuthFlowProvider>(TYPES.OAuthFlowProvider).to(HydraOAuthFlowProvider);
container.bind<IOAuthTokenProvider>(TYPES.OAuthTokenProvider).to(HydraOAuthTokenProvider);
container.bind<IOAuthClientProvider>(TYPES.OAuthClientProvider).to(HydraOAuthClientProvider);
container.bind<IRegistrationService>(TYPES.RegistrationService).to(RegistrationService);
container.bind<ISignInService>(TYPES.SignInService).to(SignInService);
container.bind<ILogoutService>(TYPES.LogoutService).to(LogoutService);
container.bind<IMeService>(TYPES.MeService).to(MeService);
container.bind<ISessionService>(TYPES.SessionService).to(SessionService);
container.bind<IOAuthService>(TYPES.OAuthService).to(OAuthService);
container.bind<IAdminService>(TYPES.AdminService).to(AdminService);
container.bind<IVerificationService>(TYPES.VerificationService).to(VerificationService);

container.bind<IHttpServer>(TYPES.HttpServer).toConstantValue(
  createHttpServer({
    config: {
      host: "0.0.0.0",
      port: 5000,
      environment: env.NODE_ENV,
      version: 1,
    },
    https: {
      key: readFileSync(env.IDENTITY_SERVICE_TLS_KEY_PATH),
      cert: readFileSync(env.IDENTITY_SERVICE_TLS_CERT_PATH),
      ca: readFileSync(env.CA_CERT_PATH),
      requestCert: true,
      rejectUnauthorized: true,
    },
    cookie: { secret: env.JWT_SECRET },
    openapi: {
      info: {
        title: "Identity Service",
        version: "0.0.0",
        description: "Authentication and identity APIs",
        license: { name: "ISC", url: "https://opensource.org/license/isc-license-txt" },
      },
      servers: [{ url: env.IDENTITY_SERVICE_URL }],
      tags: [{ name: "auth", description: "Authentication related end-points" }],
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "OAuth provider access token (Authorization: Bearer <token>)",
        },
      },
    },
    hooks: {
      onRequest: [resolveIdentityFromHeaders, resolveTenantContextFromHeaders],
    },
    graphql: createGraphQLServer({
      schema,
      context: createContext,
    }),
    routes,
  }),
);

export const openApiOutputPath = path.join(process.cwd(), "dist", "openapi.json");
