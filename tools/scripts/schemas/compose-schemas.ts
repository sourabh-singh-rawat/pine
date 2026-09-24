/**
 * Compose platform GraphQL supergraph + OpenAPI from microservice artifacts.
 *
 * Microservices write their local schemas on boot:
 *   services/<name>/dist/schema.graphql
 *   services/<name>/dist/openapi.json
 *
 * This script joins those into:
 *   services/api-gateway/dist/supergraph.graphql
 *   services/api-gateway/dist/platform.openapi.json
 *
 * Usage:
 *   pnpm schemas:compose              # both, once
 *   pnpm schemas:compose --graphql    # GraphQL only
 *   pnpm schemas:compose --openapi    # OpenAPI only
 *   pnpm schemas:watch                # both, then re-compose on change
 *
 * Inputs are read from tools/apollo/supergraph.yaml and tools/redocly/redocly.yaml
 * so adding a new subgraph/API there is enough — no hard-coded service list.
 */
import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  watch,
  writeFileSync,
  type FSWatcher,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../../..");
const require = createRequire(import.meta.url);

/** Resolve a package bin entry to an absolute JS path (no shell / .cmd shims). */
function resolvePackageBin(pkg: string, binName: string): string {
  const pkgJsonPath = require.resolve(`${pkg}/package.json`);
  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf8")) as {
    bin?: string | Record<string, string>;
  };
  const binField = pkgJson.bin;
  const rel =
    typeof binField === "string"
      ? binField
      : (binField?.[binName] ?? binField?.[Object.keys(binField ?? {})[0] ?? ""]);
  if (!rel) {
    throw new Error(`Package ${pkg} has no bin entry for ${binName}`);
  }
  return path.resolve(path.dirname(pkgJsonPath), rel);
}

const ROVER_BIN = resolvePackageBin("@apollo/rover", "rover");
const REDOCLY_BIN = resolvePackageBin("@redocly/cli", "redocly");

const SUPERGRAPH_CONFIG = path.join(root, "tools/apollo/supergraph.yaml");
const REDOCLY_CONFIG = path.join(root, "tools/redocly/redocly.yaml");
const OUT_DIR = path.join(root, "services/api-gateway/dist");
const SUPERGRAPH_OUT = path.join(OUT_DIR, "supergraph.graphql");
const OPENAPI_OUT = path.join(OUT_DIR, "platform.openapi.json");

const DEBOUNCE_MS = 400;

type Mode = {
  graphql: boolean;
  openapi: boolean;
  watch: boolean;
};

function parseArgs(argv: string[]): Mode {
  const hasGraphql = argv.includes("--graphql");
  const hasOpenapi = argv.includes("--openapi");
  const both = !hasGraphql && !hasOpenapi;
  return {
    graphql: both || hasGraphql,
    openapi: both || hasOpenapi,
    watch: argv.includes("--watch"),
  };
}

