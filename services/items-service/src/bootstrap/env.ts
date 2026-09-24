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
  ITEMS_SERVICE_URL: Type.String({ default: "https://127.0.0.1:5001" }),
  ITEMS_SERVICE_TLS_KEY_PATH: Type.String({ minLength: 1 }),
  ITEMS_SERVICE_TLS_CERT_PATH: Type.String({ minLength: 1 }),
  CA_CERT_PATH: Type.String({ minLength: 1 }),
  ISSUES_DATABASE_URL: Type.String({ minLength: 1 }),
  AUTHORIZATION_SERVICE_URL: Type.String({ default: "https://127.0.0.1:5006" }),
  ATTACHMENT_SERVICE_URL: Type.String({ default: "https://127.0.0.1:5003" }),
  NATS_URL: Type.String({ default: "nats://localhost:4222" }),
  JWT_SECRET: Type.String({ minLength: 1 }),
  PINE_WEB_URL: Type.String({ default: "https://localhost:3001" }),
  IDENTITY_WEB_URL: Type.String({ default: "https://localhost:3000" }),
  VITE_PLATFORM_WEB_URL: Type.String({ default: "https://localhost:3002" }),
});

export type Env = Type.Static<typeof EnvSchema>;

const parseEnv = (): Env => {
  const withDefaults = Value.Default(EnvSchema, { ...process.env });
  const cleaned = Value.Clean(EnvSchema, withDefaults);
  return Value.Parse(EnvSchema, cleaned);
};

export const env = parseEnv();
