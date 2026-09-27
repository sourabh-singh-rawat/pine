import type { IWorker } from "@pine/common";
import { setTimeout as sleep } from "node:timers/promises";
import type { IOutboxCleanupService } from "../services";

export type OutboxCleanupWorkerOptions = {
  pollIntervalMs?: number;
  errorDelayMs?: number;
};

const DEFAULT_POLL_INTERVAL_MS = 60 * 60 * 1_000;

export class OutboxCleanupWorker implements IWorker {
  private readonly pollIntervalMs: number;
  private readonly errorDelayMs: number;
  private running = false;
  private abortController: AbortController | null = null;

  constructor(
    private readonly cleanupService: IOutboxCleanupService,
    options?: OutboxCleanupWorkerOptions,
  ) {
    this.pollIntervalMs = options?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    this.errorDelayMs = options?.errorDelayMs ?? this.pollIntervalMs;
  }

  tick = async (signal?: AbortSignal): Promise<number> => {
    return this.cleanupService.cleanup({ signal });
  };

  start = (): boolean => {
    if (this.running) return false;
    this.running = true;
    this.abortController = new AbortController();
    void this.runLoop(this.abortController.signal);
    return true;
  };

  stop = (): boolean => {
    if (!this.running) return false;
    this.running = false;
    this.abortController?.abort();
    this.abortController = null;
    return true;
  };

  isRunning = (): boolean => this.running;

  private readonly runLoop = async (signal: AbortSignal): Promise<void> => {
    while (this.running) {
      try {
        await this.tick(signal);
        if (!this.running || signal.aborted) break;
        await sleep(this.pollIntervalMs, undefined, { signal });
      } catch (error) {
        if (!this.running || signal.aborted || this.isAbortError(error)) break;
        try {
          await sleep(this.errorDelayMs, undefined, { signal });
        } catch {
          break;
        }
      }
    }
  };

  private readonly isAbortError = (error: unknown): boolean => {
    return error instanceof Error && error.name === "AbortError";
  };
}
