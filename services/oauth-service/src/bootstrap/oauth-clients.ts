import { env } from "@/bootstrap/env";
import type { RegisterOAuthClientInput } from "@/integrations/oauth";

export type OAuthClientSeedConfig = RegisterOAuthClientInput;

export const oauthClients: OAuthClientSeedConfig[] = [
  {
    clientId: "pine-web",
    name: "Pine",
    redirectUris: [`${env.PINE_WEB_URL}/callback`],
    grantTypes: ["authorization_code", "refresh_token"],
    scopes: ["openid", "offline", "email"],
    tokenEndpointAuthMethod: "none",
  },
  {
    clientId: "platform-web",
    name: "Platform Web",
    redirectUris: [`${env.VITE_PLATFORM_WEB_URL}/callback`],
    grantTypes: ["authorization_code", "refresh_token"],
    scopes: ["openid", "offline", "email"],
    tokenEndpointAuthMethod: "none",
  },
];
