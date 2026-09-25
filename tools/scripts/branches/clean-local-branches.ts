#!/usr/bin/env node

import { execFile } from "node:child_process";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const PROTECTED = new Set(["main", "dev"]);

const run = async (
  command: string,
  args: readonly string[],
  opts: { cwd?: string } = {},
): Promise<{ stdout: string; stderr: string }> => {
  const { stdout, stderr } = await execFileAsync(command, [...args], {
    cwd: opts.cwd ?? process.cwd(),
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024,
  });
  return { stdout: stdout.trim(), stderr: stderr.trim() };
};

const git = async (args: readonly string[], cwd: string): Promise<string> => {
  const { stdout } = await run("git", args, { cwd });
  return stdout;
};

const splitLines = (out: string): string[] => {
  if (out.length === 0) {
    return [];
  }
  return out
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

const listLocalBranches = async (cwd: string): Promise<string[]> =>
  splitLines(await git(["for-each-ref", "--format=%(refname)", "refs/heads"], cwd)).map((ref) =>
    ref.replace(/^refs\/heads\//, ""),
  );

const printHelp = (): void => {
  console.log(`Usage: branch:clean

Deletes local Git branches only. Keeps main and dev.
Does not touch remotes.

Switches to dev or main first if you are on another local branch.

Examples:
  pnpm branch:clean
`);
};

export const main = async (argv: readonly string[] = process.argv.slice(2)): Promise<number> => {
  if (argv.includes("-h") || argv.includes("--help")) {
    printHelp();
    return 0;
  }

  const cwd = process.cwd();

  try {
    await git(["rev-parse", "--is-inside-work-tree"], cwd);
  } catch {
    console.error("Not inside a Git work tree. Run from the monorepo root.");
    return 1;
  }

  const locals = await listLocalBranches(cwd);
  const current = await git(["branch", "--show-current"], cwd);
  const toDelete = locals.filter((name) => !PROTECTED.has(name));

  if (toDelete.length === 0) {
    console.log("Nothing to delete. Local branches:");
    for (const name of locals) {
      console.log(`  ${name}`);
    }
    return 0;
  }

  if (!PROTECTED.has(current)) {
    const switchTo = locals.includes("dev") ? "dev" : locals.includes("main") ? "main" : null;
    if (switchTo === null) {
      console.error("Need a local main or dev branch to switch to before deleting others.");
      return 1;
    }
    console.log(`Switching from ${current} to ${switchTo}`);
    await git(["switch", switchTo], cwd);
  }

  for (const name of toDelete) {
    console.log(`Deleting local branch ${name}`);
    await git(["branch", "-D", name], cwd);
  }

  const remaining = await listLocalBranches(cwd);
  console.log("Remaining local branches:");
  for (const name of remaining) {
    console.log(`  ${name}`);
  }
  return 0;
};

const isMainModule = (): boolean => {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  try {
    return import.meta.url === pathToFileURL(entry).href;
  } catch {
    const normalized = entry.replace(/\\/g, "/").toLowerCase();
    return normalized.endsWith("/tools/scripts/branches/clean-local-branches.ts");
  }
};

if (isMainModule()) {
  void main().then((code) => {
    process.exitCode = code;
  });
}
