import { ILogger } from "./ILogger";

export interface PinoLikeLogger {
  info(message: string): void;
  error(message: string): void;
}

export class PinoLogger implements ILogger {
  constructor(private readonly pino: PinoLikeLogger) {}

  info(message: string) {
    this.pino.info(message);
  }

  error(message: string) {
    this.pino.error(message);
  }
}
