import { connect, type NatsConnection } from "nats";
import type { IBroker } from "./IBroker";
import type { IBrokerOptions } from "./IBrokerOptions";

export class NatsBroker implements IBroker {
  public client!: NatsConnection;

  constructor(private readonly options: IBrokerOptions) {}

  getConfig() {
    return this.options;
  }

  async init() {
    const client = await connect({ servers: this.options.servers });
    this.client = client;

    this.options.logger?.info(
      `✅ [Nats Jetstream] connected at ${client.info?.host}:${client.info?.port}`,
    );
  }
}
