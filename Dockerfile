# Single-container production build for GuruEOB5.
#
# This runs the whole pnpm monorepo build, then starts the API server, which
# also serves the built frontend (see artifacts/api-server/src/app.ts).
# One Dockerfile, one container, one process to run on the VPS.

FROM node:22-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy everything (see .dockerignore for what's excluded).
COPY . .

RUN pnpm install --frozen-lockfile

# Needed at build time only, so the frontend build knows its asset base path.
# The actual runtime port is provided by Coolify's PORT env var and overrides
# this default automatically.
ENV NODE_ENV=production
ENV PORT=3000
ENV BASE_PATH=/

RUN pnpm run build

EXPOSE 3000

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
