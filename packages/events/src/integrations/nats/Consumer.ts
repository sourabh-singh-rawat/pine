import {
  AckPolicy,
  DeliverPolicy,
  type JetStreamClient,
  JSONCodec,
  type JsMsg,
  NatsError,
  type NatsConnection,
  ReplayPolicy,
} from "nats";
import { Streams } from "../../constants";

export abstract class Consumer<T> {
  private readonly jetstream: JetStreamClient;
  abstract readonly stream: Streams;
  abstract readonly consumer: string;
  abstract readonly subjects: string[];

  constructor(client: NatsConnection) {
    this.jetstream = client.jetstream();
  }

  start = async (): Promise<void> => {
    await this.ensureConsumer();
    await this.consume();
  };

  consume = async (): Promise<void> => {
    const consumer = await this.jetstream.consumers.get(this.stream, this.consumer);
    const messages = await consumer.consume({ max_messages: 5 });

    const codec = JSONCodec<T>();

    for await (const message of messages) {
      try {
        await this.onMessage(message, codec.decode(message.data));
      } catch {
        message.nak();
      }
    }
  };

  abstract onMessage(messagae: JsMsg, payload: T): Promise<void>;

  private ensureConsumer = async (): Promise<void> => {
    const manager = await this.jetstream.jetstreamManager();

    try {
      const info = await manager.consumers.info(this.stream, this.consumer);

      if (this.sameSubjects(info.config.filter_subjects ?? [], this.subjects)) return;
      await manager.consumers.update(this.stream, this.consumer, {
        filter_subjects: this.subjects,
      });
    } catch (error) {
      if (!(error instanceof NatsError) || error.api_error?.code !== 404) {
        throw error;
      }

      await manager.consumers.add(this.stream, {
        name: this.consumer,
        durable_name: this.consumer,
        deliver_policy: DeliverPolicy.All,
        filter_subjects: this.subjects,
        max_deliver: 100,
        ack_wait: 30 * 1000 * 1000 * 1000,
        ack_policy: AckPolicy.Explicit,
        replay_policy: ReplayPolicy.Instant,
      });
    }
  };

  private sameSubjects(a: string[], b: string[]) {
    return a.length === b.length && a.every((subject) => b.includes(subject));
  }
}
