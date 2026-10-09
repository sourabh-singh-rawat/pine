import { HttpIdentityClient } from "@pine/identity";
import { createGraphQLServer, createHttpServer, type IHttpServer } from "@pine/server";
import { Container } from "inversify";
import { readFileSync } from "node:fs";
import { TYPES } from "./container-types";
import { env, listenPortFromUrl } from "./env";
import { graphqlGateway } from "./graphql-gateway";
import "./tls";

const resolveEnvironment = (value: string) => {
  if (value === "production" || value === "development" || value === "test") {
    return value;
  }
  return "development";
};

const identityClient = new HttpIdentityClient({ baseUrl: env.IDENTITY_SERVICE_URL });

export const container = new Container({ defaultScope: "Singleton" });

container.bind<IHttpServer>(TYPES.HttpServer).toConstantValue(
  createHttpServer({
    https: {
      key: readFileSync(env.API_GATEWAY_TLS_KEY_PATH),
      cert: readFileSync(env.API_GATEWAY_TLS_CERT_PATH),
    },
    cors: {
      credentials: true,
      origin: [env.PINE_WEB_URL, env.IDENTITY_WEB_URL, env.VITE_PLATFORM_WEB_URL],
      methods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"],
    },
    config: {
      host: "0.0.0.0",
      port: listenPortFromUrl(env.API_GATEWAY_URL),
      environment: resolveEnvironment(env.NODE_ENV),
      version: 1,
    },
    hooks: {
      onRequest: [(request) => identityClient.resolveRequestIdentity(request)],
    },
    graphql: createGraphQLServer({
      gateway: graphqlGateway,
      context: async (req) => {
        const tenantHeader = req.headers["x-tenant-id"];
        const organizationHeader = req.headers["x-organization-id"];
        const tenantId = typeof tenantHeader === "string" && tenantHeader.length > 0 ? tenantHeader : undefined;
        const organizationId = typeof organizationHeader === "string" && organizationHeader.length > 0 ? organizationHeader : undefined;

        return {
          identityId: req.identity?.id,
          authMethod: req.identity?.authMethod,
          ...(tenantId ? { tenantId } : {}),
          ...(organizationId ? { organizationId } : {}),
        };
      },
    }),
    proxy: {
      undici: {
        headersTimeout: 60_000,
        bodyTimeout: 120_000,
        connect: {
          ca: readFileSync(env.CA_CERT_PATH),
          cert: readFileSync(env.API_GATEWAY_TLS_CERT_PATH),
          key: readFileSync(env.API_GATEWAY_TLS_KEY_PATH),
        },
      },
      routes: [
        { prefix: "/identity", upstream: env.IDENTITY_SERVICE_URL, proxyPayloads: true },
        { prefix: "/oauth", upstream: env.OAUTH_SERVICE_URL, proxyPayloads: true },
        { prefix: "/attachments", upstream: env.ATTACHMENT_SERVICE_URL, proxyPayloads: true },
        { prefix: "/authorization", upstream: env.AUTHORIZATION_SERVICE_URL, proxyPayloads: true },
      ],
    },
    routes: [],
  }),
);
