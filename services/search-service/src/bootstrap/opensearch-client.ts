import { env } from "@/bootstrap/env";
import { OpenSearchClient } from "@/integrations/search-engine/opensearch";

export const openSearchClient = new OpenSearchClient({
  node: env.OPENSEARCH_URL,
});
