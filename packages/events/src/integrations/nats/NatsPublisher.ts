import { JSONCodec } from "nats";
import type { CloudEvent } from "../../cloud-events";
import type { IBroker } from "./IBroker";
import type { IPublisher } from "./IPublisher";

export class NatsPublisher implements IPublisher {
  constructor(private readonly broker: IBroker) {}

  async send(event: CloudEvent): Promise<void> {
    if (!event.type) {
      throw new Error("CloudEvent type is required for publishing");
    }

    const codec = JSONCodec<CloudEvent>();
    const encodedMessage = codec.encode(event);

    const jetstream = this.broker.client.jetstream();
    await jetstream.publish(event.type, encodedMessage);
  }
}
