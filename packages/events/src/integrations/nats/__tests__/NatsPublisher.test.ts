import { describe, expect, it, vi } from "vitest";
import { NatsPublisher } from "../NatsPublisher";
import type { NatsBroker } from "../NatsBroker";

describe("NatsPublisher", () => {
  it("publishes the CloudEvent on subject equal to event.type", async () => {
    const publish = vi.fn().mockResolvedValue(undefined);
    const broker = {
      client: {
        jetstream: () => ({ publish }),
      },
    } as unknown as NatsBroker;

    const publisher = new NatsPublisher(broker);
    const event = {
      id: "evt-1",
      source: "pine/test",
      specversion: "1.0" as const,
      type: "product.product.created",
      dataschema: "urn:pine:events:product.product.created:v1",
      data: { id: "p1" },
    };

    await publisher.send(event);

    expect(publish).toHaveBeenCalledTimes(1);
    const [subject, encoded] = publish.mock.calls[0];
    expect(subject).toBe("product.product.created");
    expect(encoded).toBeDefined();
  });

  it("throws when event.type is missing", async () => {
    const publisher = new NatsPublisher({
      client: { jetstream: () => ({ publish: vi.fn() }) },
    } as unknown as NatsBroker);

    await expect(
      publisher.send({
        id: "evt-1",
        source: "pine/test",
        specversion: "1.0",
        type: "",
        dataschema: "urn:pine:events:x:v1",
      }),
    ).rejects.toThrow("CloudEvent type is required for publishing");
  });
});
