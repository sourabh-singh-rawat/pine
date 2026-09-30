import { ILogger } from "@pine/server";

export interface IBrokerOptions {
  servers: string[];
  logger?: ILogger;
}
