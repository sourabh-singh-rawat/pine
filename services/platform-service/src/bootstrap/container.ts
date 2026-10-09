import { HttpAuthorizationClient, type IAuthorizationClient } from "@pine/authorization";
import type { IWorker } from "@pine/common";
import { NatsPublisher, type IPublisher } from "@pine/events";
import {
  ExponentialBackoffPolicy,
  OutboxCleanupService,
  OutboxCleanupWorker,
  OutboxRepository,
  OutboxService,
  OutboxWorker,
  type IOutboxCleanupService,
  type IOutboxPublisher,
  type IOutboxRepository,
  type IOutboxService,
  type IRetryPolicy,
} from "@pine/outbox";
import { resolveIdentityFromHeaders, resolveTenantContextFromHeaders } from "@pine/identity";
import { createGraphQLServer, createHttpServer, type IHttpServer } from "@pine/server";
import { Container } from "inversify";
import { readFileSync } from "node:fs";
import path from "node:path";
import { broker } from "@/bootstrap/broker";
import { TYPES } from "@/bootstrap/container-types";
import { db } from "@/bootstrap/db";
import { env } from "@/bootstrap/env";
import { logger } from "@/bootstrap/logger";
import {
  type IOrganizationPreferenceRepository,
  type IOrganizationPreferenceService,
  type IOrganizationRelationService,
  type IOrganizationRepository,
  type IOrganizationService,
  OrganizationPreferenceRepository,
  OrganizationPreferenceService,
  OrganizationRelationService,
  OrganizationRepository,
  OrganizationService,
} from "@/features/organizations";
import { type IIdentityRelationService, type IPlatformRelationService, IdentityRelationService, PlatformRelationService } from "@/features/platform";
import { type IIdentityRepository, type IIdentityService, IdentityRepository, IdentityService, PlatformIdentitySyncConsumer } from "@/features/identities";
import { type IOnboardingService, OnboardingService, PlatformUserOnboardingConsumer } from "@/features/onboarding";
import { type IOfficeTypeRepository, type IOfficeTypeService, OfficeTypeRepository, OfficeTypeService } from "@/features/office-types";
import { type ITenantRelationService, TenantRelationService, type ITenantRepository, type ITenantService, TenantRepository } from "@/features/tenants";
import { TenantService } from "@/features/tenants/services/TenantService";
import { createContext } from "@/graphql";
import { routes } from "@/routes";

export const container = new Container({ defaultScope: "Singleton" });

const publisher = new NatsPublisher(broker);

container.bind(TYPES.Database).toConstantValue(db);
container.bind(TYPES.Logger).toConstantValue(logger);
container.bind(TYPES.Broker).toConstantValue(broker);
container.bind<IPublisher>(TYPES.Publisher).toConstantValue(publisher);
container.bind<IOutboxRepository>(TYPES.OutboxRepository).toConstantValue(new OutboxRepository(db));
container.bind<IRetryPolicy>(TYPES.RetryPolicy).toConstantValue(new ExponentialBackoffPolicy());
container
  .bind<IOutboxService>(TYPES.OutboxService)
  .toConstantValue(new OutboxService(container.get<IOutboxRepository>(TYPES.OutboxRepository), container.get<IRetryPolicy>(TYPES.RetryPolicy)));
container
  .bind<IWorker>(TYPES.OutboxWorker)
  .toConstantValue(new OutboxWorker(container.get<IOutboxService>(TYPES.OutboxService), publisher satisfies IOutboxPublisher));
container
  .bind<IOutboxCleanupService>(TYPES.OutboxCleanupService)
  .toConstantValue(new OutboxCleanupService(container.get<IOutboxRepository>(TYPES.OutboxRepository)));
container.bind<IWorker>(TYPES.OutboxCleanupWorker).toConstantValue(new OutboxCleanupWorker(container.get<IOutboxCleanupService>(TYPES.OutboxCleanupService)));
container.bind<IAuthorizationClient>(TYPES.AuthorizationClient).toConstantValue(new HttpAuthorizationClient({ baseUrl: env.AUTHORIZATION_SERVICE_URL }));
container.bind<ITenantRepository>(TYPES.TenantRepository).to(TenantRepository);
container.bind<ITenantService>(TYPES.TenantService).to(TenantService);
container.bind<ITenantRelationService>(TYPES.TenantRelationService).to(TenantRelationService);
container.bind<IOrganizationRepository>(TYPES.OrganizationRepository).to(OrganizationRepository);
container.bind<IOrganizationPreferenceRepository>(TYPES.OrganizationPreferenceRepository).to(OrganizationPreferenceRepository);
container.bind<IOrganizationService>(TYPES.OrganizationService).to(OrganizationService);
container.bind<IOrganizationPreferenceService>(TYPES.OrganizationPreferenceService).to(OrganizationPreferenceService);
container.bind<IOrganizationRelationService>(TYPES.OrganizationRelationService).to(OrganizationRelationService);
container.bind<IOfficeTypeRepository>(TYPES.OfficeTypeRepository).to(OfficeTypeRepository);
container.bind<IOfficeTypeService>(TYPES.OfficeTypeService).to(OfficeTypeService);
container.bind<IPlatformRelationService>(TYPES.PlatformRelationService).to(PlatformRelationService);
container.bind<IIdentityRelationService>(TYPES.IdentityRelationService).to(IdentityRelationService);
container.bind<IIdentityRepository>(TYPES.IdentityRepository).to(IdentityRepository);
container.bind<IIdentityService>(TYPES.IdentityService).to(IdentityService);
container.bind<IOnboardingService>(TYPES.OnboardingService).to(OnboardingService);
container.bind(TYPES.PlatformIdentitySyncConsumer).to(PlatformIdentitySyncConsumer);
container.bind(TYPES.PlatformUserOnboardingConsumer).to(PlatformUserOnboardingConsumer);

export const bindHttpServer = async (): Promise<void> => {
  const { schema } = await import("@/graphql/schema");

  container.bind<IHttpServer>(TYPES.HttpServer).toConstantValue(
    createHttpServer({
      config: {
        host: "0.0.0.0",
        port: 5005,
        environment: env.NODE_ENV,
        version: 1,
      },
      https: {
        key: readFileSync(env.PLATFORM_SERVICE_TLS_KEY_PATH),
        cert: readFileSync(env.PLATFORM_SERVICE_TLS_CERT_PATH),
        ca: readFileSync(env.CA_CERT_PATH),
        requestCert: true,
        rejectUnauthorized: true,
      },
      cookie: {},
      openapi: {
        info: {
          title: "Platform Service",
          version: "0.0.0",
          description: "Tenant, organization, and platform member APIs",
          license: { name: "ISC", url: "https://opensource.org/license/isc-license-txt" },
        },
        servers: [{ url: env.PLATFORM_SERVICE_URL }],
        tags: [
          { name: "tenants", description: "Tenant end-points" },
          { name: "tenant-members", description: "Tenant member end-points" },
          { name: "organizations", description: "Organization end-points" },
          { name: "platform-relations", description: "Platform relation end-points" },
          { name: "organization-relations", description: "Organization relation end-points" },
        ],
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
};

export const openApiOutputPath = path.join(process.cwd(), "dist", "openapi.json");
