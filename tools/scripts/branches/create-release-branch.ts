import { execFile } from "node:child_process";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import {
  calendarDateParts,
  formatReleaseBranch,
  formatReleaseBranchExample,
  formatReleaseTag,
  formatReleaseTagExample,
  nextReleaseVersion,
  parseReleaseCalendarDay,
  parseReleaseRef,
  type ReleaseVersionParts,
} from "../release/release-version.ts";

const execFileAsync = promisify(execFile);

type CliOptions = {
  readonly help: boolean;
  readonly dryRun: boolean;
  readonly push: boolean;
  readonly base: string;
  readonly explicit: string | null;
  readonly date: string | null;
};

const git = async (args: readonly string[], cwd = process.cwd()): Promise<string> => {
  const { stdout } = await execFileAsync("git", [...args], {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout.trim();
};

const lines = (out: string): string[] =>
  out.length === 0
    ? []
    : out
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

const gitLines = async (args: readonly string[], cwd: string): Promise<string[]> => {
  try {
    return lines(await git(args, cwd));
  } catch {
    return [];
  }
};

const refExists = async (ref: string, cwd: string): Promise<boolean> => {
  try {
    await git(["rev-parse", "--verify", "--quiet", ref], cwd);
    return true;
  } catch {
    return false;
  }
};

const collectKnownRefs = async (cwd: string): Promise<string[]> => {
  try {
    await git(["fetch", "--tags", "--prune", "origin"], cwd);
  } catch {}
  return [
    ...(await gitLines(["tag", "--list", "v20*.*.*.*"], cwd)),
    ...(await gitLines(["branch", "--list", "release/*", "--format=%(refname:short)"], cwd)),
    ...(
      await gitLines(["branch", "-r", "--list", "*/release/*", "--format=%(refname:short)"], cwd)
    ).map((n) => n.replace(/^origin\//, "")),
  ];
};

const resolveBaseRef = async (cwd: string, base: string): Promise<string | null> => {
  for (const c of [base, `refs/heads/${base}`, `origin/${base}`, `refs/remotes/origin/${base}`]) {
    if (await refExists(c, cwd)) {
      return c;
    }
  }
  return null;
};

const ensureOnBase = async (cwd: string, base: string, baseRef: string): Promise<void> => {
  if ((await git(["branch", "--show-current"], cwd)) === base) {
    return;
  }
  if (await refExists(`refs/heads/${base}`, cwd)) {
    await git(["switch", base], cwd);
    return;
  }
  if (baseRef === `origin/${base}` || baseRef === `refs/remotes/origin/${base}`) {
    await git(["switch", "-c", base, "--track", `origin/${base}`], cwd);
    return;
  }
  await git(["switch", "-c", base, baseRef], cwd);
};

const flagValue = (
  argv: readonly string[],
  i: number,
  flag: string,
): { value: string; next: number } | { error: string } => {
  const arg = argv[i] ?? "";
  if (arg.startsWith(`${flag}=`)) {
    const value = arg.slice(flag.length + 1);
    return value.length > 0 ? { value, next: i } : { error: `${flag} requires a value` };
  }
  const value = argv[i + 1];
  if (value === undefined || value.startsWith("-")) {
    return { error: `${flag} requires a value` };
  }
  return { value, next: i + 1 };
};

const printHelp = (): void => {
  console.log(`Usage: branch:release [options] [release/YYYY.MM.DD.N]

Next calver branch (${formatReleaseBranchExample()} -> ${formatReleaseTagExample()}).

  --base <branch>   default: dev
  --date YYYY.MM.DD calendar day (N still auto)
  --push            push + set upstream
  --dry-run         plan only
  -h, --help
`);
};

const parseArgs = (argv: readonly string[]): CliOptions | { error: string } => {
  let help = false;
  let dryRun = false;
  let push = false;
  let base = "dev";
  let explicit: string | null = null;
  let date: string | null = null;

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
    if (arg === "--push") {
      push = true;
      continue;
    }
    if (arg === "--base" || arg.startsWith("--base=")) {
      const taken = flagValue(argv, i, "--base");
      if ("error" in taken) {
        return taken;
      }
      base = taken.value;
      i = taken.next;
      continue;
    }
    if (arg === "--date" || arg.startsWith("--date=")) {
      const taken = flagValue(argv, i, "--date");
      if ("error" in taken) {
        return { error: "--date requires YYYY.MM.DD" };
      }
      date = taken.value;
      i = taken.next;
      continue;
    }
    if (arg.startsWith("-")) {
      return { error: `Unknown option: ${arg}` };
    }
    if (explicit !== null) {
      return { error: `Unexpected extra argument: ${arg}` };
    }
    explicit = arg;
  }

  return { help, dryRun, push, base, explicit, date };
};

const resolveParts = async (
  cwd: string,
  options: CliOptions,
): Promise<ReleaseVersionParts | { error: string }> => {
  if (options.explicit !== null) {
    const resolved = parseReleaseRef(options.explicit);
    return (
      resolved ?? {
        error: `Invalid release id. Expected ${formatReleaseBranchExample()} or ${formatReleaseTagExample()}. Got: ${options.explicit}`,
      }
    );
  }
  let day = calendarDateParts();
  if (options.date !== null) {
    const override = parseReleaseCalendarDay(options.date);
    if (override === null) {
      return { error: `Invalid --date. Expected YYYY.MM.DD. Got: ${options.date}` };
    }
    day = override;
  }
  return nextReleaseVersion(await collectKnownRefs(cwd), day);
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

  const cwd = process.cwd();
  const parts = await resolveParts(cwd, parsed);
  if ("error" in parts) {
    console.error(parts.error);
    return 1;
  }

  const branch = formatReleaseBranch(parts);
  const tag = formatReleaseTag(parts);
  const conflicts: Array<[string, string]> = [
    [`refs/heads/${branch}`, `Local branch already exists: ${branch}`],
    [`refs/remotes/origin/${branch}`, `Remote branch already exists: origin/${branch}`],
    [`refs/tags/${tag}`, `Tag already exists: ${tag}`],
  ];
  for (const [ref, message] of conflicts) {
    if (await refExists(ref, cwd)) {
      console.error(message);
      return 1;
    }
  }

  const baseRef = await resolveBaseRef(cwd, parsed.base);
  if (baseRef === null) {
    console.error(`Base branch not found locally or on origin: ${parsed.base}`);
    return 1;
  }

  console.log(`Release branch: ${branch}`);
  console.log(`Release tag:    ${tag}  (created later by merge to main)`);
  console.log(`Base:           ${baseRef}`);
  if (parsed.dryRun) {
    console.log("DRY_RUN - not creating branch.");
    return 0;
  }

  await ensureOnBase(cwd, parsed.base, baseRef);
  const onBase = await git(["branch", "--show-current"], cwd);
  if (onBase !== parsed.base) {
    console.error(`Expected ${parsed.base}, current: ${onBase || "(detached)"}`);
    return 1;
  }

  await git(["switch", "-c", branch], cwd);
  console.log(`Created and switched to ${branch}`);
  if (parsed.push) {
    await git(["push", "-u", "origin", branch], cwd);
    console.log(`Pushed origin/${branch}`);
  } else {
    console.log(`Next: git push -u origin ${branch}`);
    console.log(`Then open a PR into main. Merge creates tag ${tag}.`);
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
    return entry.replace(/\\/g, "/").endsWith("/tools/scripts/branches/create-release-branch.ts");
  }
};

if (isMainModule()) {
  void main().then((code) => {
    process.exitCode = code;
  });
}
