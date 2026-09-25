import { formatReleaseTag, parseReleaseVersionParts } from "../release/release-version.ts";

export type ChangesetBump = "major" | "minor" | "patch";

export type ParsedChangeset = {
  readonly fileName: string;
  readonly packages: Readonly<Record<string, ChangesetBump>>;
  readonly summary: string;
};

export type ChangelogEntry = {
  readonly changeset: ParsedChangeset;
  readonly authors: readonly string[];
  readonly hash: string | null;
  readonly versions: Readonly<Record<string, string>>;
};

export type ChangelogSection = {
  readonly tag: string;
  readonly body: string;
};

export type ChangedPackage = {
  readonly name: string;
  readonly version: string;
};

const SKIP_CHANGESET = new Set(["README.md", "config.json"]);

const CHANGELOG_TITLE = "# Changelog";

const RELEASE_SUBJECT_RE =
  /^(?:chore(?:\([^)]*\))?:\s*)(?:release\s+|publish\s+)?v?([0-9][0-9A-Za-z.+-]*)$/i;

const BUMP_ORDER: readonly ChangesetBump[] = ["major", "minor", "patch"];

const BUMP_HEADING: Readonly<Record<ChangesetBump, string>> = {
  major: "Major",
  minor: "Minor",
  patch: "Patch",
};

const isChangesetBump = (value: string): value is ChangesetBump =>
  value === "major" || value === "minor" || value === "patch";

export const isSkippedChangesetFile = (fileName: string): boolean => SKIP_CHANGESET.has(fileName);

export const isChangesetMarkdownPath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, "/");
  if (!normalized.endsWith(".md")) {
    return false;
  }
  const parts = normalized.split("/");
  const folder = parts[parts.length - 2];
  const file = parts[parts.length - 1] ?? "";
  return folder === ".changeset" && !SKIP_CHANGESET.has(file);
};

export const parseChangesetMarkdown = (fileName: string, raw: string): ParsedChangeset | null => {
  const trimmed = raw.replace(/^\uFEFF/, "");
  const match = trimmed.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (match === null) {
    return null;
  }

  const frontmatter = match[1] ?? "";
  const body = (match[2] ?? "").trim();
  const packages: Record<string, ChangesetBump> = {};

  for (const line of frontmatter.split(/\r?\n/)) {
    const pkgMatch = line.match(/^["']([^"']+)["']\s*:\s*(major|minor|patch)\s*$/);
    if (pkgMatch === null) {
      continue;
    }
    const name = pkgMatch[1];
    const bump = pkgMatch[2];
    if (name === undefined || bump === undefined || !isChangesetBump(bump)) {
      continue;
    }
    packages[name] = bump;
  }

  if (Object.keys(packages).length === 0 || body.length === 0) {
    return null;
  }

  const summary = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .join(" ")
    .replace(/\s+/g, " ");

  return { fileName, packages, summary };
};

export const shortCommitSha = (hash: string): string =>
  hash.length >= 8 ? hash.slice(0, 8) : hash;

export const bumpSemver = (version: string, bump: ChangesetBump): string => {
  const core = version.trim().split("-")[0] ?? version;
  const parts = core.split(".").map((part) => Number(part));
  if (parts.length < 3 || parts.some((n) => !Number.isInteger(n) || n < 0)) {
    return version;
  }

  const major = parts[0];
  const minor = parts[1];
  const patch = parts[2];
  if (major === undefined || minor === undefined || patch === undefined) {
    return version;
  }

  if (bump === "major") {
    return `${major + 1}.0.0`;
  }
  if (bump === "minor") {
    return `${major}.${minor + 1}.0`;
  }
  return `${major}.${minor}.${patch + 1}`;
};

export const versionsForChangeset = (
  packages: Readonly<Record<string, ChangesetBump>>,
  known: ReadonlyMap<string, string>,
  mode: "pending" | "released",
): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [name, bump] of Object.entries(packages)) {
    const current = known.get(name);
    if (current === undefined) {
      continue;
    }
    out[name] = mode === "pending" ? bumpSemver(current, bump) : current;
  }
  return out;
};

export const isCalendarReleaseTag = (tag: string): boolean => {
  const version = tag.startsWith("v") ? tag.slice(1) : tag;
  return parseReleaseVersionParts(version) !== null;
};

export const parseReleaseCommitSubject = (subject: string): string | null => {
  const match = RELEASE_SUBJECT_RE.exec(subject.trim());
  if (match === null) {
    return null;
  }
  const version = match[1];
  if (version === undefined) {
    return null;
  }
  const calendar = parseReleaseVersionParts(version);
  return calendar === null ? null : formatReleaseTag(calendar);
};

