import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { OAuthProviderUnavailableError } from "@/integrations/oauth/errors";
import { HydraOAuthDiscoveryProvider } from "@/integrations/oauth/ory-hydra/HydraOAuthDiscoveryProvider";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

const axiosGet = vi.mocked(axios.get);

const createHydraClient = (
  publicUrl = "http://127.0.0.1:4444",
): { readonly publicUrl: string } => ({
  publicUrl,
});

describe("HydraOAuthDiscoveryProvider", () => {
  beforeEach(() => {
    axiosGet.mockReset();
  });

  it("fetches Hydra discovery and rewrites public endpoints", async () => {
    axiosGet.mockResolvedValue({
      data: {
        issuer: "http://127.0.0.1:4444",
        authorization_endpoint: "http://127.0.0.1:4444/oauth2/auth",
        token_endpoint: "http://127.0.0.1:4444/oauth2/token",
        jwks_uri: "http://127.0.0.1:4444/.well-known/jwks.json",
        userinfo_endpoint: "http://127.0.0.1:4444/userinfo",
        scopes_supported: ["openid", "offline"],
      },
    });

    const provider = new HydraOAuthDiscoveryProvider(createHydraClient());
    const configuration = await provider.getOpenIdConfiguration();

    expect(axiosGet).toHaveBeenCalledWith(
      "http://127.0.0.1:4444/.well-known/openid-configuration",
      expect.objectContaining({
        validateStatus: expect.any(Function),
      }),
    );
    expect(configuration.issuer).toBe("https://localhost/api/oauth");
    expect(configuration.authorization_endpoint).toBe("https://localhost/api/oauth/authorize");
    expect(configuration.token_endpoint).toBe("https://localhost/api/oauth/token");
    expect(configuration.jwks_uri).toBe("https://localhost/api/oauth/.well-known/jwks.json");
    expect(configuration.introspection_endpoint).toBe("https://localhost/api/oauth/introspect");
    expect(configuration.userinfo_endpoint).toBeUndefined();
    expect(configuration.scopes_supported).toEqual(["openid", "offline"]);
  });

  it("proxies JWKS from Hydra unchanged", async () => {
    const jwks = {
      keys: [{ kty: "RSA", kid: "key-1", alg: "RS256", use: "sig" }],
    };
    axiosGet.mockResolvedValue({ data: jwks });

    const provider = new HydraOAuthDiscoveryProvider(createHydraClient());

    await expect(provider.getJwks()).resolves.toEqual(jwks);
    expect(axiosGet).toHaveBeenCalledWith(
      "http://127.0.0.1:4444/.well-known/jwks.json",
      expect.objectContaining({
        validateStatus: expect.any(Function),
      }),
    );
  });

  it("maps Hydra failures to OAuthProviderUnavailableError", async () => {
    axiosGet.mockRejectedValue({ response: { status: 503 } });

    const provider = new HydraOAuthDiscoveryProvider(createHydraClient());

    await expect(provider.getOpenIdConfiguration()).rejects.toBeInstanceOf(
      OAuthProviderUnavailableError,
    );
  });
});
