import { SECRET_APPS, policyNameForApp, type SecretApp } from "@pine/security";

import { formatOpenBaoError, parseTokenCreateClientToken, requestOpenBao } from "./client.ts";

const policyHclForApp = (app: SecretApp): string => `path "secret/data/pine/dev/${app}" {
  capabilities = ["read"]
}

path "secret/metadata/pine/dev/${app}" {
  capabilities = ["read"]
}
`;

const upsertAppPolicy = async (rootToken: string, app: SecretApp): Promise<void> => {
  const policyName = policyNameForApp(app);
  const res = await requestOpenBao(
    "PUT",
    `/v1/sys/policies/acl/${policyName}`,
    { policy: policyHclForApp(app) },
    rootToken,
  );
  if (res.status !== 200 && res.status !== 204) {
    throw new Error(`Failed to upsert policy ${policyName}: ${formatOpenBaoError(res)}`);
  }
};

const createAppToken = async (rootToken: string, app: SecretApp): Promise<string> => {
  const policyName = policyNameForApp(app);
  const res = await requestOpenBao(
    "POST",
    "/v1/auth/token/create",
    {
      policies: [policyName],
      display_name: policyName,
      renewable: true,
      ttl: "720h",
      period: "720h",
    },
    rootToken,
  );
  const clientToken = parseTokenCreateClientToken(res.data);
  if (res.status !== 200 || !clientToken) {
    throw new Error(`Failed to create token for ${app}: ${formatOpenBaoError(res)}`);
  }
  return clientToken;
};

export const ensureAppPoliciesAndTokens = async (
  rootToken: string,
): Promise<Record<string, string>> => {
  console.log("openbao: creating per-app policies and tokens");
  const appTokens: Record<string, string> = {};
  for (const app of SECRET_APPS) {
    await upsertAppPolicy(rootToken, app);
    appTokens[app] = await createAppToken(rootToken, app);
    console.log(`openbao: issued token for ${app}`);
  }
  return appTokens;
};
