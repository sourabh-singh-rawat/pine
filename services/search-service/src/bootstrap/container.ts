import { Container } from "inversify";
import { TYPES } from "@/bootstrap/container-types";
import { openSearchClient } from "@/bootstrap/opensearch-client";
import type { OpenSearchClient } from "@/integrations/search-engine/opensearch";

export const container = new Container({ defaultScope: "Singleton" });

container.bind<OpenSearchClient>(TYPES.OpenSearchClient).toConstantValue(openSearchClient);
