import "reflect-metadata";
import type { IHttpServer } from "@pine/server";
import { container, env, logger, TYPES } from "./bootstrap";

const main = async () => {
  const httpServer = container.get<IHttpServer>(TYPES.HttpServer);
  await httpServer.start();

  logger.info(`Data Gateway ready at ${env.DATA_GATEWAY_URL}`);
  logger.info(`Proxy → attachment: ${env.ATTACHMENT_SERVICE_URL}  (/attachments)`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
