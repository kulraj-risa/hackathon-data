import type { NextConfig } from "next";

// The FastAPI backend (model inference + de-identified data + audit store).
// NOTE: Next resolves rewrite destinations at BUILD time, so BACKEND_URL must be
// set during `npm run build` (see web/Dockerfile ARG). Defaults to localhost for
// `npm run dev`.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  // Proxy API calls to FastAPI so the browser talks only to Next (no CORS).
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
      { source: "/healthz", destination: `${BACKEND_URL}/healthz` },
    ];
  },
};

export default nextConfig;
