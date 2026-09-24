#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const isWindows = process.platform === "win32";
const infraDataDir = path.join(rootDir, "infra", "data");
const rmRfScript = path.join(rootDir, "tools", "scripts", "setup", "rm-rf.mjs");
const dockerComposeArgs: readonly string[] = [
  "--env-file",
  ".env",
  "-f",
  "infra/docker/compose.yaml",
  "-f",
  "infra/docker/compose.single-db.yaml",
  "-f",
  "infra/docker/compose.ory-db.yaml",
  "-f",
  "infra/docker/compose.kratos.yaml",
  "-f",
  "infra/docker/compose.hydra.yaml",
  "-f",
  "infra/docker/compose.keto.yaml",
  "-f",
  "infra/docker/storage.compose.yaml",
];
const postgresReadyTimeoutMs = 180_000;
const postgresReadyPollMs = 2_000;
const postgresReadyStableChecks = 3;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sleepSync = (ms: number): void => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

const run = (
  command: string,
  args: readonly string[],
  options: { captureStdout?: boolean; env?: NodeJS.ProcessEnv } = {},
): string => {
  const result = spawnSync(command, [...args], {
    cwd: rootDir,
    env: { ...process.env, ...options.env },
    encoding: "utf8",
    shell: isWindows,
    windowsHide: true,
    maxBuffer: 20 * 1024 * 1024,
    stdio: options.captureStdout ? ["ignore", "pipe", "inherit"] : "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return result.stdout ?? "";
};

const runPnpm = (
  args: readonly string[],
  options: { captureStdout?: boolean; env?: NodeJS.ProcessEnv } = {},
): string => run("pnpm", args, options);

const runPostgresCheck = (args: readonly string[]) =>
  spawnSync("docker", ["compose", ...dockerComposeArgs, "exec", "-T", "postgres", ...args], {
    cwd: rootDir,
    encoding: "utf8",
    shell: false,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

const isPostgresReady = (): boolean => {
  const ready = runPostgresCheck(["pg_isready", "-U", "postgres"]);
  if (ready.status !== 0) {
    return false;
  }

  const initDone = runPostgresCheck([
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-tAc",
    "SELECT 1 FROM pg_database WHERE datname = 'identity'",
  ]);
  return initDone.status === 0 && (initDone.stdout ?? "").trim() === "1";
};

const waitForPostgres = (): void => {
  console.log("setup: waiting for postgres to accept connections");
  const deadline = Date.now() + postgresReadyTimeoutMs;
  let stableCount = 0;

  while (Date.now() < deadline) {
    if (isPostgresReady()) {
      stableCount += 1;
      if (stableCount >= postgresReadyStableChecks) {
        console.log("setup: postgres is ready");
        return;
      }
    } else {
      stableCount = 0;
    }
    sleepSync(postgresReadyPollMs);
  }

  throw new Error(
    `Postgres was not ready within ${postgresReadyTimeoutMs / 1000}s (init may still be running).`,
  );
};

const parseIdentityId = (output: string): string => {
  const match = output.match(/^IDENTITY_ID=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s*$/im);
  const identityId = match?.[1]?.trim();
  if (!identityId || !UUID_PATTERN.test(identityId)) {
    throw new Error(
      "bootstrap-admin did not print IDENTITY_ID=<uuid>. Ensure identity-service CLI is up to date and BOOTSTRAP_ADMIN_* env vars are set.",
    );
  }
  return identityId;
};

const parseSetupMode = (): "restart" | "skip-docker" => {
  const flags = process.argv.slice(2).filter((arg) => arg.startsWith("-"));
  const skipDocker = flags.includes("--skip-docker");
  const restart = flags.includes("--restart");
  const unknown = flags.filter((flag) => flag !== "--skip-docker" && flag !== "--restart");

  if (unknown.length > 0) {
    throw new Error(`Unknown setup flag(s): ${unknown.join(", ")}. Use --restart or --skip-docker.`);
  }

  if (skipDocker && restart) {
    throw new Error("Use either --restart or --skip-docker, not both.");
  }

  if (skipDocker) {
    return "skip-docker";
  }

  return "restart";
};

const restartInfra = (): void => {
  console.log("setup: stopping infra");
  runPnpm(["dev:infra:down"]);

  console.log("setup: removing infra/data");
  run(process.execPath, [rmRfScript, infraDataDir]);

  console.log("setup: starting infra");
  runPnpm(["dev:infra"]);
};

const main = (): void => {
  const mode = parseSetupMode();

  if (mode === "restart") {
    restartInfra();
  } else {
    console.log("setup: skipping docker compose restart");
  }

  waitForPostgres();

  console.log("setup: running database migrations");
  runPnpm(["db:migrate"]);

  console.log("setup: seeding platform-service");
  runPnpm(["--filter", "@pine/platform-service", "db:seed"]);

  console.log("setup: bootstrapping admin identity");
  const bootstrapOutput = runPnpm(
    ["--filter", "@pine/identity-service", "cli:bootstrap-admin"],
    { captureStdout: true },
  );
  process.stdout.write(bootstrapOutput);

  const identityId = parseIdentityId(bootstrapOutput);
  console.log(`setup: admin identity id=${identityId}`);

  console.log("setup: granting platform admin role");
  runPnpm(["--filter", "@pine/platform-service", "cli:grant-platform-admin"], {
    env: { GRANT_PLATFORM_ADMIN_IDENTITY_ID: identityId },
  });

  console.log("setup: completed");
};

try {
  main();
} catch (error: unknown) {
  console.error(error);
  process.exit(1);
}
