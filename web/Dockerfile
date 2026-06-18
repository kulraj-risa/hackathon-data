# Next.js frontend for Cloud Run (standalone output). Multi-stage build.
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# BACKEND_URL is only needed at runtime (rewrites are evaluated per-request),
# but Next reads next.config at build too; a placeholder is fine here.
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
