#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  formatReleaseTag,
  parseReleaseBranch,
  parseReleaseVersionParts,
} from "../release/release-version.ts";
import {
  entriesDeletedAtCommit,
  entriesForCurrentDrop,
  git,
  listHistoricalReleases,
  packageVersionsFor,
} from "./entries.ts";
import {
  type ChangelogSection,
  diffPackageVersions,
  formatChangelogSection,
  mergeChangelog,
  mergeChangelogSections,
} from "./format.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const CHANGESET_DIR = join(ROOT, ".changeset");
const CHANGELOG_PATH = join(ROOT, "CHANGELOG.md");

type CliOptions = {
  readonly help: boolean;
  readonly dryRun: boolean;
  readonly tag: string | null;
  readonly backfill: boolean;
  readonly force: boolean;
};

export const main = async (argv: readonly string[] = process.argv.slice(2)): Promise<number> => {
  const parsed = parseArgs(argv);
  if ("error" in parsed) {
    console.error(parsed.error);
    printHelp();
    return 1;
  }
  if (parsed.help) {
    printHelp();
    return 0;
  }
  if (parsed.force && !parsed.backfill) {
    console.error("--force only applies with --backfill.");
    return 1;
  }

  let branch = "";
  try {
    branch = await git(["branch", "--show-current"], ROOT);
  } catch {
    console.error("Not inside a Git repository.");
    return 1;
  }

  const tag = resolveTagFromBranch(branch, parsed.tag);
  if (tag === null && !parsed.backfill) {
    console.error(
      "Could not resolve calendar tag. Run on release/YYYY.MM.DD.N, pass --tag vYYYY.MM.DD.N, or use --backfill.",
    );
    return 1;
  }

  const incoming = await collectSections({
    tag,
    backfill: parsed.backfill,
  });
  if (incoming.length === 0) {
    console.error("Nothing to write: no pending changesets and no recoverable history.");
    return 1;
  }

  if (parsed.dryRun) {
    console.log(incoming.map((item) => item.body.trim()).join("\n\n"));
    return 0;
  }

  const existing = existsSync(CHANGELOG_PATH) ? readFileSync(CHANGELOG_PATH, "utf8") : "";
  const next = writeMergedChangelog(existing, incoming, tag, parsed.force);
  writeFileSync(CHANGELOG_PATH, next.endsWith("\n") ? next : `${next}\n`, "utf8");
  console.log(`Wrote ${CHANGELOG_PATH} (${incoming.length} section(s)).`);
  return 0;
};

const printHelp = (): void => {
  console.log(`Usage: changelog:root [options]

Writes root CHANGELOG.md product sections grouped by highest
changeset bump (### Minor, ### Patch). Each entry is SHA: summary —
author (package names). Ends with ### Packages (name@version changed
vs previous release) for deployment. GitHub autolinks an 8-character SHA.

Current drop: run on release/YYYY.MM.DD.N AFTER \`changeset version\`
(\`pnpm changeset:version\` already does that). Package versions come
from the bumped package.json files. Consumed .changeset files are
recovered from HEAD (uncommitted deletions) or the last chore(release)
commit.

Past calendar drops that never got a root section: --backfill recovers
deleted .changeset files from chore(release) commits.

Options:
  --tag vYYYY.MM.DD.N   Heading for the current drop (default: release/* branch)
  --backfill            Add missing sections from git history
  --force               With --backfill, replace sections that already exist
  --dry-run             Print sections without writing CHANGELOG.md
  -h, --help            Show this help
`);
};

const parseArgs = (argv: readonly string[]): CliOptions | { error: string } => {
  let help = false;
  let dryRun = false;
  let backfill = false;
  let force = false;
  let tag: string | null = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) {
      continue;
    }
    if (arg === "-h" || arg === "--help") {
      help = true;
      continue;
    }
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--backfill") {
      backfill = true;
      continue;
    }
    if (arg === "--force") {
      force = true;
      continue;
    }
    if (arg === "--tag") {
      const value = argv[++i];
      if (value === undefined || value.startsWith("-")) {
        return { error: "--tag requires vYYYY.MM.DD.N" };
      }
      tag = value;
      continue;
    }
    if (arg.startsWith("--tag=")) {
      tag = arg.slice("--tag=".length);
      if (tag.length === 0) {
        return { error: "--tag requires vYYYY.MM.DD.N" };
      }
      continue;
    }
    if (arg.startsWith("-")) {
      return { error: `Unknown option: ${arg}` };
    }
    return { error: `Unexpected extra argument: ${arg}` };
  }

  return { help, dryRun, tag, backfill, force };
};

