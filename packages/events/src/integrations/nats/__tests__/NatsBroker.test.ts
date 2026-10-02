import { describe, expect, it, vi } from "vitest";
import { connect, ErrorCode, NatsError } from "nats";
import type { IBrokerOptions } from "../IBrokerOptions";
import { isRetryableNatsConnectError, NatsBroker } from "../NatsBroker";

vi.mock("nats", async (importOriginal) => {
  const actual = await importOriginal<typeof import("nats")>();
  return {
    ...actual,
    connect: vi.fn(),
  };
});

const createMockClient = () => ({
  info: { host: "localhost", port: 4222 },
  jetstreamManager: vi.fn(),
});

describe("Nats Broker Unit Test", () => {
  it("initializes nats broker with correct options", () => {
    const options: IBrokerOptions = {
      servers: ["nats"],
    };
    const nats = new NatsBroker(options);

    expect(nats.getConfig()).toBe(options);
  });

  it("should initialize NATS connection using nats server options", async () => {
    const options: IBrokerOptions = {
      servers: ["localhost:4222"],
    };
    const mockClient = createMockClient();
    vi.mocked(connect).mockResolvedValue(mockClient);

    const broker = new NatsBroker(options);

    await broker.init();

    expect(connect).toHaveBeenCalledTimes(1);
    expect(connect).toHaveBeenCalledWith({
      servers: ["localhost:4222"],
      timeout: 10_000,
    });
    expect(broker.client).toBe(mockClient);
    expect(mockClient.jetstreamManager).not.toHaveBeenCalled();
  });

  it("retries connect on TIMEOUT then succeeds", async () => {
    vi.useFakeTimers();
    const options: IBrokerOptions = {
      servers: ["localhost:4222"],
      logger: { info: vi.fn(), error: vi.fn() },
    };
    const mockClient = createMockClient();
    vi.mocked(connect)
      .mockRejectedValueOnce(NatsError.errorForCode(ErrorCode.Timeout))
      .mockResolvedValueOnce(mockClient);

    const broker = new NatsBroker(options);
    const initPromise = broker.init();
    await vi.runAllTimersAsync();
    await initPromise;

    expect(connect).toHaveBeenCalledTimes(2);
    expect(broker.client).toBe(mockClient);
    expect(options.logger?.info).toHaveBeenCalledWith(
      expect.stringContaining("NATS connect TIMEOUT"),
    );

    vi.useRealTimers();
  });
});

describe("isRetryableNatsConnectError", () => {
  it("returns true for TIMEOUT and ConnectionRefused", () => {
    expect(isRetryableNatsConnectError(NatsError.errorForCode(ErrorCode.Timeout))).toBe(true);
    expect(isRetryableNatsConnectError(NatsError.errorForCode(ErrorCode.ConnectionRefused))).toBe(
      true,
    );
  });

  it("returns false for other errors", () => {
    expect(isRetryableNatsConnectError(NatsError.errorForCode(ErrorCode.NoResponders))).toBe(false);
    expect(isRetryableNatsConnectError(new Error("boom"))).toBe(false);
  });
});
