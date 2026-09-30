import { createHttpServer, type IHttpServer } from "@pine/server";
import { Container } from "inversify";
import { readFileSync } from "node:fs";
import { TYPES } from "./container-types";
import { env, listenPortFromUrl } from "./env";
import "./tls";

const resolveEnvironment = (value: string) => {
  if (value === "production" || value === "development" || value === "test") {
    return value;
  }
  return "development";
};

export const container = new Container({ defaultScope: "Singleton" });

container.bind<IHttpServer>(TYPES.HttpServer).toConstantValue(
  createHttpServer({
    https: {
      key: readFileSync(env.DATA_GATEWAY_TLS_KEY_PATH),
      cert: readFileSync(env.DATA_GATEWAY_TLS_CERT_PATH),
    },
    cors: {
      credentials: true,
      origin: [env.PINE_WEB_URL, env.IDENTITY_WEB_URL, env.VITE_PLATFORM_WEB_URL],
      methods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"],
    },
    config: {
      host: "0.0.0.0",
      port: listenPortFromUrl(env.DATA_GATEWAY_URL),
      environment: resolveEnvironment(env.NODE_ENV),
      version: 1,
    },
    bodyLimit: env.ATTACHMENT_UPLOAD_MAX_BYTES,
    proxy: {
      undici: {
        headersTimeout: 60_000,
        bodyTimeout: 120_000,
        connect: {
          ca: readFileSync(env.CA_CERT_PATH),
          cert: readFileSync(env.DATA_GATEWAY_TLS_CERT_PATH),
          key: readFileSync(env.DATA_GATEWAY_TLS_KEY_PATH),
        },
      },
      routes: [
        {
          prefix: "/attachments",
          upstream: env.ATTACHMENT_SERVICE_URL,
          proxyPayloads: true,
        },
      ],
    },
    routes: [],
  }),
);
