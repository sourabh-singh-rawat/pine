import { ENVIRONMENT } from "@pine/common";
import { loadSecretsSync } from "@pine/security";
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
  ATTACHMENT_SERVICE_URL: Type.String({ default: "https://127.0.0.1:5003" }),
  ATTACHMENT_SERVICE_TLS_KEY_PATH: Type.String({ minLength: 1 }),
  ATTACHMENT_SERVICE_TLS_CERT_PATH: Type.String({ minLength: 1 }),
  CA_CERT_PATH: Type.String({ minLength: 1 }),
  DATA_GATEWAY_URL: Type.String({ default: "https://localhost:4001" }),
  ATTACHMENT_DATABASE_URL: Type.String({ minLength: 1 }),
  NATS_URL: Type.String({ default: "nats://localhost:4222" }),
  PINE_WEB_URL: Type.String({ default: "https://localhost:3001" }),
  IDENTITY_WEB_URL: Type.String({ default: "https://localhost:3000" }),
  VITE_PLATFORM_WEB_URL: Type.String({ default: "https://localhost:3002" }),
  S3_ENDPOINT: Type.String({ default: "http://127.0.0.1:8333" }),
  S3_REGION: Type.String({ default: "us-east-1" }),
  S3_BUCKET: Type.String({ default: "attachments" }),
  S3_ACCESS_KEY: Type.String({ default: "seaweed" }),
  S3_SECRET_KEY: Type.String({ default: "seaweed" }),
  ATTACHMENT_UPLOAD_MAX_BYTES: Type.Number({ default: 52_428_800 }),
});

export type Env = Type.Static<typeof EnvSchema>;

const parseEnv = (): Env => {
  loadSecretsSync({ app: "attachment" });
  const withDefaults = Value.Default(EnvSchema, { ...process.env });
  const cleaned = Value.Clean(EnvSchema, withDefaults);
  const converted = Value.Convert(EnvSchema, cleaned);
  return Value.Parse(EnvSchema, converted);
};

export const env = parseEnv();
