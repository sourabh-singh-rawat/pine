#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { k8sTlsServices } from "./k8s-tls-services.ts";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const tlsDir = path.join(rootDir, ".local", "tls");
const caCrtPath = path.join(tlsDir, "ca", "ca.crt");
const namespace = process.env.PINE_NAMESPACE ?? "pine";

const applyKubectlYaml = (createArgs: readonly string[]): void => {
  const isWindows = process.platform === "win32";
  const created = spawnSync("kubectl", [...createArgs], {
    cwd: rootDir,
    encoding: "utf8",
    shell: isWindows,
    windowsHide: true,
  });

  if (created.error) {
    throw created.error;
  }

  if (created.status !== 0) {
    console.error(created.stderr);
    process.exit(created.status ?? 1);
  }

  const applied = spawnSync("kubectl", ["apply", "-f", "-"], {
    cwd: rootDir,
    encoding: "utf8",
    shell: isWindows,
    windowsHide: true,
    input: created.stdout,
    stdio: ["pipe", "inherit", "inherit"],
  });

  if (applied.error) {
    throw applied.error;
  }

  if (applied.status !== 0) {
    process.exit(applied.status ?? 1);
  }
};

const main = (): void => {
  if (!fs.existsSync(caCrtPath)) {
    console.error(`Missing ${caCrtPath}. Run: pnpm tls:generate`);
    process.exit(1);
  }

  for (const service of k8sTlsServices) {
    const serviceDir = path.join(tlsDir, service.certDir);
    const crtPath = path.join(serviceDir, `${service.certDir}.crt`);
    const keyPath = path.join(serviceDir, `${service.certDir}.key`);

    if (!fs.existsSync(crtPath) || !fs.existsSync(keyPath)) {
      console.error(`Missing certs for ${service.certDir}. Run: pnpm tls:generate`);
      process.exit(1);
    }

    applyKubectlYaml([
      "create",
      "secret",
      "generic",
      service.secretName,
      "--namespace",
      namespace,
      `--from-file=tls.crt=${crtPath}`,
      `--from-file=tls.key=${keyPath}`,
      `--from-file=ca.crt=${caCrtPath}`,
      "--dry-run=client",
      "-o",
      "yaml",
    ]);
  }

  applyKubectlYaml([
    "create",
    "configmap",
    "pine-ca",
    "--namespace",
    namespace,
    `--from-file=ca.crt=${caCrtPath}`,
    "--dry-run=client",
    "-o",
    "yaml",
  ]);

  console.log(
    `Applied ${k8sTlsServices.length} TLS secrets and ConfigMap pine-ca in namespace ${namespace}.`,
  );
};

try {
  main();
} catch (error: unknown) {
  console.error(error);
  process.exit(1);
}
