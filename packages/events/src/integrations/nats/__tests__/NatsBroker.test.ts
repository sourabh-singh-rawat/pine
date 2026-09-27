import { describe, expect, it, vi } from "vitest";
import { NatsError, connect } from "nats";
import type { IBrokerOptions } from "../IBrokerOptions";
import { NatsBroker } from "../NatsBroker";

vi.mock("nats", async (importOriginal) => {
  const actual = await importOriginal<typeof import("nats")>();
  return {
    ...actual,
    connect: vi.fn(),
  };
});

const createJetStreamManager = (
  overrides: {
    info?: ReturnType<typeof vi.fn>;
    add?: ReturnType<typeof vi.fn>;
  } = {},
) => ({
  streams: {
    info: overrides.info ?? vi.fn().mockResolvedValue({ config: { name: "identity" } }),
    add: overrides.add ?? vi.fn().mockResolvedValue(undefined),
  },
});

const createMockClient = (jetstreamManager: ReturnType<typeof createJetStreamManager>) => ({
  info: { host: "localhost", port: 4222 },
  jetstreamManager: vi.fn().mockResolvedValue(jetstreamManager),
});

describe("Nats Broker Unit Test", () => {
  it("initializes nats broker with correct options", () => {
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
    const jetstreamManager = createJetStreamManager();
    const mockClient = createMockClient(jetstreamManager);
    vi.mocked(connect).mockResolvedValue(mockClient);

    const broker = new NatsBroker(options);

    await broker.init();

    expect(connect).toHaveBeenCalledTimes(1);
    expect(broker.client).toBe(mockClient);
    expect(jetstreamManager.streams.info).not.toHaveBeenCalled();
    expect(jetstreamManager.streams.add).not.toHaveBeenCalled();
  });

  it("awaits stream creation for configured streams before init resolves", async () => {
    const options: IBrokerOptions = {
      servers: ["localhost:4222"],
      streams: ["identity", "platform"],
    };
    const notFound = new NatsError("stream not found", "404");
    notFound.api_error = { code: 404, description: "stream not found" };

    const info = vi.fn().mockRejectedValue(notFound);
    const add = vi.fn().mockResolvedValue(undefined);
    const jetstreamManager = createJetStreamManager({ info, add });
    const mockClient = createMockClient(jetstreamManager);
    vi.mocked(connect).mockResolvedValue(mockClient);

    const broker = new NatsBroker(options);
    await broker.init();

    expect(info).toHaveBeenCalledTimes(2);
    expect(info).toHaveBeenCalledWith("identity");
    expect(info).toHaveBeenCalledWith("platform");
    expect(add).toHaveBeenCalledTimes(2);
    expect(add).toHaveBeenCalledWith({
      name: "identity",
      subjects: ["identity.>"],
    });
    expect(add).toHaveBeenCalledWith({
      name: "platform",
      subjects: ["platform.>"],
    });
  });

  it("skips add when the stream already exists", async () => {
    const options: IBrokerOptions = {
      servers: ["localhost:4222"],
      streams: ["identity"],
    };
    const info = vi.fn().mockResolvedValue({ config: { name: "identity" } });
    const add = vi.fn();
    const jetstreamManager = createJetStreamManager({ info, add });
    const mockClient = createMockClient(jetstreamManager);
    vi.mocked(connect).mockResolvedValue(mockClient);

    const broker = new NatsBroker(options);
    await broker.init();

    expect(info).toHaveBeenCalledWith("identity");
    expect(add).not.toHaveBeenCalled();
  });

  it("treats concurrent stream-already-exists as success", async () => {
    const options: IBrokerOptions = {
      servers: ["localhost:4222"],
      streams: ["identity"],
    };
    const notFound = new NatsError("stream not found", "404");
    notFound.api_error = { code: 404, description: "stream not found" };
    const alreadyExists = new NatsError("stream name already in use", "400");
    alreadyExists.api_error = {
      code: 400,
      description: "stream name already in use",
      err_code: 10058,
    };

    const info = vi.fn().mockRejectedValue(notFound);
    const add = vi.fn().mockRejectedValue(alreadyExists);
    const jetstreamManager = createJetStreamManager({ info, add });
    const mockClient = createMockClient(jetstreamManager);
    vi.mocked(connect).mockResolvedValue(mockClient);

    const broker = new NatsBroker(options);
    await expect(broker.init()).resolves.toBeUndefined();
    expect(add).toHaveBeenCalledTimes(1);
  });
});
