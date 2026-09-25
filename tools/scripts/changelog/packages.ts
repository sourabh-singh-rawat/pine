import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const WORKSPACE_ROOTS: readonly string[] = ["apps", "packages", "services", "tools"];

export type GitShow = (cwd: string, spec: string) => Promise<string | null>;
export type GitLines = (args: readonly string[], cwd: string) => Promise<string[]>;

export const isWorkspacePackageJsonPath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, "/");
  if (!normalized.endsWith("/package.json")) {
    return false;
  }
  return WORKSPACE_ROOTS.some((root) => normalized.startsWith(`${root}/`));
};

export const listWorkingTreePackageJsonPaths = (root: string): string[] => {
  const paths: string[] = [];
  for (const group of WORKSPACE_ROOTS) {
    const dir = join(root, group);
    if (!existsSync(dir)) {
      continue;
    }
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const relative = `${group}/${entry.name}/package.json`;
      if (existsSync(join(root, relative))) {
        paths.push(relative);
      }
    }
  }
  return paths;
};

export const packageVersionsAt = async (
  cwd: string,
  commit: string | null,
  gitShow: GitShow,
  gitLines: GitLines,
): Promise<Map<string, string>> => {
  const versions = new Map<string, string>();
  const paths =
    commit === null
      ? listWorkingTreePackageJsonPaths(cwd)
      : await listCommitPackageJsonPaths(cwd, commit, gitLines);

  for (const relative of paths) {
    const raw =
      commit === null
        ? readWorkingTreeFile(cwd, relative)
        : await gitShow(cwd, `${commit}:${relative}`);
    if (raw === null) {
      continue;
    }
    const parsed = parsePackageJsonNameVersion(raw);
    if (parsed !== null) {
      versions.set(parsed.name, parsed.version);
    }
  }

  return versions;
};

const listCommitPackageJsonPaths = async (
  cwd: string,
  commit: string,
  gitLines: GitLines,
): Promise<string[]> => {
  try {
    return (await gitLines(["ls-tree", "-r", "--name-only", commit], cwd)).filter(
      isWorkspacePackageJsonPath,
    );
  } catch {
    return [];
  }
};

const readWorkingTreeFile = (cwd: string, relative: string): string | null => {
  const full = join(cwd, relative);
  if (!existsSync(full)) {
    return null;
  }
  return readFileSync(full, "utf8");
};

const parsePackageJsonNameVersion = (raw: string): { name: string; version: string } | null => {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    if (!("name" in parsed) || !("version" in parsed)) {
      return null;
    }
    const { name, version } = parsed;
    if (typeof name !== "string" || name.length === 0) {
      return null;
    }
    if (typeof version !== "string" || version.length === 0) {
      return null;
    }
    return { name, version };
  } catch {
    return null;
  }
};
