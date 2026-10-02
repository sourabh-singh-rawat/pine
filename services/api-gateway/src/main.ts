import "reflect-metadata";
import { initializeObservability } from "@pine/observability";
import type { IHttpServer } from "@pine/server";
import { container, env, logger, TYPES } from "./bootstrap";

const main = async () => {
  const observability = initializeObservability({
    enabled: true,
    serviceName: "api-gateway",
    serviceVersion: "0.0.0",
    environment: env.NODE_ENV,
    serviceNamespace: "pine",
    otlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
  });
  observability?.start();

  const httpServer = container.get<IHttpServer>(TYPES.HttpServer);
  await httpServer.start();

  logger.info(`API Gateway ready at ${env.API_GATEWAY_URL}`);
  logger.info(`GraphQL:  ${env.API_GATEWAY_URL}/graphql`);
  logger.info(`Swagger:  ${env.API_GATEWAY_URL}/docs`);
  logger.info(`Proxy → identity:   ${env.IDENTITY_SERVICE_URL}  (/identity)`);
  logger.info(`Proxy → oauth:      ${env.OAUTH_SERVICE_URL}  (/oauth)`);
  logger.info(`Proxy → attachment: ${env.ATTACHMENT_SERVICE_URL}  (/attachments)`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
