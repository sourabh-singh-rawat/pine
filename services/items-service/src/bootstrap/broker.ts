import { NatsBroker } from "@pine/events";
import { logger } from "@/bootstrap/logger";
import { env } from "@/bootstrap/env";

export const broker = new NatsBroker({
  servers: [env.NATS_URL || "nats"],
  streams: ["items", "identity"],
  logger,
});
