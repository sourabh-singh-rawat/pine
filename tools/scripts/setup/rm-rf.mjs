import { rmSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const RETRY_CODES = new Set(["ENOTEMPTY", "EBUSY", "EPERM", "EACCES"]);
const MAX_ATTEMPTS = 10;
const BASE_DELAY_MS = 50;

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error("Usage: node rm-rf.mjs <path> [path...]");
  process.exit(1);
}

async function rmWithRetry(targetPath) {
  const absolutePath = resolve(targetPath);
  if (!existsSync(absolutePath)) {
    return;
  }

  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      rmSync(absolutePath, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
      if (!existsSync(absolutePath)) {
        return;
      }
      lastError = new Error(`Path still exists after rm: ${absolutePath}`);
    } catch (error) {
      lastError = error;
      const code =
        error && typeof error === "object" && "code" in error ? String(error.code) : undefined;
      if (code === undefined || !RETRY_CODES.has(code) || attempt === MAX_ATTEMPTS) {
        throw error;
      }
    }
    await delay(BASE_DELAY_MS * attempt);
  }

  throw lastError;
}

for (const target of targets) {
  await rmWithRetry(target);
}
