#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { k8sTlsServices, localOnlyCertDirs } from "./k8s-tls-services.ts";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const tlsDir = path.join(rootDir, ".local", "tls");
const caDir = path.join(tlsDir, "ca");

const runOpenSsl = (args: readonly string[]): void => {
  const isWindows = process.platform === "win32";
  const result = spawnSync("openssl", [...args], {
    cwd: rootDir,
    encoding: "utf8",
    shell: isWindows,
    windowsHide: true,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const createOpenSslConfig = (
  serviceName: string,
  dnsNames: readonly string[],
  configPath: string,
): void => {
  const altNames = [
    ...dnsNames.map((name, index) => `DNS.${index + 1} = ${name}`),
    `DNS.${dnsNames.length + 1} = localhost`,
    `DNS.${dnsNames.length + 2} = *.localhost`,
    "IP.1 = 127.0.0.1",
  ].join("\n");

  const content = `[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = req_ext

[dn]
CN = ${serviceName}

[req_ext]
subjectAltName = @alt_names

[alt_names]
${altNames}
`;
  fs.writeFileSync(configPath, content, "utf8");
};

const issueServiceCert = (serviceName: string, dnsNames: readonly string[]): void => {
  const serviceDir = path.join(tlsDir, serviceName);
  fs.mkdirSync(serviceDir, { recursive: true });

  const keyPath = path.join(serviceDir, `${serviceName}.key`);
  const csrPath = path.join(serviceDir, `${serviceName}.csr`);
  const crtPath = path.join(serviceDir, `${serviceName}.crt`);
  const configPath = path.join(serviceDir, "openssl.cnf");
  const caKeyPath = path.join(caDir, "ca.key");
  const caCrtPath = path.join(caDir, "ca.crt");

  createOpenSslConfig(serviceName, dnsNames, configPath);

  runOpenSsl([
    "req",
    "-new",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-keyout",
    keyPath,
    "-out",
    csrPath,
    "-config",
    configPath,
  ]);

  runOpenSsl([
    "x509",
    "-req",
    "-in",
    csrPath,
    "-CA",
    caCrtPath,
    "-CAkey",
    caKeyPath,
    "-CAcreateserial",
    "-out",
    crtPath,
    "-days",
    "825",
    "-sha256",
    "-extfile",
    configPath,
    "-extensions",
    "req_ext",
  ]);

  if (fs.existsSync(csrPath)) {
    fs.unlinkSync(csrPath);
  }
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
};

const main = (): void => {
  fs.mkdirSync(caDir, { recursive: true });

  const caKeyPath = path.join(caDir, "ca.key");
  const caCrtPath = path.join(caDir, "ca.crt");

  if (!fs.existsSync(caKeyPath) || !fs.existsSync(caCrtPath)) {
    runOpenSsl([
      "req",
      "-x509",
      "-newkey",
      "rsa:4096",
      "-sha256",
      "-days",
      "3650",
      "-nodes",
      "-keyout",
      caKeyPath,
      "-out",
      caCrtPath,
      "-subj",
      "/CN=Pine-Development-CA/O=Pine",
    ]);
  }

  for (const service of k8sTlsServices) {
    issueServiceCert(service.certDir, service.dnsNames);
  }

  for (const serviceName of localOnlyCertDirs) {
    issueServiceCert(serviceName, [serviceName]);
  }

  const srlPath = path.join(caDir, "ca.srl");
  if (fs.existsSync(srlPath)) {
    fs.unlinkSync(srlPath);
  }
};

try {
  main();
} catch (error: unknown) {
  console.error(error);
  process.exit(1);
}
