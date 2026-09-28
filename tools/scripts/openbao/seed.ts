import crypto from "node:crypto";

import { SECRET_APPS, getSecretAppDefinition, type SecretApp } from "@pine/security";

import { appSecretApiPath, parseKvSecretData, requestOpenBao } from "./client.ts";

const generatePassword = (length = 32): string => crypto.randomBytes(length).toString("base64url");

const isUsableSecret = (value: string | undefined): value is string =>
  value !== undefined && value.trim() !== "" && !value.startsWith("replace_");

const resolveSecretValue = (
  existingValue: string | undefined,
  envValue: string | undefined,
  defaultValue?: string,
): string => {
  if (isUsableSecret(existingValue)) {
    return existingValue;
  }
  if (isUsableSecret(envValue)) {
    return envValue;
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  return generatePassword();
};

const readExistingAppSecrets = async (
  token: string,
  app: SecretApp,
): Promise<Record<string, string>> => {
  try {
    const res = await requestOpenBao("GET", appSecretApiPath(app), undefined, token);
    if (res.status !== 200) {
      return {};
    }
    return parseKvSecretData(res.data);
  } catch {
    return {};
  }
};

const seedAppSecrets = async (token: string, app: SecretApp): Promise<void> => {
  const { binding, envBindings } = getSecretAppDefinition(app);
  const existing = await readExistingAppSecrets(token, app);
  const payload: Record<string, string> = {
    [binding.secretKey]: resolveSecretValue(
      existing[binding.secretKey],
      process.env[binding.passwordEnv],
    ),
  };

  if (envBindings) {
    for (const envBinding of envBindings) {
      payload[envBinding.secretKey] = resolveSecretValue(
        existing[envBinding.secretKey],
        process.env[envBinding.env],
        envBinding.defaultValue,
      );
    }
  }

  const putRes = await requestOpenBao("POST", appSecretApiPath(app), { data: payload }, token);
  if (putRes.status !== 200 && putRes.status !== 204) {
    throw new Error(`Failed to seed secrets for ${app}: ${putRes.status}`);
  }
};

export const seedDevSecrets = async (token: string): Promise<void> => {
  console.log("openbao: seeding secret/pine/dev/<app>");
  for (const app of SECRET_APPS) {
    await seedAppSecrets(token, app);
    console.log(`openbao: seeded secret/pine/dev/${app}`);
  }
};
