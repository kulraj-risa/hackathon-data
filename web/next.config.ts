import type { NextConfig } from "next";

// The FastAPI backend (model inference + de-identified data + audit store).
// Override per-environment, e.g. on Cloud Run set BACKEND_URL to the API service.
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