function log(msg: string): void {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[compose-schemas ${ts}] ${msg}`);
}

function warn(msg: string): void {
  const ts = new Date().toISOString().slice(11, 19);
  console.warn(`[compose-schemas ${ts}] ${msg}`);
}

function resolveFromConfig(configPath: string, relativePath: string): string {
  return path.resolve(path.dirname(configPath), relativePath);
}

/** Collect `file:` / `root:` paths from Apollo Rover / Redocly YAML configs. */
function collectInputPaths(configPath: string, keys: string[]): string[] {
  if (!existsSync(configPath)) {
    warn(`Config not found: ${configPath}`);
    return [];
  }

  const text = readFileSync(configPath, "utf8");
  const keyAlt = keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const re = new RegExp(`(?:${keyAlt})\\s*:\\s*(\\S+)`, "g");
  const paths: string[] = [];

  for (const match of text.matchAll(re)) {
    const rel = match[1]?.trim();
    if (!rel || rel.startsWith("#")) continue;
    paths.push(resolveFromConfig(configPath, rel));
  }

  return paths;
}

function graphqlInputs(): string[] {
  return collectInputPaths(SUPERGRAPH_CONFIG, ["file"]);
}

function openapiInputs(): string[] {
  return collectInputPaths(REDOCLY_CONFIG, ["root"]);
}

function missing(paths: string[]): string[] {
  return paths.filter((p) => !existsSync(p) || readFileSync(p, "utf8").trim().length === 0);
}

function atomicWrite(target: string, content: string): void {
  mkdirSync(path.dirname(target), { recursive: true });
  const tmp = `${target}.${process.pid}.tmp`;
  writeFileSync(tmp, content, "utf8");
  try {
    renameSync(tmp, target);
  } catch {
    // Windows cannot rename over an existing file.
    if (existsSync(target)) unlinkSync(target);
    renameSync(tmp, target);
  }
}

function runNodeCli(
  cliEntry: string,
  args: string[],
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliEntry, ...args], {
      cwd: root,
      env: process.env,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk: Buffer | string) => {
      stdout += String(chunk);
    });
    child.stderr?.on("data", (chunk: Buffer | string) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

async function composeGraphql(): Promise<boolean> {
  const inputs = graphqlInputs();
  const absent = missing(inputs);
  if (absent.length > 0) {
    warn(
      `Skipping GraphQL compose — missing or empty subgraph schemas:\n${absent
        .map((p) => `  - ${path.relative(root, p)}`)
        .join("\n")}`,
    );
    return false;
  }

  log("Composing GraphQL supergraph…");
  const { code, stdout, stderr } = await runNodeCli(ROVER_BIN, [
    "supergraph",
    "compose",
    "--elv2-license",
    "accept",
    "--config",
    "tools/apollo/supergraph.yaml",
  ]);

  if (stderr.trim()) {
    // Rover logs progress to stderr even on success.
    process.stderr.write(stderr.endsWith("\n") ? stderr : `${stderr}\n`);
  }

  if (code !== 0) {
    warn(`rover supergraph compose failed (exit ${code})`);
    return false;
  }

  const sdl = stdout.trim();
  if (!sdl) {
    warn("rover produced empty supergraph SDL — not writing output");
    return false;
  }

  atomicWrite(SUPERGRAPH_OUT, `${sdl}\n`);
  log(`Wrote ${path.relative(root, SUPERGRAPH_OUT)} (${sdl.length} chars)`);
  return true;
}

async function composeOpenapi(): Promise<boolean> {
  const inputs = openapiInputs();
  const absent = missing(inputs);
  if (absent.length > 0) {
    warn(
      `Skipping OpenAPI compose — missing or empty specs:\n${absent
        .map((p) => `  - ${path.relative(root, p)}`)
        .join("\n")}`,
    );
    return false;
  }

  log("Composing OpenAPI…");
  mkdirSync(OUT_DIR, { recursive: true });
  const tmpOut = path.join(OUT_DIR, `platform.openapi.${process.pid}.tmp.json`);

  const { code, stdout, stderr } = await runNodeCli(REDOCLY_BIN, [
    "join",
    "--config",
    "tools/redocly/redocly.yaml",
    "--prefix-tags-with-info-prop",
    "title",
    "-o",
    tmpOut,
  ]);

  if (stdout.trim()) process.stdout.write(stdout.endsWith("\n") ? stdout : `${stdout}\n`);
  if (stderr.trim()) process.stderr.write(stderr.endsWith("\n") ? stderr : `${stderr}\n`);

  if (code !== 0) {
    warn(`redocly join failed (exit ${code})`);
    if (existsSync(tmpOut)) unlinkSync(tmpOut);
    return false;
  }

  if (!existsSync(tmpOut)) {
    warn("redocly did not produce an output file");
    return false;
  }

  const content = readFileSync(tmpOut, "utf8").trim();
  if (!content) {
    warn("redocly produced empty OpenAPI — not writing output");
    unlinkSync(tmpOut);
    return false;
  }

  try {
    renameSync(tmpOut, OPENAPI_OUT);
  } catch {
    if (existsSync(OPENAPI_OUT)) unlinkSync(OPENAPI_OUT);
    renameSync(tmpOut, OPENAPI_OUT);
  }

  log(`Wrote ${path.relative(root, OPENAPI_OUT)} (${content.length} chars)`);
  return true;
}

async function composeOnce(mode: Mode): Promise<void> {
  const results: boolean[] = [];
  if (mode.graphql) results.push(await composeGraphql());
  if (mode.openapi) results.push(await composeOpenapi());

  if (results.length > 0 && results.every((ok) => !ok)) {
    process.exitCode = 1;
  }
}

function uniqueDirs(files: string[]): string[] {
  return [...new Set(files.map((f) => path.dirname(f)))];
}

function startWatchers(mode: Mode): void {
  const watchedFiles = new Set<string>();
  if (mode.graphql) for (const f of graphqlInputs()) watchedFiles.add(path.normalize(f));
  if (mode.openapi) for (const f of openapiInputs()) watchedFiles.add(path.normalize(f));

  // Also re-compose if the compose configs themselves change.
  const configFiles = [SUPERGRAPH_CONFIG, REDOCLY_CONFIG].map((p) => path.normalize(p));
  for (const c of configFiles) watchedFiles.add(c);

  const dirs = uniqueDirs([...watchedFiles]);
  const watchers: FSWatcher[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let queued = false;

  const schedule = (reason: string) => {
    log(`Change detected (${reason}) — debouncing ${DEBOUNCE_MS}ms`);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      void (async () => {
        if (running) {
          queued = true;
          return;
        }
        running = true;
        try {
          await composeOnce(mode);
        } finally {
          running = false;
          if (queued) {
            queued = false;
            schedule("queued");
          }
        }
      })();
    }, DEBOUNCE_MS);
  };

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      log(`Created watch dir ${path.relative(root, dir)} (waiting for schema artifacts)`);
    }

    try {
      const watcher = watch(dir, { persistent: true }, (_event, filename) => {
        if (!filename) {
          schedule(path.relative(root, dir));
          return;
        }
        const full = path.normalize(path.join(dir, filename.toString()));
        // Re-compose when a watched artifact or any sibling schema file changes.
        const base = path.basename(full);
        if (
          watchedFiles.has(full) ||
          base === "schema.graphql" ||
          base === "openapi.json" ||
          base.endsWith(".yaml") ||
          base.endsWith(".yml")
        ) {
          schedule(path.relative(root, full));
        }
      });
      watchers.push(watcher);
      log(`Watching ${path.relative(root, dir)}`);
    } catch (err) {
      warn(`Failed to watch ${dir}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Config files may live outside service dist folders.
  for (const file of configFiles) {
    const dir = path.dirname(file);
    if (dirs.includes(dir)) continue;
    if (!existsSync(dir)) continue;
    try {
      const watcher = watch(dir, { persistent: true }, (_event, filename) => {
        if (!filename) return;
        const full = path.normalize(path.join(dir, filename.toString()));
        if (watchedFiles.has(full)) schedule(path.relative(root, full));
      });
      watchers.push(watcher);
      log(`Watching config dir ${path.relative(root, dir)}`);
    } catch {
      /* ignore */
    }
  }

  const shutdown = () => {
    if (timer) clearTimeout(timer);
    for (const w of watchers) w.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  log(
    "Watch mode active. Writes api-gateway dist artifacts; the gateway reloads the supergraph on change.",
  );
}

async function main(): Promise<void> {
  const mode = parseArgs(process.argv.slice(2));

  log(
    `Mode: ${[
      mode.graphql ? "graphql" : null,
      mode.openapi ? "openapi" : null,
      mode.watch ? "watch" : "once",
    ]
      .filter(Boolean)
      .join(" + ")}`,
  );

  await composeOnce(mode);

  if (mode.watch) {
    process.exitCode = 0;
    startWatchers(mode);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