export const diffPackageVersions = (
  current: ReadonlyMap<string, string>,
  previous: ReadonlyMap<string, string> | null,
): ChangedPackage[] => {
  const out: ChangedPackage[] = [];
  for (const [name, version] of current) {
    if (previous === null || previous.get(name) !== version) {
      out.push({ name, version });
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
};

export const formatChangelogSection = (
  tag: string,
  entries: readonly ChangelogEntry[],
  changedPackages: readonly ChangedPackage[] = [],
): string => {
  const lines: string[] = [`## ${tag}`, ""];
  if (entries.length === 0) {
    lines.push("- (no pending changesets)", "");
  } else {
    const grouped = new Map<ChangesetBump, ChangelogEntry[]>();
    for (const entry of entries) {
      const bump = highestBump(entry.changeset.packages);
      const list = grouped.get(bump) ?? [];
      list.push(entry);
      grouped.set(bump, list);
    }

    for (const bump of BUMP_ORDER) {
      const group = grouped.get(bump);
      if (group === undefined || group.length === 0) {
        continue;
      }
      lines.push(`### ${BUMP_HEADING[bump]}`, "");
      for (const entry of group) {
        lines.push(formatChangelogEntry(entry));
      }
      lines.push("");
    }
  }

  if (changedPackages.length > 0) {
    lines.push("### Packages", "");
    for (const pkg of changedPackages) {
      lines.push(`- \`${pkg.name}@${pkg.version}\``);
    }
    lines.push("");
  }

  return lines.join("\n");
};

export const extractChangelogSection = (existing: string, tag: string): string | null => {
  const section = splitChangelog(existing).find((item) => item.tag === tag);
  if (section === undefined) {
    return null;
  }
  const body = section.body.trim();
  return body.length > 0 ? `${body}\n` : null;
};

export const mergeChangelog = (existing: string, tag: string, section: string): string =>
  mergeChangelogSections(existing, [{ tag, body: section.trim() }], true);

export const mergeChangelogSections = (
  existing: string,
  incoming: readonly ChangelogSection[],
  replaceExisting: boolean,
): string => {
  const sections = splitChangelog(existing);
  const order: string[] = [];
  const byTag = new Map<string, string>();

  for (const section of sections) {
    if (!isCalendarReleaseTag(section.tag)) {
      continue;
    }
    order.push(section.tag);
    byTag.set(section.tag, section.body);
  }

  for (const item of incoming) {
    if (!isCalendarReleaseTag(item.tag)) {
      continue;
    }
    if (byTag.has(item.tag) && !replaceExisting) {
      continue;
    }
    if (!byTag.has(item.tag)) {
      order.push(item.tag);
    }
    byTag.set(item.tag, item.body.trim());
  }

  const incomingIndex = new Map(incoming.map((item, index) => [item.tag, index]));
  order.sort((a, b) => {
    const indexA = incomingIndex.get(a);
    const indexB = incomingIndex.get(b);
    if (indexA !== undefined && indexB !== undefined) {
      return indexA - indexB;
    }
    if (indexA !== undefined) {
      return -1;
    }
    if (indexB !== undefined) {
      return 1;
    }
    return 0;
  });

  const bodies = order
    .map((tag) => byTag.get(tag))
    .filter((body): body is string => body !== undefined);

  return `${CHANGELOG_TITLE}\n\n${bodies.join("\n\n")}\n`
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+$/, "\n");
};

const highestBump = (packages: Readonly<Record<string, ChangesetBump>>): ChangesetBump => {
  const bumps = new Set(Object.values(packages));
  if (bumps.has("major")) {
    return "major";
  }
  if (bumps.has("minor")) {
    return "minor";
  }
  return "patch";
};

const formatPackageNames = (packages: Readonly<Record<string, ChangesetBump>>): string =>
  Object.keys(packages)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => `\`${name}\``)
    .join(", ");

const formatChangelogEntry = (entry: ChangelogEntry): string => {
  const who = entry.authors.length > 0 ? entry.authors.join(", ") : "unknown";
  const sha = entry.hash !== null && entry.hash.length > 0 ? shortCommitSha(entry.hash) : null;
  const prefix = sha !== null ? `${sha}: ` : "";
  const pkgs = formatPackageNames(entry.changeset.packages);
  const suffix = pkgs.length > 0 ? ` — ${who} (${pkgs})` : ` — ${who}`;
  return `- ${prefix}${entry.changeset.summary}${suffix}`;
};

const splitChangelog = (existing: string): readonly ChangelogSection[] => {
  const source =
    existing.trim().length === 0 ? `${CHANGELOG_TITLE}\n\n` : `${existing.replace(/\s+$/, "")}\n`;
  const rest = source.startsWith(CHANGELOG_TITLE)
    ? source.slice(CHANGELOG_TITLE.length).replace(/^\r?\n/, "")
    : source;

  const headingRe = /^## /gm;
  const starts: number[] = [];
  let match: RegExpExecArray | null = headingRe.exec(rest);
  while (match !== null) {
    starts.push(match.index);
    match = headingRe.exec(rest);
  }

  const sections: ChangelogSection[] = [];
  for (let i = 0; i < starts.length; i++) {
    const from = starts[i];
    if (from === undefined) {
      continue;
    }
    const to = starts[i + 1] ?? rest.length;
    const block = rest.slice(from, to).trim();
    const titleLine = (block.split(/\r?\n/, 1)[0] ?? "").trim();
    const tag = titleLine.replace(/^##\s+/, "");
    sections.push({ tag, body: block });
  }
  return sections;
};
