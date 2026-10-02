import {
  AckPolicy,
  DeliverPolicy,
  ErrorCode,
  type JetStreamClient,
  JSONCodec,
  type JsMsg,
  NatsError,
  ReplayPolicy,
} from "nats";
import type { ILogger } from "@pine/server";
import { Streams } from "../../constants";
import type { IBroker } from "./IBroker";

const JSM_TIMEOUT_MS = 10_000;
const ENSURE_MAX_ATTEMPTS = 8;
const ENSURE_BASE_DELAY_MS = 500;

export const isRetryableConsumerStartError = (error: unknown): boolean =>
  error instanceof NatsError && error.code === ErrorCode.Timeout;

export const formatConsumerError = (error: unknown): string => {
  if (error instanceof NatsError) {
    return `${error.code}: ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export abstract class Consumer<T> {
  private readonly jetstream: JetStreamClient;
  private readonly logger: ILogger | undefined;
  abstract readonly stream: Streams;
  abstract readonly consumer: string;
  abstract readonly subjects: string[];

  constructor(broker: IBroker) {
    this.jetstream = broker.client.jetstream({ timeout: JSM_TIMEOUT_MS });
    this.logger = broker.getConfig().logger;
  }

  async start(): Promise<void> {
    try {
      await this.ensureConsumerWithRetry();
      this.logger?.info(`NATS consumer started: ${this.consumer} on stream ${this.stream}`);
      await this.consume();
    } catch (error) {
      this.logger?.error(
        `NATS consumer failed: ${this.consumer} on stream ${this.stream}: ${formatConsumerError(error)}`,
      );
    }
  }

  async consume(): Promise<void> {
    const consumer = await this.jetstream.consumers.get(this.stream, this.consumer);
    const messages = await consumer.consume({ max_messages: 5 });

    const codec = JSONCodec<T>();

    for await (const message of messages) {
      try {
        await this.onMessage(message, codec.decode(message.data));
      } catch {
        message.nak();
      }
    }
  }

  abstract onMessage(messagae: JsMsg, payload: T): Promise<void>;

  private async ensureConsumerWithRetry(): Promise<void> {
    for (let attempt = 1; attempt <= ENSURE_MAX_ATTEMPTS; attempt += 1) {
      try {
        await this.ensureConsumer();
        return;
      } catch (error) {
        if (!isRetryableConsumerStartError(error) || attempt === ENSURE_MAX_ATTEMPTS) {
          throw error;
        }

        const waitMs = ENSURE_BASE_DELAY_MS * 2 ** (attempt - 1);
        this.logger?.info(
          `NATS consumer ${this.consumer} ensure TIMEOUT (attempt ${attempt}/${ENSURE_MAX_ATTEMPTS}), retrying in ${waitMs}ms`,
        );
        await delay(waitMs);
      }
    }
  }

  private async ensureConsumer(): Promise<void> {
    const manager = await this.jetstream.jetstreamManager();

    try {
      const info = await manager.consumers.info(this.stream, this.consumer);

      if (this.sameSubjects(info.config.filter_subjects ?? [], this.subjects)) {
        return;
      }
      await manager.consumers.update(this.stream, this.consumer, {
        filter_subjects: this.subjects,
      });
    } catch (error) {
      if (!(error instanceof NatsError) || error.api_error?.code !== 404) {
        throw error;
      }

      await manager.consumers.add(this.stream, {
        name: this.consumer,
        durable_name: this.consumer,
        deliver_policy: DeliverPolicy.All,
        filter_subjects: this.subjects,
        max_deliver: 100,
        ack_wait: 30 * 1000 * 1000 * 1000,
        ack_policy: AckPolicy.Explicit,
        replay_policy: ReplayPolicy.Instant,
      });
    }
  }

  private sameSubjects(a: string[], b: string[]) {
    return a.length === b.length && a.every((subject) => b.includes(subject));
  }
}
