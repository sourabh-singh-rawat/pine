import type { Secrets } from "./types";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const parseSecrets = (value: unknown): Secrets => {
  if (!isRecord(value)) {
    return {};
  }
  const secrets: Secrets = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") {
      secrets[key] = entry;
    }
  }
  return secrets;
};

export const parseKvSecretPayload = (value: unknown): Secrets => {
  if (!isRecord(value) || !isRecord(value.data) || !isRecord(value.data.data)) {
    return {};
  }
  return parseSecrets(value.data.data);
};
