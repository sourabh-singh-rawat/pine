import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
export const caCertPath = path.join(rootDir, ".local", "tls", "ca", "ca.crt");
export const credentialsDir = path.join(rootDir, ".local", "openbao");
export const credentialsPath = path.join(credentialsDir, "credentials.json");
export const openbaoBaseUrl = "https://localhost:8200";
export const kvMountPath = "secret";
export const devSecretsBasePath = "pine/dev";

export const appSecretApiPath = (app: string): string =>
  `/v1/secret/data/${devSecretsBasePath}/${app}`;

export interface OpenBaoCredentials {
  unseal_keys_b64: string[];
  root_token: string;
  app_tokens?: Record<string, string>;
}

export interface SealStatus {
  initialized: boolean;
  sealed: boolean;
}

export interface InitResult {
  keys_base64: string[];
  root_token: string;
}

export interface HttpResult {
  status: number;
  data: unknown;
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseJson = (raw: string): unknown => {
  if (raw.trim() === "") {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export const parseSealStatus = (value: unknown): SealStatus | null => {
  if (!isRecord(value)) {
    return null;
  }
  if (typeof value.initialized !== "boolean" || typeof value.sealed !== "boolean") {
    return null;
  }
  return { initialized: value.initialized, sealed: value.sealed };
};

export const parseInitResult = (value: unknown): InitResult | null => {
  if (!isRecord(value)) {
    return null;
  }
  const { keys_base64: keys, root_token: rootToken } = value;
  if (!Array.isArray(keys) || keys.length === 0 || !keys.every((key) => typeof key === "string")) {
    return null;
  }
  if (typeof rootToken !== "string" || rootToken.trim() === "") {
    return null;
  }
  return { keys_base64: keys, root_token: rootToken };
};

const parseAppTokens = (value: unknown): Record<string, string> | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (!isRecord(value)) {
    return undefined;
  }
  const tokens: Record<string, string> = {};
  for (const [app, token] of Object.entries(value)) {
    if (typeof token === "string" && token.trim() !== "") {
      tokens[app] = token;
    }
  }
  return tokens;
};

export const parseCredentials = (raw: string): OpenBaoCredentials | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) {
    return null;
  }
  const keys = parsed.unseal_keys_b64;
  const rootToken = parsed.root_token;
  if (!Array.isArray(keys) || keys.length === 0 || !keys.every((key) => typeof key === "string")) {
    return null;
  }
  if (typeof rootToken !== "string" || rootToken.trim() === "") {
    return null;
  }
  const appTokens = parseAppTokens(parsed.app_tokens);
  return {
    unseal_keys_b64: keys,
    root_token: rootToken,
    ...(appTokens ? { app_tokens: appTokens } : {}),
  };
};

export const parseTokenCreateClientToken = (value: unknown): string | null => {
  if (!isRecord(value) || !isRecord(value.auth)) {
    return null;
  }
  const clientToken = value.auth.client_token;
  if (typeof clientToken !== "string" || clientToken.trim() === "") {
    return null;
  }
  return clientToken;
};

export const parseSealedFlag = (value: unknown): boolean | null => {
  if (!isRecord(value) || typeof value.sealed !== "boolean") {
    return null;
  }
  return value.sealed;
};

export const parseStringMap = (value: unknown): Record<string, string> => {
  if (!isRecord(value)) {
    return {};
  }
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") {
      result[key] = entry;
    }
  }
  return result;
};

export const parseKvSecretData = (value: unknown): Record<string, string> => {
  if (!isRecord(value) || !isRecord(value.data) || !isRecord(value.data.data)) {
    return {};
  }
  return parseStringMap(value.data.data);
};

export const hasSecretMount = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }
  if (isRecord(value.data) && isRecord(value.data["secret/"])) {
    return true;
  }
  return isRecord(value["secret/"]);
};

const createHttpsAgent = (): https.Agent => {
  if (!fs.existsSync(caCertPath)) {
    throw new Error(
      `CA certificate not found at ${caCertPath}. Run "pnpm run tls:generate" first.`,
    );
  }
  return new https.Agent({
    ca: fs.readFileSync(caCertPath),
    rejectUnauthorized: true,
  });
};

export const requestOpenBao = async (
  method: string,
  apiPath: string,
  body?: unknown,
  token?: string,
): Promise<HttpResult> => {
  const agent = createHttpsAgent();
  const payload = body === undefined ? undefined : JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const req = https.request(
      `${openbaoBaseUrl}${apiPath}`,
      {
        method,
        agent,
        servername: "openbao",
        headers: {
          ...(payload ? { "Content-Type": "application/json" } : {}),
          ...(token ? { "X-Vault-Token": token } : {}),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk: Buffer) => {
          raw += chunk.toString("utf8");
        });
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 500,
            data: parseJson(raw),
          });
        });
      },
    );

    req.on("error", (err) => reject(err));
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
};

export const formatOpenBaoError = (res: HttpResult): string => {
  if (isRecord(res.data) && Array.isArray(res.data.errors)) {
    const errors = res.data.errors.filter((entry): entry is string => typeof entry === "string");
    if (errors.length > 0) {
      return `HTTP ${res.status}: ${errors.join("; ")}`;
    }
  }
  return `HTTP ${res.status}: ${JSON.stringify(res.data)}`;
};

export const waitForOpenBao = async (): Promise<SealStatus> => {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const res = await requestOpenBao("GET", "/v1/sys/seal-status");
      if (res.status === 200 || res.status === 503) {
        const status = parseSealStatus(res.data);
        if (status) {
          return status;
        }
      }
    } catch {}
    await sleep(1000);
  }
  throw new Error(`Timed out waiting for OpenBao at ${openbaoBaseUrl}`);
};

export const waitForActiveNode = async (): Promise<void> => {
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    try {
      const res = await requestOpenBao("GET", "/v1/sys/health");
      if (res.status === 200) {
        return;
      }
    } catch {}
    await sleep(250);
  }
  throw new Error("Timed out waiting for OpenBao Raft leader (active node)");
};
