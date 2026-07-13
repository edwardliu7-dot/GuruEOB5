import express, { type Express } from "express";
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
    CREATE INDEX IF NOT EXISTS "IDX_guru_eob5_session_expire" ON "guru_eob5_session" ("expire");`,
  )
  .then(() => {
    logger.info("Session table ready");
  })
  .catch((err) => {
    logger.error({ err }, "Failed to ensure session table exists");
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

export default app;
