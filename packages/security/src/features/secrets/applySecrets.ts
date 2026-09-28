import { getSecretAppDefinition, type SecretApp } from "./apps";
import type { Secrets } from "./types";

const needsEnvFill = (value: string | undefined): boolean =>
  value === undefined || value.trim() === "" || value.startsWith("replace_");

export const applySecrets = (secrets: Secrets, app: SecretApp): Secrets => {
  const { binding, envBindings } = getSecretAppDefinition(app);

  const password = secrets[binding.secretKey];
  if (password && needsEnvFill(process.env[binding.passwordEnv])) {
    process.env[binding.passwordEnv] = password;
    process.env[binding.databaseUrlEnv] =
      `postgres://${binding.role}:${password}@localhost:5432/${binding.database}`;
  }

  if (envBindings) {
    for (const envBinding of envBindings) {
      const value = secrets[envBinding.secretKey];
      if (value && needsEnvFill(process.env[envBinding.env])) {
        process.env[envBinding.env] = value;
      }
    }
  }

  return secrets;
};
