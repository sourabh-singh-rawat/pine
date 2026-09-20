import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OutboxStatus } from "../../constants";
import type { OutboxMessage } from "../../db";
import type { IOutboxService } from "../../services";
import type { IOutboxPublisher } from "../IOutboxPublisher";
import { OutboxWorker } from "../OutboxWorker";

const createMessage = (overrides: Partial<OutboxMessage> = {}): OutboxMessage => ({
  id: "msg-1",
  eventId: "evt-1",
  eventType: "issues.issue.created",
  eventVersion: 1,
  aggregateType: "issue",
  aggregateId: "agg-1",
  payload: {
    id: "evt-1",
    type: "issues.issue.created",
    source: "pine/issues-service",
    specversion: "1.0",
  },
  status: OutboxStatus.Processing,
  retryCount: 0,
  nextAttemptAt: new Date("2026-01-01T00:00:00.000Z"),
  lastAttemptAt: null,
  lastError: null,
  publishedAt: null,
  ...overrides,
});

const createDeps = () => {
  const outboxService = {
    schedule: vi.fn(),
    claimBatch: vi.fn(),
    complete: vi.fn(),
    failed: vi.fn(),
    get: vi.fn(),
    getByEventId: vi.fn(),
  } as unknown as IOutboxService & {
    schedule: ReturnType<typeof vi.fn>;
    claimBatch: ReturnType<typeof vi.fn>;
    complete: ReturnType<typeof vi.fn>;
    failed: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    getByEventId: ReturnType<typeof vi.fn>;
  };

  const publisher = {
    send: vi.fn().mockResolvedValue(undefined),
  } as IOutboxPublisher & { send: ReturnType<typeof vi.fn> };

  return { outboxService, publisher };
};

