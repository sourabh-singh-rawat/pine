import { isRetryableNetworkError, retry } from "@pine/common";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/bootstrap/env";
import * as schema from "@/db/schema";

const pool = new Pool({
  connectionString: env.NOTIFICATION_DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export const initializeDb = async (): Promise<void> => {
  await retry(
    async () => {
      const client = await pool.connect();
      client.release();
    },
    {
      maxAttempts: 8,
      baseDelayMs: 500,
      shouldRetry: isRetryableNetworkError,
    },
  );
};

export const closeDb = async (): Promise<void> => {
  await pool.end();
};
