import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: rootDir,
  resolve: {
    alias: [
      {
        find: /^@\//,
        replacement: `${path.resolve(rootDir, "src")}/`,
      },
    ],
  },
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    passWithNoTests: true,
    clearMocks: true,
    exclude: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
  },
});
