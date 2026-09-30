import type { IWorker } from "@pine/common";
import { setTimeout as sleep } from "node:timers/promises";
import { ITEM_ATTACHMENT_SWEEP_POLL_INTERVAL_MS } from "@/features/item-attachments/constants";
import type { IItemAttachmentService } from "@/features/item-attachments/services";

export type ItemAttachmentSweepWorkerOptions = {
  pollIntervalMs?: number;
  errorDelayMs?: number;
};

export class ItemAttachmentSweepWorker implements IWorker {
  private readonly pollIntervalMs: number;
  private readonly errorDelayMs: number;
  private running = false;
  private abortController: AbortController | null = null;

  constructor(
    private readonly itemAttachmentService: IItemAttachmentService,
    options?: ItemAttachmentSweepWorkerOptions,
  ) {
    this.pollIntervalMs = options?.pollIntervalMs ?? ITEM_ATTACHMENT_SWEEP_POLL_INTERVAL_MS;
    this.errorDelayMs = options?.errorDelayMs ?? this.pollIntervalMs;
  }

  async tick(signal?: AbortSignal): Promise<number> {
    return this.itemAttachmentService.failStale({ signal });
  }

  start(): boolean {
    if (this.running) {
      return false;
    }
    this.running = true;
    this.abortController = new AbortController();
    void this.runLoop(this.abortController.signal);
    return true;
  }

  stop(): boolean {
    if (!this.running) {
      return false;
    }
    this.running = false;
    this.abortController?.abort();
    this.abortController = null;
    return true;
  }

  isRunning(): boolean {
    return this.running;
  }

  private async runLoop(signal: AbortSignal): Promise<void> {
    while (this.running) {
      try {
        await this.tick(signal);
        if (!this.running || signal.aborted) {
          break;
        }
        await sleep(this.pollIntervalMs, undefined, { signal });
      } catch (error) {
        if (!this.running || signal.aborted || this.isAbortError(error)) {
          break;
        }
        try {
          await sleep(this.errorDelayMs, undefined, { signal });
        } catch {
          break;
        }
      }
    }
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === "AbortError";
  }
}
