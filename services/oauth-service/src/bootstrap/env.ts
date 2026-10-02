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
  OAUTH_SERVICE_URL: Type.String({ default: "https://127.0.0.1:5008" }),
  OAUTH_SERVICE_TLS_KEY_PATH: Type.String({ minLength: 1 }),
  OAUTH_SERVICE_TLS_CERT_PATH: Type.String({ minLength: 1 }),
  CA_CERT_PATH: Type.String({ minLength: 1 }),
  PINE_WEB_URL: Type.String({ default: "https://localhost:3001" }),
  VITE_PLATFORM_WEB_URL: Type.String({ default: "https://localhost:3002" }),
  HYDRA_PUBLIC_URL: Type.String({ default: "http://127.0.0.1:4444" }),
  HYDRA_ADMIN_URL: Type.String({ default: "http://127.0.0.1:4445" }),
  OAUTH_PUBLIC_URL: Type.String({ default: "https://localhost/api/oauth" }),
  OTEL_EXPORTER_OTLP_ENDPOINT: Type.String({ default: "http://127.0.0.1:4317" }),
});

export type Env = Type.Static<typeof EnvSchema>;

const parseEnv = (): Env => {
  const withDefaults = Value.Default(EnvSchema, { ...process.env });
  const cleaned = Value.Clean(EnvSchema, withDefaults);
  return Value.Parse(EnvSchema, cleaned);
};

export const env = parseEnv();
