import { describe, expect, it } from "vitest";
import { rewriteHydraPublicUrl } from "@/integrations/oauth/ory-hydra/rewriteHydraPublicUrl";

describe("rewriteHydraPublicUrl", () => {
  const hydraPublicUrl = "http://127.0.0.1:4444";
  const oauthPublicUrl = "https://localhost/api/oauth";

  it("rewrites Hydra authorize URLs to the public oauth authorize path", () => {
    const rewritten = rewriteHydraPublicUrl(
      "http://127.0.0.1:4444/oauth2/auth?login_verifier=abc&client_id=pine-web",
      hydraPublicUrl,
      oauthPublicUrl,
    );

    expect(rewritten).toBe(
      "https://localhost/api/oauth/authorize?login_verifier=abc&client_id=pine-web",
    );
  });

  it("leaves non-Hydra redirect URLs unchanged", () => {
    const clientRedirect = "https://localhost:3001/callback?code=xyz&state=1";
    expect(rewriteHydraPublicUrl(clientRedirect, hydraPublicUrl, oauthPublicUrl)).toBe(
      clientRedirect,
    );
  });

  it("leaves Hydra URLs for other paths unchanged", () => {
    const tokenUrl = "http://127.0.0.1:4444/oauth2/token";
    expect(rewriteHydraPublicUrl(tokenUrl, hydraPublicUrl, oauthPublicUrl)).toBe(tokenUrl);
  });

  it("returns the original value when the URL cannot be parsed", () => {
    expect(rewriteHydraPublicUrl("not-a-url", hydraPublicUrl, oauthPublicUrl)).toBe("not-a-url");
  });
});
