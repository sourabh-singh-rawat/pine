import { configureTls } from "@pine/common/tls";
import { env } from "./env";

configureTls({
  caPath: env.CA_CERT_PATH,
  certPath: env.DATA_GATEWAY_TLS_CERT_PATH,
  keyPath: env.DATA_GATEWAY_TLS_KEY_PATH,
});
