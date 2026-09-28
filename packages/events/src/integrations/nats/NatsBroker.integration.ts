import { NatsBroker } from "./NatsBroker";

describe("Nats Broker Integration Test", () => {
  const broker = new NatsBroker({
    servers: ["localhost:14222"],
  });

  it("connects to a nats cluster", async () => {
    await broker.init();
  });
});
