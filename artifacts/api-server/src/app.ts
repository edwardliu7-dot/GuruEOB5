import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import pinoHttp from "pino-http";
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

const sessionTableReady = sessionPool
  .query(
    `CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
    );
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");`,
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
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    store: new PgSessionStore({
      pool: sessionPool,
      tableName: "session",
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

export default app;
