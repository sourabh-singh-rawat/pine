import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";
import { env } from "@/bootstrap/env";

const pool = new Pool({
  connectionString: env.ISSUES_DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export const initializeDb = async (): Promise<void> => {
  const client = await pool.connect();
  client.release();
};

export const closeDb = async (): Promise<void> => {
  await pool.end();
};
