import { NatsConnection, NatsError, connect } from "nats";
import type { IBroker } from "./IBroker";
import type { IBrokerOptions } from "./IBrokerOptions";

const STREAM_NAME_ALREADY_IN_USE = 10058;

export class NatsBroker implements IBroker {
  public client!: NatsConnection;

  constructor(private readonly options: IBrokerOptions) {}

  getConfig() {
    return this.options;
  }

  async init() {
    const client = await connect({ servers: this.options.servers });
    this.client = client;
    await this.createStreams(this.options.streams);

    this.options.logger?.info(
      `✅ [Nats Jetstream] connected at ${client.info?.host}:${client.info?.port}`,
    );
  }

  private async createStreams(streams: IBrokerOptions["streams"] = []) {
    if (streams.length === 0) {
      return;
    }

    const jetstreamManager = await this.client.jetstreamManager();
    await Promise.all(streams.map((stream) => this.ensureStream(jetstreamManager, stream)));
  }

  private async ensureStream(
    jetstreamManager: Awaited<ReturnType<NatsConnection["jetstreamManager"]>>,
    stream: string,
  ) {
    try {
      await jetstreamManager.streams.info(stream);
      return;
    } catch (error) {
      if (!(error instanceof NatsError) || error.api_error?.code !== 404) {
        throw error;
      }
    }

    try {
      await jetstreamManager.streams.add({
        name: stream,
        subjects: [`${stream}.>`],
      });
    } catch (error) {
      if (
        !(error instanceof NatsError) ||
        error.api_error?.err_code !== STREAM_NAME_ALREADY_IN_USE
      ) {
        throw error;
      }
    }
  }
}