describe("OutboxWorker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("tick", () => {
    it("returns 0 and does not publish when the batch is empty", async () => {
      const { outboxService, publisher } = createDeps();
      outboxService.claimBatch.mockResolvedValue([]);

      const worker = new OutboxWorker(outboxService, publisher, { batchSize: 10 });
      const processed = await worker.tick();

      expect(processed).toBe(0);
      expect(outboxService.claimBatch).toHaveBeenCalledWith(10);
      expect(publisher.send).not.toHaveBeenCalled();
      expect(outboxService.complete).not.toHaveBeenCalled();
      expect(outboxService.failed).not.toHaveBeenCalled();
    });

    it("uses the default batch size when none is provided", async () => {
      const { outboxService, publisher } = createDeps();
      outboxService.claimBatch.mockResolvedValue([]);

      const worker = new OutboxWorker(outboxService, publisher);
      await worker.tick();

      expect(outboxService.claimBatch).toHaveBeenCalledWith(50);
    });

    it("publishes each claimed message and marks them complete", async () => {
      const { outboxService, publisher } = createDeps();
      const first = createMessage({ id: "msg-1" });
      const second = createMessage({
        id: "msg-2",
        payload: { type: "issues.issue.updated", id: "evt-2" },
      });
      outboxService.claimBatch.mockResolvedValue([first, second]);
      outboxService.complete.mockImplementation(async (id: string) => createMessage({ id }));

      const worker = new OutboxWorker(outboxService, publisher);
      const processed = await worker.tick();

      expect(processed).toBe(2);
      expect(publisher.send).toHaveBeenCalledTimes(2);
      expect(publisher.send).toHaveBeenNthCalledWith(1, first.payload);
      expect(publisher.send).toHaveBeenNthCalledWith(2, second.payload);
      expect(outboxService.complete).toHaveBeenNthCalledWith(1, "msg-1");
      expect(outboxService.complete).toHaveBeenNthCalledWith(2, "msg-2");
      expect(outboxService.failed).not.toHaveBeenCalled();
    });

    it("processes messages sequentially", async () => {
      const { outboxService, publisher } = createDeps();
      const order: string[] = [];
      const messages = [createMessage({ id: "msg-1" }), createMessage({ id: "msg-2" })];

      outboxService.claimBatch.mockResolvedValue(messages);
      publisher.send.mockImplementation(async (payload: Record<string, unknown>) => {
        order.push(`send:${String(payload.id ?? "unknown")}`);
        await Promise.resolve();
      });
      outboxService.complete.mockImplementation(async (id: string) => {
        order.push(`complete:${id}`);
        return createMessage({ id });
      });

      const worker = new OutboxWorker(outboxService, publisher);
      await worker.tick();

      expect(order).toEqual(["send:evt-1", "complete:msg-1", "send:evt-1", "complete:msg-2"]);
    });

    it("marks a message failed when publish throws an Error", async () => {
      const { outboxService, publisher } = createDeps();
      const message = createMessage();
      outboxService.claimBatch.mockResolvedValue([message]);
      publisher.send.mockRejectedValue(new Error("nats down"));
      outboxService.failed.mockResolvedValue(
        createMessage({ id: message.id, status: OutboxStatus.Failed }),
      );

      const worker = new OutboxWorker(outboxService, publisher);
      const processed = await worker.tick();

      expect(processed).toBe(1);
      expect(outboxService.complete).not.toHaveBeenCalled();
      expect(outboxService.failed).toHaveBeenCalledWith({
        id: "msg-1",
        error: "nats down",
      });
    });

    it("marks a message failed when payload is missing a string type", async () => {
      const { outboxService, publisher } = createDeps();
      const message = createMessage({
        id: "msg-bad",
        payload: { id: "evt-1", data: {} },
      });
      outboxService.claimBatch.mockResolvedValue([message]);
      outboxService.failed.mockResolvedValue(
        createMessage({ id: "msg-bad", status: OutboxStatus.Failed }),
      );

      const worker = new OutboxWorker(outboxService, publisher);
      await worker.tick();

      expect(publisher.send).not.toHaveBeenCalled();
      expect(outboxService.failed).toHaveBeenCalledWith({
        id: "msg-bad",
        error: "Outbox message msg-bad payload is missing a string CloudEvent type",
      });
    });

    it("marks a message failed when payload is null", async () => {
      const { outboxService, publisher } = createDeps();
      const message = createMessage({
        id: "msg-null",
        payload: null as unknown as Record<string, unknown>,
      });
      outboxService.claimBatch.mockResolvedValue([message]);
      outboxService.failed.mockResolvedValue(createMessage({ id: "msg-null" }));

      const worker = new OutboxWorker(outboxService, publisher);
      await worker.tick();

      expect(publisher.send).not.toHaveBeenCalled();
      expect(outboxService.failed).toHaveBeenCalledWith({
        id: "msg-null",
        error: "Outbox message msg-null payload is missing a string CloudEvent type",
      });
    });

    it("stringifies non-Error failures when marking failed", async () => {
      const { outboxService, publisher } = createDeps();
      outboxService.claimBatch.mockResolvedValue([createMessage()]);
      publisher.send.mockRejectedValue("plain failure");
      outboxService.failed.mockResolvedValue(createMessage());

      const worker = new OutboxWorker(outboxService, publisher);
      await worker.tick();

      expect(outboxService.failed).toHaveBeenCalledWith({
        id: "msg-1",
        error: "plain failure",
      });
    });

    it("JSON-stringifies object failures when marking failed", async () => {
      const { outboxService, publisher } = createDeps();
      outboxService.claimBatch.mockResolvedValue([createMessage()]);
      publisher.send.mockRejectedValue({ code: "ECONNREFUSED", reason: "broker" });
      outboxService.failed.mockResolvedValue(createMessage());

      const worker = new OutboxWorker(outboxService, publisher);
      await worker.tick();

      expect(outboxService.failed).toHaveBeenCalledWith({
        id: "msg-1",
        error: JSON.stringify({ code: "ECONNREFUSED", reason: "broker" }),
      });
    });

    it("continues the batch after an individual message failure", async () => {
      const { outboxService, publisher } = createDeps();
      const first = createMessage({ id: "msg-1" });
      const second = createMessage({
        id: "msg-2",
        payload: { type: "issues.issue.created", id: "evt-2" },
      });
      outboxService.claimBatch.mockResolvedValue([first, second]);
      publisher.send
        .mockRejectedValueOnce(new Error("first failed"))
        .mockResolvedValueOnce(undefined);
      outboxService.failed.mockResolvedValue(createMessage({ id: "msg-1" }));
      outboxService.complete.mockResolvedValue(createMessage({ id: "msg-2" }));

      const worker = new OutboxWorker(outboxService, publisher);
      const processed = await worker.tick();

      expect(processed).toBe(2);
      expect(outboxService.failed).toHaveBeenCalledWith({ id: "msg-1", error: "first failed" });
      expect(outboxService.complete).toHaveBeenCalledWith("msg-2");
    });
  });

  describe("lifecycle", () => {
    it("start returns true once and isRunning tracks state", async () => {
      const { outboxService, publisher } = createDeps();
      outboxService.claimBatch.mockResolvedValue([]);

      const worker = new OutboxWorker(outboxService, publisher, { pollIntervalMs: 5_000 });

      expect(worker.isRunning()).toBe(false);
      expect(worker.start()).toBe(true);
      expect(worker.isRunning()).toBe(true);
      expect(worker.start()).toBe(false);

      worker.stop();
      await vi.advanceTimersByTimeAsync(5_000);
    });

    it("stop returns false when not running", () => {
      const { outboxService, publisher } = createDeps();
      const worker = new OutboxWorker(outboxService, publisher);

      expect(worker.stop()).toBe(false);
      expect(worker.isRunning()).toBe(false);
    });

    it("stop returns true and clears running state", async () => {
      const { outboxService, publisher } = createDeps();
      outboxService.claimBatch.mockResolvedValue([]);

      const worker = new OutboxWorker(outboxService, publisher, { pollIntervalMs: 5_000 });
      worker.start();

      expect(worker.stop()).toBe(true);
      expect(worker.isRunning()).toBe(false);
      expect(worker.stop()).toBe(false);

      await vi.advanceTimersByTimeAsync(5_000);
    });
  });

  describe("runLoop", () => {
    it("sleeps only when a tick processes no work", async () => {
      const { outboxService, publisher } = createDeps();
      let calls = 0;
      outboxService.claimBatch.mockImplementation(async () => {
        calls += 1;
        if (calls === 1) {
          return [createMessage({ id: "msg-work" })];
        }
        return [];
      });
      outboxService.complete.mockResolvedValue(createMessage({ id: "msg-work" }));

      const worker = new OutboxWorker(outboxService, publisher, { pollIntervalMs: 1_000 });
      worker.start();

      await vi.advanceTimersByTimeAsync(0);
      expect(outboxService.claimBatch).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(999);
      expect(outboxService.claimBatch).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(1);
      expect(outboxService.claimBatch).toHaveBeenCalledTimes(3);

      worker.stop();
      await vi.advanceTimersByTimeAsync(1_000);
    });

    it("delays with errorDelayMs when tick throws and keeps looping", async () => {
      const { outboxService, publisher } = createDeps();
      outboxService.claimBatch
        .mockRejectedValueOnce(new Error("db unavailable"))
        .mockResolvedValue([]);

      const worker = new OutboxWorker(outboxService, publisher, {
        pollIntervalMs: 5_000,
        errorDelayMs: 250,
      });
      worker.start();

      await vi.advanceTimersByTimeAsync(0);
      expect(outboxService.claimBatch).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(249);
      expect(outboxService.claimBatch).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1);
      expect(outboxService.claimBatch).toHaveBeenCalledTimes(2);

      worker.stop();
      await vi.advanceTimersByTimeAsync(5_000);
    });

    it("stops the loop after stop without requiring more work", async () => {
      const { outboxService, publisher } = createDeps();
      outboxService.claimBatch.mockResolvedValue([]);

      const worker = new OutboxWorker(outboxService, publisher, { pollIntervalMs: 1_000 });
      worker.start();

      await vi.advanceTimersByTimeAsync(0);
      const callsAfterFirstIdle = outboxService.claimBatch.mock.calls.length;

      worker.stop();
      await vi.advanceTimersByTimeAsync(5_000);

      expect(outboxService.claimBatch.mock.calls).toHaveLength(callsAfterFirstIdle);
      expect(worker.isRunning()).toBe(false);
    });
  });
});