const resolveTagFromBranch = (branch: string, explicit: string | null): string | null => {
  if (explicit !== null) {
    const version = explicit.startsWith("v") ? explicit.slice(1) : explicit;
    const parts = parseReleaseVersionParts(version);
    return parts === null ? null : formatReleaseTag(parts);
  }
  const asBranch = parseReleaseBranch(branch);
  if (asBranch === null) {
    return null;
  }
  const parts = parseReleaseVersionParts(asBranch);
  return parts === null ? null : formatReleaseTag(parts);
};

const changedPackagesFor = async (currentCommit: string | null, previousCommit: string | null) => {
  const current = await packageVersionsFor(ROOT, currentCommit);
  const previous = previousCommit === null ? null : await packageVersionsFor(ROOT, previousCommit);
  return diffPackageVersions(current, previous);
};

const collectSections = async (input: {
  readonly tag: string | null;
  readonly backfill: boolean;
}): Promise<ChangelogSection[]> => {
  const incoming: ChangelogSection[] = [];
  const history = await listHistoricalReleases(ROOT);

  if (input.tag !== null) {
    const entries = await entriesForCurrentDrop(ROOT, CHANGESET_DIR);
    if (entries.length > 0 || !input.backfill) {
      const previous = history.find((drop) => drop.tag !== input.tag) ?? null;
      const matching = history.find((drop) => drop.tag === input.tag) ?? null;
      const changed = await changedPackagesFor(matching?.commit ?? null, previous?.commit ?? null);
      incoming.push({
        tag: input.tag,
        body: formatChangelogSection(input.tag, entries, changed),
      });
    }
  }

  if (!input.backfill) {
    return incoming;
  }

  console.log(`Found ${history.length} historical release commit(s).`);

  for (let i = 0; i < history.length; i++) {
    const drop = history[i];
    if (drop === undefined) {
      continue;
    }
    if (
      input.tag !== null &&
      drop.tag === input.tag &&
      incoming.some((item) => item.tag === input.tag)
    ) {
      continue;
    }
    const entries = await entriesDeletedAtCommit(ROOT, drop.commit);
    if (entries.length === 0) {
      console.log(`  skip ${drop.tag} (${drop.commit.slice(0, 9)}): no deleted changesets`);
      continue;
    }
    const previous = history[i + 1] ?? null;
    const changed = await changedPackagesFor(drop.commit, previous?.commit ?? null);
    incoming.push({
      tag: drop.tag,
      body: formatChangelogSection(drop.tag, entries, changed),
    });
    console.log(`  ${drop.tag}: ${entries.length} changeset(s) from ${drop.commit.slice(0, 9)}`);
  }

  return incoming;
};

const writeMergedChangelog = (
  existing: string,
  incoming: readonly ChangelogSection[],
  currentTag: string | null,
  replaceBackfill: boolean,
): string => {
  const current =
    currentTag === null ? undefined : incoming.find((item) => item.tag === currentTag);
  const rest = currentTag === null ? incoming : incoming.filter((item) => item.tag !== currentTag);

  let next = existing;
  if (current !== undefined) {
    next = mergeChangelog(next, current.tag, current.body);
  }
  return mergeChangelogSections(next, rest, replaceBackfill);
};

const isMainModule = (): boolean => {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  try {
    return import.meta.url === pathToFileURL(entry).href;
  } catch {
    return entry.replace(/\\/g, "/").endsWith("/tools/scripts/changelog/main.ts");
  }
};

if (isMainModule()) {
  void main().then((code) => {
    process.exitCode = code;
  });
}
