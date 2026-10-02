import Type from "typebox";
import Value from "typebox/value";

export const EnvSchema = Type.Object({
  NODE_ENV: Type.String({ default: "development" }),
  API_GATEWAY_URL: Type.String({ default: "https://127.0.0.1:4000" }),
  API_GATEWAY_TLS_KEY_PATH: Type.String({ minLength: 1 }),
  API_GATEWAY_TLS_CERT_PATH: Type.String({ minLength: 1 }),
  CA_CERT_PATH: Type.String({ minLength: 1 }),
  IDENTITY_WEB_URL: Type.String({ default: "https://localhost:3000" }),
  PINE_WEB_URL: Type.String({ default: "https://localhost:3001" }),
  VITE_PLATFORM_WEB_URL: Type.String({ default: "https://localhost:3002" }),
  IDENTITY_SERVICE_URL: Type.String({ default: "https://127.0.0.1:5000" }),
  ATTACHMENT_SERVICE_URL: Type.String({ default: "https://127.0.0.1:5003" }),
  AUTHORIZATION_SERVICE_URL: Type.String({ default: "https://127.0.0.1:5006" }),
  OAUTH_SERVICE_URL: Type.String({ default: "https://127.0.0.1:5008" }),
  OTEL_EXPORTER_OTLP_ENDPOINT: Type.String({ default: "http://127.0.0.1:4317" }),
});

export type Env = Type.Static<typeof EnvSchema>;

export const listenPortFromUrl = (url: string): number => {
  const parsed = new URL(url);
  if (parsed.port) return Number.parseInt(parsed.port, 10);
  return parsed.protocol === "https:" ? 443 : 80;
};

const parseEnv = (): Env => {
  const withDefaults = Value.Default(EnvSchema, { ...process.env });
  const cleaned = Value.Clean(EnvSchema, withDefaults);
  return Value.Parse(EnvSchema, cleaned);
};

export const env = parseEnv();
