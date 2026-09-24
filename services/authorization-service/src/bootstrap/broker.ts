import { NatsBroker } from "@pine/events";
import { env } from "@/bootstrap/env";
import { logger } from "@/bootstrap/logger";

export const broker = new NatsBroker({
  servers: [env.NATS_URL],
  streams: ["platform", "identity", "items"],
  logger,
});
