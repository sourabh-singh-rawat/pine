import type { SecretApp } from "./apps";

export interface SecretOptions {
  app: SecretApp;
  openbaoUrl?: string;
  caCertPath?: string;
  secretPath?: string;
}

export type Secrets = Record<string, string>;

export type SecretRequest = {
  openbaoUrl: string;
  secretPath: string;
  token: string;
  caPath: string | null;
};
