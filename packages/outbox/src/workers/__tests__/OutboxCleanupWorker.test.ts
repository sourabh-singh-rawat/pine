import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IOutboxCleanupService } from "../../services";
import { OutboxCleanupWorker } from "../OutboxCleanupWorker";

const createCleanupService = () => {
  return {
    cleanup: vi.fn(),
  } as IOutboxCleanupService & { cleanup: ReturnType<typeof vi.fn> };
};

describe("OutboxCleanupWorker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("tick", () => {
    it("delegates to the cleanup service and returns deleted count", async () => {
      const cleanupService = createCleanupService();
      cleanupService.cleanup.mockResolvedValue(42);

      const worker = new OutboxCleanupWorker(cleanupService);
      const deleted = await worker.tick();

      expect(deleted).toBe(42);
      expect(cleanupService.cleanup).toHaveBeenCalledTimes(1);
      expect(cleanupService.cleanup).toHaveBeenCalledWith({ signal: undefined });
    });

    it("forwards an abort signal to the cleanup service", async () => {
      const cleanupService = createCleanupService();
      cleanupService.cleanup.mockResolvedValue(0);
      const controller = new AbortController();

      const worker = new OutboxCleanupWorker(cleanupService);
      await worker.tick(controller.signal);

      expect(cleanupService.cleanup).toHaveBeenCalledWith({ signal: controller.signal });
    });
  });

  describe("lifecycle", () => {
    it("start returns true once and isRunning tracks state", async () => {
      const cleanupService = createCleanupService();
      cleanupService.cleanup.mockResolvedValue(0);

      const worker = new OutboxCleanupWorker(cleanupService, { pollIntervalMs: 5_000 });

      expect(worker.isRunning()).toBe(false);
      expect(worker.start()).toBe(true);
      expect(worker.isRunning()).toBe(true);
      expect(worker.start()).toBe(false);

      worker.stop();
      await vi.advanceTimersByTimeAsync(0);
    });

    it("stop returns false when not running", () => {
      const cleanupService = createCleanupService();
      const worker = new OutboxCleanupWorker(cleanupService);

      expect(worker.stop()).toBe(false);
      expect(worker.isRunning()).toBe(false);
    });

    it("stop returns true and clears running state", async () => {
      const cleanupService = createCleanupService();
      cleanupService.cleanup.mockResolvedValue(0);

      const worker = new OutboxCleanupWorker(cleanupService, { pollIntervalMs: 5_000 });
      worker.start();

      expect(worker.stop()).toBe(true);
      expect(worker.isRunning()).toBe(false);
      expect(worker.stop()).toBe(false);

      await vi.advanceTimersByTimeAsync(0);
    });
  });

  describe("runLoop", () => {
    it("sleeps after every successful tick regardless of deleted count", async () => {
      const cleanupService = createCleanupService();
      cleanupService.cleanup.mockResolvedValueOnce(10).mockResolvedValue(0);

      const worker = new OutboxCleanupWorker(cleanupService, { pollIntervalMs: 1_000 });
      worker.start();

      await vi.advanceTimersByTimeAsync(0);
      expect(cleanupService.cleanup).toHaveBeenCalledTimes(1);
      expect(cleanupService.cleanup.mock.calls[0]?.[0]?.signal).toBeInstanceOf(AbortSignal);

      await vi.advanceTimersByTimeAsync(999);
      expect(cleanupService.cleanup).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1);
      expect(cleanupService.cleanup).toHaveBeenCalledTimes(2);

      worker.stop();
      await vi.advanceTimersByTimeAsync(0);
    });

    it("delays with errorDelayMs when tick throws and keeps looping", async () => {
      const cleanupService = createCleanupService();
      cleanupService.cleanup
        .mockRejectedValueOnce(new Error("db unavailable"))
        .mockResolvedValue(0);

      const worker = new OutboxCleanupWorker(cleanupService, {
        pollIntervalMs: 5_000,
        errorDelayMs: 250,
      });
      worker.start();

      await vi.advanceTimersByTimeAsync(0);
      expect(cleanupService.cleanup).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(249);
      expect(cleanupService.cleanup).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1);
      expect(cleanupService.cleanup).toHaveBeenCalledTimes(2);

      worker.stop();
      await vi.advanceTimersByTimeAsync(0);
    });

    it("aborts pending delay immediately when stop is called", async () => {
      const cleanupService = createCleanupService();
      cleanupService.cleanup.mockResolvedValue(0);

      const worker = new OutboxCleanupWorker(cleanupService, { pollIntervalMs: 60_000 });
      worker.start();

      await vi.advanceTimersByTimeAsync(0);
      const callsAfterFirstIdle = cleanupService.cleanup.mock.calls.length;

      worker.stop();
      await vi.advanceTimersByTimeAsync(0);

      expect(cleanupService.cleanup.mock.calls).toHaveLength(callsAfterFirstIdle);
      expect(worker.isRunning()).toBe(false);
    });

    it("does not treat abort during delay as a retryable error", async () => {
      const cleanupService = createCleanupService();
      cleanupService.cleanup.mockResolvedValue(0);

      const worker = new OutboxCleanupWorker(cleanupService, {
        pollIntervalMs: 60_000,
        errorDelayMs: 100,
      });
      worker.start();

      await vi.advanceTimersByTimeAsync(0);
      expect(cleanupService.cleanup).toHaveBeenCalledTimes(1);

      worker.stop();
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(100);

      expect(cleanupService.cleanup).toHaveBeenCalledTimes(1);
    });
  });
});
