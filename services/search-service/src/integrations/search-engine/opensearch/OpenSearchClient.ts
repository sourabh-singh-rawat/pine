import { Client } from "@opensearch-project/opensearch";

export type OpenSearchClientOptions = {
  node: string;
};

export class OpenSearchClient {
  readonly client: Client;

  constructor(options: OpenSearchClientOptions) {
    this.client = new Client({ node: options.node });
  }

  async ping(): Promise<boolean> {
    try {
      const response = await this.client.ping();
      return response.statusCode === 200;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
