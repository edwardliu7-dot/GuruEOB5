import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as gurusSchema from "./gurus";
import * as tomatStudentsSchema from "./tomat-students";

const { Pool } = pg;

if (!process.env.NEON_DATABASE_URL) {
  throw new Error(
    "NEON_DATABASE_URL must be set. It should point to the shared Neon database containing the gurus table.",
  );
}

export const neonPool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
});
export const neonDb = drizzle(neonPool, { schema: { ...gurusSchema, ...tomatStudentsSchema } });

export * from "./gurus";
export * from "./tomat-students";
