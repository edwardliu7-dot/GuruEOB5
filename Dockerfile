# Multi-stage production build for GuruEOB5.
#
# Stage 1 ("build") has all the heavy tooling (pnpm, TypeScript, Vite,
# esbuild, devDependencies) needed to compile the app.
# Stage 2 ("runtime") is a slim image that only contains the compiled
# output — no source code, no node_modules, no dev tools. This keeps the
# final image small, which matters a lot on a small-RAM VPS: Docker can run
# out of memory while exporting a bloated single-stage image.
#
# esbuild bundles virtually everything into dist/index.mjs.  The one
# exception is pdfkit: it loads its built-in .afm font files from disk at
# runtime using paths relative to its own package directory, so bundling
# breaks those paths. We install pdfkit directly in the runtime stage via a
# plain npm install — it's ~5 MB and avoids the RAM-heavy `pnpm deploy` step
# that was previously needed to copy external deps.

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

# Skip the repo-wide typecheck here: it's a dev/CI concern and its extra
# `tsc` processes roughly double the peak memory used during this step,
# which matters on a small-RAM VPS. Run `pnpm run build` (with typecheck)
# locally or in CI before deploying.
#
# Cap Node.js heap at 768 MB so the Vite build does not get OOM-killed on a
# RAM-constrained VPS.  768 MB leaves headroom for the OS and Docker overhead
# on a 2 GB machine while still giving Vite plenty of room to bundle.
ENV NODE_OPTIONS="--max-old-space-size=768"
RUN pnpm run build:app

# ---------- Stage 2: runtime ----------
FROM node:22-slim AS runtime

WORKDIR /app

# Coolify's healthcheck runs `curl`/`wget` inside the container to verify
# the app is up. node:22-slim has neither by default, so the check always
# fails and Coolify rolls back a perfectly working deployment. Install curl.
# Also install pdfkit and pdf-parse here: both load files from disk at runtime
# (pdfkit uses path traversal for .afm fonts; pdf-parse v2 has no default ESM
# export), so esbuild cannot bundle them safely.
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm@latest --quiet \
  && npm install pdfkit pdf-parse --omit=dev --no-package-lock --no-save \
     --prefix /app 2>&1 | tail -5

ENV NODE_ENV=production
ENV PORT=3000

# Only the compiled output is needed to run the app.
# (pdfkit node_modules installed above; everything else is bundled by esbuild)
COPY --from=build /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=build /app/artifacts/guru-eob5/dist ./artifacts/guru-eob5/dist

EXPOSE 3000

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
