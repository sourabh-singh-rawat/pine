import fs from "node:fs";
import path from "node:path";

import { secretPathForApp, type SecretApp } from "./apps";
import { isRecord } from "./parse";
import type { SecretOptions, SecretRequest } from "./types";

const findRootPath = (startDir: string): string => {
  let current = startDir;
  while (current !== path.dirname(current)) {
    if (fs.existsSync(path.join(current, "pnpm-workspace.yaml"))) {
      return current;
    }
    current = path.dirname(current);
  }
  return process.cwd();
};

const resolveCaCertPath = (explicitPath?: string): string | null => {
  if (explicitPath && fs.existsSync(explicitPath)) {
    return explicitPath;
  }
  if (process.env.CA_CERT_PATH && fs.existsSync(process.env.CA_CERT_PATH)) {
    return process.env.CA_CERT_PATH;
  }
  const defaultLocalCa = path.join(findRootPath(process.cwd()), ".local", "tls", "ca", "ca.crt");
  if (fs.existsSync(defaultLocalCa)) {
    return defaultLocalCa;
  }
  return null;
};

const parseAppToken = (raw: string, app: SecretApp): string | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed) || !isRecord(parsed.app_tokens)) {
    return null;
  }
  const tokenValue = parsed.app_tokens[app];
  if (typeof tokenValue !== "string") {
    return null;
  }
  const token = tokenValue.trim();
  return token === "" ? null : token;
};

export const readAppToken = (app: SecretApp): string | null => {
  const credentialsPath = path.join(
    findRootPath(process.cwd()),
    ".local",
    "openbao",
    "credentials.json",
  );
  if (!fs.existsSync(credentialsPath)) {
    return null;
  }
  try {
    return parseAppToken(fs.readFileSync(credentialsPath, "utf8"), app);
  } catch {
    return null;
  }
};

export const resolveSecretRequest = (options: SecretOptions): SecretRequest | null => {
  const token = readAppToken(options.app);
  if (!token) {
    return null;
  }
  return {
    openbaoUrl: options.openbaoUrl || process.env.OPENBAO_URL || "https://localhost:8200",
    secretPath: options.secretPath || secretPathForApp(options.app),
    token,
    caPath: resolveCaCertPath(options.caCertPath),
  };
};
