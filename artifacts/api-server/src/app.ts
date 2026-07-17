import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import pinoHttp from "pino-http";
import path from "node:path";
import fs from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";

const sessionSecret = process.env["SESSION_SECRET"];

if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required but was not provided.");
}

const databaseUrl = process.env["DATABASE_URL"];

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required but was not provided.");
}

const PgSessionStore = connectPgSimple(session);
const sessionPool = new pg.Pool({ connectionString: databaseUrl });

// NOTE: DATABASE_URL/NEON_DATABASE_URL point at a Postgres instance shared
// across multiple unrelated apps/projects. Generic names like "session" /
// "session_pkey" collide with other apps' tables in the same "public"
// schema (constraint/index names must be unique per-schema, not per-table),
// so every identifier here is namespaced to this app to avoid that.
const sessionTableReady = sessionPool
  .query(
    `CREATE TABLE IF NOT EXISTS "guru_eob5_session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "guru_eob5_session_pkey" PRIMARY KEY ("sid")
    );
    CREATE INDEX IF NOT EXISTS "IDX_guru_eob5_session_expire" ON "guru_eob5_session" ("expire");

    -- Additive schema migrations: safe to run repeatedly (IF NOT EXISTS / IF COLUMN).
    -- Add prosem_item_id to journal_entries if the production DB predates this column.
    ALTER TABLE journal_entries
      ADD COLUMN IF NOT EXISTS prosem_item_id uuid
        REFERENCES prosem_items(id) ON DELETE SET NULL;

    -- Create bahan_ajar table if it doesn't exist yet.
    CREATE TABLE IF NOT EXISTS bahan_ajar (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      school text NOT NULL,
      judul text NOT NULL,
      mata_pelajaran text,
      kelas text,
      deskripsi text,
      file_name text,
      file_type text,
      file_size integer,
      file_data text,
      link_url text,
      created_by text NOT NULL,
      created_by_name text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    `,
  )
  .then(() => {
    logger.info("Session table and schema migrations ready");
  })
  .catch((err) => {
    logger.error({ err }, "Failed to ensure session table / run migrations");
    throw err;
  });

export { sessionTableReady };

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    store: new PgSessionStore({
      pool: sessionPool,
      tableName: "guru_eob5_session",
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env["NODE_ENV"] === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

app.use("/api", router);

// In a single-container deployment (e.g. Coolify), this process also serves
// the built guru-eob5 frontend so only one start command/container is needed.
// On Replit, the frontend is served separately by the artifact router, and
// this directory won't exist in dev, so this block is skipped there.
const frontendDist = path.resolve(
  import.meta.dirname,
  "../../guru-eob5/dist/public",
);

if (fs.existsSync(frontendDist)) {
  logger.info({ frontendDist }, "Serving frontend static files");
  app.use(express.static(frontendDist));
  // Express 5's router (path-to-regexp v8) rejects a bare "*" path pattern,
  // so use a path-less middleware for the SPA fallback instead.
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(frontendDist, "index.html"));
  });
} else {
  logger.info({ frontendDist }, "Frontend build not found; skipping static file serving");
}

// Global error handler — must be registered last and have 4 parameters so
// Express recognises it as an error-handling middleware. Converts any
// unhandled route error (DB crash, thrown exception, etc.) into a JSON
// response instead of the default HTML page, so the frontend can always
// read err.data.error and show a meaningful message.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled route error");
  const message =
    err instanceof Error ? err.message : "Terjadi kesalahan pada server";
  res.status(500).json({ error: message });
});

export default app;
