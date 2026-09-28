import { spawnSync } from "node:child_process";

import { applySecrets } from "./applySecrets";
import { resolveSecretRequest } from "./credentials";
import { parseKvSecretPayload } from "./parse";
import { shouldLoadDevSecrets } from "./shouldLoadDevSecrets";
import type { SecretOptions, Secrets } from "./types";

export const loadSecretsSync = (options: SecretOptions): Secrets => {
  if (!shouldLoadDevSecrets()) {
    return {};
  }

  const request = resolveSecretRequest(options);
  if (!request) {
    return {};
  }

  try {
    const curlArgs = [
      "-s",
      "-H",
      `X-Vault-Token: ${request.token}`,
      ...(request.caPath ? ["--cacert", request.caPath] : ["-k"]),
      `${request.openbaoUrl}/v1/${request.secretPath}`,
    ];

    const result = spawnSync("curl", curlArgs, {
      encoding: "utf8",
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024,
    });

    if (result.status !== 0 || !result.stdout) {
      return {};
    }

    const secrets = parseKvSecretPayload(JSON.parse(result.stdout));
    if (Object.keys(secrets).length === 0) {
      return {};
    }
    return applySecrets(secrets, options.app);
  } catch {
    return {};
  }
};
