import { PinoLogger } from "@pine/server";
import pino from "pino";

const createPino = () => {
  if (process.env.NODE_ENV === "production") {
    return pino();
  }

  return pino({ transport: { target: "pino-pretty" } });
};

export const logger = new PinoLogger(createPino());
