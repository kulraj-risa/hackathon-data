# Next.js frontend for Cloud Run (standalone output). Multi-stage build.
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# `npm install` (not `npm ci`) so platform-specific optional deps (Next/Tailwind
# native binaries) resolve correctly inside the Linux image; the macOS-generated
# lockfile omits some Linux variants which would make the strict `npm ci` fail.
RUN npm install --no-audit --no-fund

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Next.js resolves rewrite destinations at BUILD time (baked into the routes
# manifest), so BACKEND_URL must be present here, not just at runtime.
ARG BACKEND_URL=https://risa-denial-api-835676485453.us-central1.run.app
ENV BACKEND_URL=$BACKEND_URL
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080 \
    HOSTNAME=0.0.0.0
# Standalone server + static assets.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 8080
# BACKEND_URL must be set at deploy time to the FastAPI service URL.
CMD ["node", "server.js"]
