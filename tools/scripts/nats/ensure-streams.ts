import { connect, NatsError, type JetStreamManager } from "nats";

const STREAM_NAME_ALREADY_IN_USE = 10058;

const STREAMS = ["attachment", "authorization", "identity", "items", "platform"] as const;

const ensureStream = async (jetstreamManager: JetStreamManager, stream: string) => {
  try {
    await jetstreamManager.streams.info(stream);
    console.log(`ok  ${stream} (exists)`);
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
    console.log(`add ${stream}`);
  } catch (error) {
    if (!(error instanceof NatsError) || error.api_error?.err_code !== STREAM_NAME_ALREADY_IN_USE) {
      throw error;
    }
    console.log(`ok  ${stream} (race)`);
  }
};

const main = async () => {
  const servers = process.env.NATS_URL ?? "nats://127.0.0.1:4222";
  const client = await connect({ servers });
  const jetstreamManager = await client.jetstreamManager();

  for (const stream of STREAMS) {
    await ensureStream(jetstreamManager, stream);
  }

  await client.close();
};

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
