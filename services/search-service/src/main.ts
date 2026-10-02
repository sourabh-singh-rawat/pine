import { configureTls } from "@pine/common";
import { env } from "@/bootstrap/env";
import "reflect-metadata";

configureTls({
  caPath: env.CA_CERT_PATH,
  certPath: env.SEARCH_SERVICE_TLS_CERT_PATH,
  keyPath: env.SEARCH_SERVICE_TLS_KEY_PATH,
});

import { logger } from "@/bootstrap";

export { container } from "@/bootstrap";

const main = async () => {
  logger.info("Search service started");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
