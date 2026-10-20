import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  readNamespaceCatalogs,
  readResourceNames,
  type PermissionCatalog,
} from "./namespace-catalog.ts";
import { readNamespaceRelations } from "./relation-catalog.ts";
import { renderRelations } from "./render-relations.ts";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const namespacesPath = path.join(
  root,
  "services/authorization-service/src/integrations/authorization/ory-keto/opl/namespaces.ts",
);
const resourcesPath = path.join(root, "packages/authorization/src/resources/AllResources.ts");
const outputPath = path.join(root, "packages/authorization/src/permissions/AllPermissions.ts");
const relationsOutputPath = path.join(
  root,
  "packages/authorization/src/relations/__generated__/generated.ts",
);

const CATALOGS_WITHOUT_PERMITS: readonly PermissionCatalog[] = [
  { namespace: "Role", permits: ["read", "create", "update", "delete"] },
  { namespace: "Permission", permits: ["read", "create", "update", "delete"] },
];

const main = (): void => {
  const check = process.argv.includes("--check");
  const namespacesSource = readFileSync(namespacesPath, "utf8");
  const formattedPermissions = formatSource(
    outputPath,
    renderAllPermissions(buildCatalogs(namespacesSource, readFileSync(resourcesPath, "utf8"))),
  );
  const formattedRelations = formatSource(
    relationsOutputPath,
    renderRelations(readNamespaceRelations(namespacesSource)),
  );
  const stale = [
    syncFile(outputPath, formattedPermissions, check) ? "AllPermissions.ts" : "",
    syncFile(relationsOutputPath, formattedRelations, check)
      ? "relations/__generated__/generated.ts"
      : "",
  ].filter((label) => label.length > 0);
  if (stale.length > 0) {
    const verb = stale.length === 1 ? "is" : "are";
    throw new Error(`${stale.join(" and ")} ${verb} out of date. Run pnpm permissions:generate`);
  }
};

const syncFile = (filePath: string, formatted: string, check: boolean): boolean => {
  const current = existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
  if (current === formatted) {
    return false;
  }
  if (check) {
    return true;
  }
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, formatted);
  return false;
};

const buildCatalogs = (
  namespacesSource: string,
  resourcesSource: string,
): readonly PermissionCatalog[] => {
  const catalogs = withFallbacks(readNamespaceCatalogs(namespacesSource));
  const known = new Set(readResourceNames(resourcesSource));
  for (const catalog of catalogs) {
    if (!known.has(catalog.namespace)) {
      throw new Error(`${catalog.namespace} is not listed in RESOURCES`);
    }
  }
  return catalogs;
};

const withFallbacks = (catalogs: readonly PermissionCatalog[]): PermissionCatalog[] => {
  const present = new Set(catalogs.map((catalog) => catalog.namespace));
  const merged = [...catalogs];
  for (const fallback of CATALOGS_WITHOUT_PERMITS) {
    if (!present.has(fallback.namespace)) {
      merged.push(fallback);
    }
  }
  return merged;
};

const renderAllPermissions = (catalogs: readonly PermissionCatalog[]): string => {
  const types = catalogs
    .map((catalog) => `export type ${typeName(catalog.namespace)} = ${union(catalog.permits)};`)
    .join("\n\n");
  const permissionUnion = catalogs
    .map((catalog) => `  | ${typeName(catalog.namespace)}`)
    .join("\n");
  const constants = catalogs.map((catalog) => renderConstant(catalog)).join("\n\n");
  const spreads = catalogs
    .map((catalog) => `  ...catalog("${catalog.namespace}", ${constantName(catalog.namespace)}),`)
    .join("\n");

  return `import type { Resource } from "../resources";

${types}

export type Permission =
${permissionUnion};

${constants}

const catalog = (
  namespace: Resource,
  permissions: readonly string[],
): readonly { namespace: Resource; permission: string }[] =>
  permissions.map((permission) => ({ namespace, permission }));

export const ALL_PERMISSIONS = [
${spreads}
];
`;
};

const typeName = (namespace: string): string =>
  namespace === "Permission" ? "PermissionGrantPermission" : `${namespace}Permission`;

const constantName = (namespace: string): string =>
  namespace === "Permission"
    ? "PERMISSION_GRANT_PERMISSIONS"
    : `${namespace.replaceAll(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase()}_PERMISSIONS`;

const union = (permits: readonly string[]): string =>
  permits.map((permit) => JSON.stringify(permit)).join(" | ");

const renderConstant = (catalog: PermissionCatalog): string => {
  const values = catalog.permits.map((permit) => JSON.stringify(permit)).join(", ");
  return `export const ${constantName(catalog.namespace)}: readonly ${typeName(catalog.namespace)}[] = [${values}];`;
};

const formatSource = (fileName: string, source: string): string => {
  const tempPath = path.join(
    formatDirectory(fileName),
    `${path.basename(fileName, ".ts")}.generate.ts`,
  );
  writeFileSync(tempPath, source);
  try {
    const result = spawnSync(process.execPath, [resolvePackageBin("oxfmt", "oxfmt"), tempPath], {
      cwd: root,
      encoding: "utf8",
    });
    if (result.status !== 0) {
      throw new Error(result.stderr || result.stdout || "oxfmt failed");
    }
    return readFileSync(tempPath, "utf8");
  } finally {
    if (existsSync(tempPath)) {
      rmSync(tempPath);
    }
  }
};

const formatDirectory = (fileName: string): string => {
  const directory = path.dirname(fileName);
  const marker = `${path.sep}__generated__`;
  const markerIndex = directory.lastIndexOf(marker);
  if (markerIndex === -1) {
    return directory;
  }
  return directory.slice(0, markerIndex);
};

const resolvePackageBin = (pkg: string, binName: string): string => {
  const pkgJsonPath = require.resolve(`${pkg}/package.json`);
  const pkgJson: unknown = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
  if (!isRecord(pkgJson)) {
    throw new Error(`Package ${pkg} has an invalid package.json`);
  }
  const binField = pkgJson.bin;
  const relative =
    typeof binField === "string" ? binField : isRecord(binField) ? binField[binName] : undefined;
  if (typeof relative !== "string") {
    throw new Error(`Package ${pkg} has no bin entry for ${binName}`);
  }
  return path.resolve(path.dirname(pkgJsonPath), relative);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const invokedDirectly = (): boolean => {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  return import.meta.url === pathToFileURL(entry).href;
};

if (invokedDirectly()) {
  try {
    main();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "permission generation failed";
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}
