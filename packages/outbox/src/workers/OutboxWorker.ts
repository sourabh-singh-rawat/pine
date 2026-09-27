import type { IWorker } from "@pine/common";
import { setTimeout as sleep } from "node:timers/promises";
import type { OutboxMessage } from "../db";
import { OutboxInvalidPayloadError } from "../errors";
import type { IOutboxService } from "../services";
import type { IOutboxPublisher } from "./IOutboxPublisher";

export type OutboxWorkerOptions = {
  batchSize?: number;
  pollIntervalMs?: number;
  errorDelayMs?: number;
};

const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_POLL_INTERVAL_MS = 1_000;

export class OutboxWorker implements IWorker {
  private readonly batchSize: number;
  private readonly pollIntervalMs: number;
  private readonly errorDelayMs: number;
  private running = false;

  constructor(
    private readonly outboxService: IOutboxService,
    private readonly publisher: IOutboxPublisher,
    options?: OutboxWorkerOptions,
  ) {
    this.batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
    this.pollIntervalMs = options?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    this.errorDelayMs = options?.errorDelayMs ?? this.pollIntervalMs;
  }

  tick = async (_signal?: AbortSignal): Promise<number> => {
    const messages = await this.outboxService.claimBatch(this.batchSize);
    if (messages.length === 0) return 0;

    await messages.reduce(
      (chain, message) => chain.then(() => this.publishOne(message)),
      Promise.resolve<OutboxMessage | undefined>(undefined),
    );

    return messages.length;
  };

  start = (): boolean => {
    if (this.running) return false;
    this.running = true;
    void this.runLoop();
    return true;
  };

  stop = (): boolean => {
    if (!this.running) return false;
    this.running = false;
    return true;
  };

  isRunning = (): boolean => this.running;

  private readonly runLoop = async (): Promise<void> => {
    while (this.running) {
      try {
        const processed = await this.tick();
        if (!this.running) break;
        if (processed === 0) {
          await sleep(this.pollIntervalMs);
        }
      } catch {
        if (!this.running) break;
        await sleep(this.errorDelayMs);
      }
    }
  };

  private readonly publishOne = async (message: OutboxMessage): Promise<OutboxMessage> => {
    try {
      const payload = this.assertPublishablePayload(message);
      await this.publisher.send(payload);
      return await this.outboxService.complete(message.id);
    } catch (error) {
      return await this.outboxService.failed({
        id: message.id,
        error: this.errorMessage(error),
      });
    }
  };

  private readonly assertPublishablePayload = (message: OutboxMessage): Record<string, unknown> => {
    const payload = message.payload;
    if (payload == null || typeof payload !== "object" || typeof payload.type !== "string") {
      throw new OutboxInvalidPayloadError(
        `Outbox message ${message.id} payload is missing a string CloudEvent type`,
      );
    }
    return payload;
  };

  private readonly errorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown error";
    }
  };
}
