import {
  ApolloGateway,
  GraphQLDataSourceProcessOptions,
  RemoteGraphQLDataSource,
} from "@apollo/gateway";
import makeFetchHappen from "make-fetch-happen";
import { readFileSync, watch } from "node:fs";
import path from "node:path";
import { env } from "./env";
import "./tls";

export type GatewayContext = {
  identityId?: string;
  authMethod?: string;
  tenantId?: string;
  organizationId?: string;
};

class SubgraphDataSource extends RemoteGraphQLDataSource<GatewayContext> {
  willSendRequest = (options: GraphQLDataSourceProcessOptions<GatewayContext>) => {
    const identityId = options.context?.identityId;
    if (identityId) {
      options.request.http?.headers.set("x-identity-id", identityId);
    }

    const authMethod = options.context?.authMethod;
    if (authMethod) {
      options.request.http?.headers.set("x-identity-auth-method", authMethod);
    }

    const tenantId = options.context?.tenantId;
    if (tenantId) {
      options.request.http?.headers.set("x-tenant-id", tenantId);
    }

    const organizationId = options.context?.organizationId;
    if (organizationId) {
      options.request.http?.headers.set("x-organization-id", organizationId);
    }
  };
}

const supergraphPath = path.join(process.cwd(), "dist", "supergraph.graphql");

const readSupergraphSdl = (): string => {
  const sdl = readFileSync(supergraphPath, "utf8").trim();
  if (!sdl) {
    throw new Error(
      `Empty supergraph at ${supergraphPath}. Run \`pnpm schemas:compose\` (or \`pnpm schemas:watch\`) after subgraph services have written dist/schema.graphql.`,
    );
  }
  return sdl;
};

const subgraphFetcher = makeFetchHappen.defaults({
  maxSockets: Infinity,
  retry: false,
  ca: readFileSync(env.CA_CERT_PATH),
  cert: readFileSync(env.API_GATEWAY_TLS_CERT_PATH),
  key: readFileSync(env.API_GATEWAY_TLS_KEY_PATH),
});

export const graphqlGateway = new ApolloGateway({
  async supergraphSdl({ update }) {
    const initialSdl = readSupergraphSdl();
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const watcher = watch(supergraphPath, () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        try {
          update(readSupergraphSdl());
          console.log(`[api-gateway] Reloaded supergraph from ${supergraphPath}`);
        } catch (err) {
          console.warn(
            `[api-gateway] Supergraph reload skipped: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }, 200);
    });

    return {
      supergraphSdl: initialSdl,
      cleanup: async () => {
        if (debounce) clearTimeout(debounce);
        watcher.close();
      },
    };
  },
  buildService: ({ url }) =>
    new SubgraphDataSource({
      url,
      fetcher: subgraphFetcher,
    }),
});
