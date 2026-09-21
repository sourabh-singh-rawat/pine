import { PinoLogger } from "@pine/server";
import pino from "pino";

export const logger = new PinoLogger(pino({ transport: { target: "pino-pretty" } }));
