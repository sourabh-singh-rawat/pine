import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/bootstrap/env";
import * as schema from "@/db/schema";

const pool = new Pool({
  connectionString: env.AUDIT_DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export const initializeDb = async (): Promise<void> => {
  const client = await pool.connect();
  client.release();
};

export const closeDb = async (): Promise<void> => {
  await pool.end();
};
