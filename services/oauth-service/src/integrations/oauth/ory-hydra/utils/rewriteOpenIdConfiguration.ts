import type { OpenIdConfiguration } from "@/integrations/oauth/IOAuthDiscoveryProvider";

const trimTrailingSlash = (value: string): string => value.replace(/\/$/, "");

const PUBLIC_ENDPOINT_PATHS = {
  authorization_endpoint: "/authorize",
  token_endpoint: "/token",
  jwks_uri: "/.well-known/jwks.json",
  introspection_endpoint: "/introspect",
} as const;

const STRIP_KEYS = new Set([
  "userinfo_endpoint",
  "revocation_endpoint",
  "end_session_endpoint",
  "device_authorization_endpoint",
  "credentials_endpoint_draft_00",
  "credentials_supported_draft_00",
]);

export const rewriteOpenIdConfiguration = (
  document: Record<string, unknown>,
  oauthPublicUrl: string,
): OpenIdConfiguration => {
  const publicBase = trimTrailingSlash(oauthPublicUrl);
  const rewritten: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(document)) {
    if (STRIP_KEYS.has(key)) {
      continue;
    }
    rewritten[key] = value;
  }

  return {
    ...rewritten,
    issuer: publicBase,
    authorization_endpoint: `${publicBase}${PUBLIC_ENDPOINT_PATHS.authorization_endpoint}`,
    token_endpoint: `${publicBase}${PUBLIC_ENDPOINT_PATHS.token_endpoint}`,
    jwks_uri: `${publicBase}${PUBLIC_ENDPOINT_PATHS.jwks_uri}`,
    introspection_endpoint: `${publicBase}${PUBLIC_ENDPOINT_PATHS.introspection_endpoint}`,
  };
};
