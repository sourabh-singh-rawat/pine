import Type from "typebox";
import Value from "typebox/value";

export const EnvSchema = Type.Object({
  NODE_ENV: Type.String({ default: "development" }),
  DATA_GATEWAY_URL: Type.String({ default: "https://localhost:4001" }),
  DATA_GATEWAY_TLS_KEY_PATH: Type.String({ minLength: 1 }),
  DATA_GATEWAY_TLS_CERT_PATH: Type.String({ minLength: 1 }),
  CA_CERT_PATH: Type.String({ minLength: 1 }),
  ATTACHMENT_SERVICE_URL: Type.String({ default: "https://127.0.0.1:5003" }),
  ATTACHMENT_UPLOAD_MAX_BYTES: Type.Number({ default: 52_428_800 }),
  IDENTITY_WEB_URL: Type.String({ default: "https://localhost:3000" }),
  PINE_WEB_URL: Type.String({ default: "https://localhost:3001" }),
  VITE_PLATFORM_WEB_URL: Type.String({ default: "https://localhost:3002" }),
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
  const converted = Value.Convert(EnvSchema, cleaned);
  return Value.Parse(EnvSchema, converted);
};

export const env = parseEnv();
