#!/usr/bin/env node

import fs from "node:fs";

import {
  credentialsDir,
  credentialsPath,
  formatOpenBaoError,
  hasSecretMount,
  kvMountPath,
  parseCredentials,
  parseInitResult,
  parseSealedFlag,
  requestOpenBao,
  waitForActiveNode,
  waitForOpenBao,
  type OpenBaoCredentials,
} from "./client.ts";
import { ensureAppPoliciesAndTokens } from "./app-tokens.ts";
import { seedDevSecrets } from "./seed.ts";

const loadCredentials = (): OpenBaoCredentials | null => {
  if (!fs.existsSync(credentialsPath)) {
    return null;
  }
  return parseCredentials(fs.readFileSync(credentialsPath, "utf8"));
};

const saveCredentials = (creds: OpenBaoCredentials): void => {
  fs.mkdirSync(credentialsDir, { recursive: true });
  fs.writeFileSync(credentialsPath, JSON.stringify(creds, null, 2), "utf8");
};

const initializeCluster = async (): Promise<OpenBaoCredentials> => {
  console.log("openbao: initializing cluster with 1 key share");
  const initRes = await requestOpenBao("POST", "/v1/sys/init", {
    secret_shares: 1,
    secret_threshold: 1,
  });
  const init = parseInitResult(initRes.data);
  if (initRes.status !== 200 || !init) {
    throw new Error(`Failed to initialize OpenBao: ${JSON.stringify(initRes.data)}`);
  }

  const creds: OpenBaoCredentials = {
    unseal_keys_b64: init.keys_base64,
    root_token: init.root_token,
  };
  saveCredentials(creds);
  console.log("openbao: credentials saved to .local/openbao/credentials.json");
  return creds;
};

const unsealCluster = async (creds: OpenBaoCredentials): Promise<void> => {
  const unsealKey = creds.unseal_keys_b64[0];
  if (!unsealKey) {
    throw new Error("Missing unseal key in .local/openbao/credentials.json");
  }

  console.log("openbao: unsealing cluster");
  const unsealRes = await requestOpenBao("POST", "/v1/sys/unseal", { key: unsealKey });
  const sealed = parseSealedFlag(unsealRes.data);
  if (sealed !== false) {
    throw new Error("Failed to unseal OpenBao. Key may be invalid.");
  }
  console.log("openbao: cluster unsealed");
};

const ensureInitializedAndUnsealed = async (): Promise<OpenBaoCredentials> => {
  let status = await waitForOpenBao();
  let creds = loadCredentials();

  if (!status.initialized) {
    creds = await initializeCluster();
    status = await waitForOpenBao();
  }

  if (!creds?.unseal_keys_b64[0] || !creds.root_token) {
    throw new Error(
      "OpenBao is initialized but credentials not found in .local/openbao/credentials.json. Restore keys or wipe infra/data/openbao-data and re-bootstrap.",
    );
  }

  if (status.sealed) {
    await unsealCluster(creds);
  } else {
    console.log("openbao: cluster already unsealed");
  }

  console.log("openbao: waiting for active Raft leader");
  await waitForActiveNode();

  return creds;
};

const ensureKvEngine = async (token: string): Promise<void> => {
  const mountsRes = await requestOpenBao("GET", "/v1/sys/mounts", undefined, token);
  if (hasSecretMount(mountsRes.data)) {
    console.log(`openbao: KV v2 already mounted at ${kvMountPath}/`);
    return;
  }

  console.log(`openbao: enabling KV v2 at ${kvMountPath}/`);
  const enableRes = await requestOpenBao(
    "POST",
    `/v1/sys/mounts/${kvMountPath}`,
    { type: "kv", options: { version: "2" } },
    token,
  );
  if (enableRes.status !== 200 && enableRes.status !== 204) {
    throw new Error(
      `Failed to enable KV engine at ${kvMountPath}/: ${formatOpenBaoError(enableRes)}`,
    );
  }
};

const main = async (): Promise<void> => {
  const creds = await ensureInitializedAndUnsealed();
  await ensureKvEngine(creds.root_token);
  await seedDevSecrets(creds.root_token);
  const appTokens = await ensureAppPoliciesAndTokens(creds.root_token);
  saveCredentials({
    unseal_keys_b64: creds.unseal_keys_b64,
    root_token: creds.root_token,
    app_tokens: appTokens,
  });
  console.log("openbao: app tokens saved to .local/openbao/credentials.json");
  console.log("openbao: bootstrap completed");
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
