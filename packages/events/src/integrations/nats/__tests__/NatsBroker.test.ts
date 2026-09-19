import { describe, expect, it, vi } from "vitest";
import { connect } from "nats";
import type { IBrokerOptions } from "../IBrokerOptions";
import { NatsBroker } from "../NatsBroker";

vi.mock("nats");

describe("Nats Broker Unit Test", () => {
  it("initializes nats broker with correct options", async () => {
    const options: IBrokerOptions = {
      servers: ["nats"],
      streams: ["identity"],
    };
    const nats = new NatsBroker(options);

    expect(nats.getConfig()).toBe(options);
  });

  it("should initialize NATS connection using nats server options", async () => {
    const options: IBrokerOptions = {
      servers: ["localhost:4222"],
    };
    const mockClient = {
      info: { host: "localhost", port: 4222 },
      jetstreamManager: vi.fn().mockResolvedValue({
        streams: { add: vi.fn().mockResolvedValue(undefined) },
      }),
    };
    vi.mocked(connect).mockResolvedValue(mockClient as never);

    const broker = new NatsBroker(options);

    await broker.init();

    expect(connect).toHaveBeenCalledTimes(1);
    expect(broker.client).toBe(mockClient);
  });
});
