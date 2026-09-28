import { describe, expect, it, vi } from "vitest";
import { connect } from "nats";
import type { IBrokerOptions } from "../IBrokerOptions";
import { NatsBroker } from "../NatsBroker";

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
    expect(connect).toHaveBeenCalledWith({ servers: ["localhost:4222"] });
    expect(broker.client).toBe(mockClient);
    expect(mockClient.jetstreamManager).not.toHaveBeenCalled();
  });
});
