import { describe, expect, it } from "vitest";
import { rewriteOpenIdConfiguration } from "@/integrations/oauth/ory-hydra/rewriteOpenIdConfiguration";

describe("rewriteOpenIdConfiguration", () => {
  const oauthPublicUrl = "https://localhost/api/oauth";

  it("rewrites issuer and public endpoints to OAUTH_PUBLIC_URL", () => {
    const rewritten = rewriteOpenIdConfiguration(
      {
        issuer: "http://127.0.0.1:4444",
        authorization_endpoint: "http://127.0.0.1:4444/oauth2/auth",
        token_endpoint: "http://127.0.0.1:4444/oauth2/token",
        jwks_uri: "http://127.0.0.1:4444/.well-known/jwks.json",
        userinfo_endpoint: "http://127.0.0.1:4444/userinfo",
        revocation_endpoint: "http://127.0.0.1:4444/oauth2/revoke",
        end_session_endpoint: "http://127.0.0.1:4444/oauth2/sessions/logout",
        device_authorization_endpoint: "http://127.0.0.1:4444/oauth2/device/auth",
        scopes_supported: ["openid", "offline"],
        response_types_supported: ["code"],
        id_token_signing_alg_values_supported: ["RS256"],
      },
      oauthPublicUrl,
    );

    expect(rewritten).toEqual({
      issuer: "https://localhost/api/oauth",
      authorization_endpoint: "https://localhost/api/oauth/authorize",
      token_endpoint: "https://localhost/api/oauth/token",
      jwks_uri: "https://localhost/api/oauth/.well-known/jwks.json",
      introspection_endpoint: "https://localhost/api/oauth/introspect",
      scopes_supported: ["openid", "offline"],
      response_types_supported: ["code"],
      id_token_signing_alg_values_supported: ["RS256"],
    });
  });

  it("trims a trailing slash from OAUTH_PUBLIC_URL", () => {
    const rewritten = rewriteOpenIdConfiguration({}, "https://localhost/api/oauth/");

    expect(rewritten.issuer).toBe("https://localhost/api/oauth");
    expect(rewritten.authorization_endpoint).toBe("https://localhost/api/oauth/authorize");
  });
});
