import { retry } from "@pine/common";
import { connect, ErrorCode, NatsError, type NatsConnection } from "nats";
import type { IBroker } from "./IBroker";
import type { IBrokerOptions } from "./IBrokerOptions";

const CONNECT_TIMEOUT_MS = 10_000;
const CONNECT_MAX_ATTEMPTS = 8;
const CONNECT_BASE_DELAY_MS = 500;

export const isRetryableNatsConnectError = (error: unknown): boolean =>
  error instanceof NatsError &&
  (error.code === ErrorCode.Timeout || error.code === ErrorCode.ConnectionRefused);

export class NatsBroker implements IBroker {
  public client!: NatsConnection;

  constructor(private readonly options: IBrokerOptions) {}

  getConfig() {
    return this.options;
  }

  async init() {
    const client = await retry(
      () =>
        connect({
          servers: this.options.servers,
          timeout: CONNECT_TIMEOUT_MS,
        }),
      {
        maxAttempts: CONNECT_MAX_ATTEMPTS,
        baseDelayMs: CONNECT_BASE_DELAY_MS,
        shouldRetry: isRetryableNatsConnectError,
        onRetry: (error, attempt, waitMs) => {
          const code = error instanceof NatsError ? error.code : "error";
          this.options.logger?.info(
            `NATS connect ${code} (attempt ${attempt}/${CONNECT_MAX_ATTEMPTS}), retrying in ${waitMs}ms`,
          );
        },
      },
    );
    this.client = client;

    this.options.logger?.info(
      `✅ [Nats Jetstream] connected at ${client.info?.host}:${client.info?.port}`,
    );
  }
}
