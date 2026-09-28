export type SecretApp = "identity" | "items" | "attachment" | "platform" | "notification" | "audit";

export const SECRET_APPS: ReadonlyArray<SecretApp> = [
  "identity",
  "items",
  "attachment",
  "platform",
  "notification",
  "audit",
];

export type SecretAppBinding = {
  secretKey: string;
  passwordEnv: string;
  databaseUrlEnv: string;
  role: string;
  database: string;
};

export type SecretEnvBinding = {
  secretKey: string;
  env: string;
  defaultValue?: string;
};

export type SecretAppDefinition = {
  app: SecretApp;
  binding: SecretAppBinding;
  envBindings?: ReadonlyArray<SecretEnvBinding>;
};

export const secretAppDefinitions: ReadonlyArray<SecretAppDefinition> = [
  {
    app: "identity",
    binding: {
      secretKey: "postgres_identity_password",
      passwordEnv: "POSTGRES_IDENTITY_PASSWORD",
      databaseUrlEnv: "IDENTITY_DATABASE_URL",
      role: "identity",
      database: "identity",
    },
  },
  {
    app: "items",
    binding: {
      secretKey: "postgres_issues_password",
      passwordEnv: "POSTGRES_ISSUES_PASSWORD",
      databaseUrlEnv: "ISSUES_DATABASE_URL",
      role: "issues",
      database: "issues",
    },
  },
  {
    app: "attachment",
    binding: {
      secretKey: "postgres_attachment_password",
      passwordEnv: "POSTGRES_ATTACHMENT_PASSWORD",
      databaseUrlEnv: "ATTACHMENT_DATABASE_URL",
      role: "attachment",
      database: "attachment",
    },
    envBindings: [
      {
        secretKey: "s3_access_key",
        env: "S3_ACCESS_KEY",
        defaultValue: "seaweed",
      },
      {
        secretKey: "s3_secret_key",
        env: "S3_SECRET_KEY",
        defaultValue: "seaweed",
      },
    ],
  },
  {
    app: "platform",
    binding: {
      secretKey: "postgres_platform_password",
      passwordEnv: "POSTGRES_PLATFORM_PASSWORD",
      databaseUrlEnv: "PLATFORM_DATABASE_URL",
      role: "platform",
      database: "platform",
    },
  },
  {
    app: "notification",
    binding: {
      secretKey: "postgres_notification_password",
      passwordEnv: "POSTGRES_NOTIFICATION_PASSWORD",
      databaseUrlEnv: "NOTIFICATION_DATABASE_URL",
      role: "notification",
      database: "notification",
    },
  },
  {
    app: "audit",
    binding: {
      secretKey: "postgres_audit_password",
      passwordEnv: "POSTGRES_AUDIT_PASSWORD",
      databaseUrlEnv: "AUDIT_DATABASE_URL",
      role: "audit",
      database: "audit",
    },
  },
];

export const isSecretApp = (value: string): value is SecretApp => {
  switch (value) {
    case "identity":
    case "items":
    case "attachment":
    case "platform":
    case "notification":
    case "audit":
      return true;
    default:
      return false;
  }
};

export const getSecretAppDefinition = (app: SecretApp): SecretAppDefinition => {
  const definition = secretAppDefinitions.find((entry) => entry.app === app);
  if (!definition) {
    throw new Error(`Unknown secret app: ${app}`);
  }
  return definition;
};

export const secretPathForApp = (app: SecretApp): string => `secret/data/pine/dev/${app}`;

export const policyNameForApp = (app: SecretApp): string => `pine-dev-${app}`;
