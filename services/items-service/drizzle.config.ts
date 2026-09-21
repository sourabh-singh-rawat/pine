import { resolve } from "node:path";
import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile(resolve(process.cwd(), "../../.env"));
} catch {
  // Env may already be provided by the shell or host.
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.ISSUES_DATABASE_URL!,
  },
});
