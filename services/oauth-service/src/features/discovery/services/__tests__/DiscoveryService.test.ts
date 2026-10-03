import { describe, expect, it, vi } from "vitest";
import { DiscoveryService } from "@/features/discovery/services/DiscoveryService";
import type { IOAuthDiscoveryProvider } from "@/integrations/oauth/IOAuthDiscoveryProvider";

const createDiscoveryProvider = (
  overrides: Partial<IOAuthDiscoveryProvider> = {},
): IOAuthDiscoveryProvider => ({
  getOpenIdConfiguration: vi.fn(),
  getJwks: vi.fn(),
  ...overrides,
});

describe("DiscoveryService", () => {
  it("returns OpenID configuration from the discovery provider", async () => {
    const configuration = {
      issuer: "https://localhost/api/oauth",
      authorization_endpoint: "https://localhost/api/oauth/authorize",
      token_endpoint: "https://localhost/api/oauth/token",
      jwks_uri: "https://localhost/api/oauth/.well-known/jwks.json",
      introspection_endpoint: "https://localhost/api/oauth/introspect",
    };
    const provider = createDiscoveryProvider({
      getOpenIdConfiguration: vi.fn().mockResolvedValue(configuration),
    });
    const service = new DiscoveryService(provider);

    await expect(service.getOpenIdConfiguration()).resolves.toEqual(configuration);
    expect(provider.getOpenIdConfiguration).toHaveBeenCalledTimes(1);
  });

  it("returns JWKS from the discovery provider", async () => {
    const jwks = { keys: [{ kty: "RSA", kid: "key-1" }] };
    const provider = createDiscoveryProvider({
      getJwks: vi.fn().mockResolvedValue(jwks),
    });
    const service = new DiscoveryService(provider);

    await expect(service.getJwks()).resolves.toEqual(jwks);
    expect(provider.getJwks).toHaveBeenCalledTimes(1);
  });
});
