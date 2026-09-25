import { ENVIRONMENT } from "@pine/common";
import Type from "typebox";
import Value from "typebox/value";

export const EnvSchema = Type.Object({
  NODE_ENV: Type.Union(
    [
      Type.Literal(ENVIRONMENT.DEVELOPMENT),
      Type.Literal(ENVIRONMENT.PRODUCTION),
      Type.Literal(ENVIRONMENT.TEST),
    ],
    { default: ENVIRONMENT.DEVELOPMENT },
  ),
  ATTACHMENT_SCANNER_SERVICE_TLS_KEY_PATH: Type.String({ minLength: 1 }),
  ATTACHMENT_SCANNER_SERVICE_TLS_CERT_PATH: Type.String({ minLength: 1 }),
  CA_CERT_PATH: Type.String({ minLength: 1 }),
  ATTACHMENT_SCANNER_DATABASE_URL: Type.String({ minLength: 1 }),
  ATTACHMENT_SERVICE_URL: Type.String({ default: "https://127.0.0.1:5003" }),
  NATS_URL: Type.String({ default: "nats://localhost:4222" }),
  CLAMAV_HOST: Type.String({ default: "localhost" }),
  CLAMAV_PORT: Type.Number({ default: 3310 }),
});

export type Env = Type.Static<typeof EnvSchema>;

const parseEnv = (): Env => {
  const withDefaults = Value.Default(EnvSchema, {
    ATTACHMENT_SCANNER_DATABASE_URL:
      process.env.ATTACHMENT_SCANNER_DATABASE_URL ?? process.env.ATTACHMENT_DATABASE_URL,
    ...process.env,
  });
  const cleaned = Value.Clean(EnvSchema, withDefaults);
  return Value.Parse(EnvSchema, cleaned);
};

export const env = parseEnv();
