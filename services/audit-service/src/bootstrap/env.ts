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
  AUDIT_DATABASE_URL: Type.String({ default: "postgres://postgres:postgres@localhost:5432/audit" }),
  NATS_URL: Type.String({ default: "nats://localhost:4222" }),
});

export type Env = Type.Static<typeof EnvSchema>;

const parseEnv = (): Env => {
  const withDefaults = Value.Default(EnvSchema, {
    AUDIT_DATABASE_URL:
      process.env.AUDIT_DATABASE_URL ??
      process.env.PLATFORM_DATABASE_URL ??
      "postgres://postgres:postgres@localhost:5432/audit",
    ...process.env,
  });
  const cleaned = Value.Clean(EnvSchema, withDefaults);
  return Value.Parse(EnvSchema, cleaned);
};

export const env = parseEnv();
