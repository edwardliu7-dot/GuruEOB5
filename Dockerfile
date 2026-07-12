# Multi-stage production build for GuruEOB5.
#
# Stage 1 ("build") has all the heavy tooling (pnpm, TypeScript, Vite,
# esbuild, devDependencies) needed to compile the app.
# Stage 2 ("runtime") is a slim image that only contains the compiled
# output — no source code, no node_modules, no dev tools. This keeps the
# final image small, which matters a lot on a small-RAM VPS: Docker can run
# out of memory while exporting a bloated single-stage image.
#
# The api-server bundles all its JS dependencies into one file via esbuild,
# and also serves the built frontend (see artifacts/api-server/src/app.ts),
# so the runtime stage needs nothing but the two "dist" folders to run.

# ---------- Stage 1: build ----------
FROM node:22-slim AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy everything (see .dockerignore for what's excluded).
COPY . .

RUN pnpm install --frozen-lockfile

# Needed at build time only, so the frontend build knows its asset base path.
ENV NODE_ENV=production
ENV PORT=3000
ENV BASE_PATH=/

RUN pnpm run build

# esbuild bundles almost everything, but a few packages (e.g. @google/genai)
# are deliberately left external in artifacts/api-server/build.mjs. Use
# `pnpm deploy` to produce a small, self-contained node_modules with just
# those production dependencies, so the runtime image doesn't need the
# full (devDependencies-heavy) workspace node_modules.
RUN pnpm --filter @workspace/api-server --prod deploy --legacy /app/deploy

# ---------- Stage 2: runtime ----------
FROM node:22-slim AS runtime

WORKDIR /app

# Coolify's healthcheck runs `curl`/`wget` inside the container to verify
# the app is up. node:22-slim has neither by default, so the check always
# fails and Coolify rolls back a perfectly working deployment. Install curl.
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000

# Only the compiled output + the small set of external prod dependencies
# are needed to run the app.
COPY --from=build /app/deploy/node_modules ./node_modules
COPY --from=build /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=build /app/artifacts/guru-eob5/dist ./artifacts/guru-eob5/dist

EXPOSE 3000

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
