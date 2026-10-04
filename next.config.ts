import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: `output: "standalone"` is NOT used — it is unsupported on Vercel
  // and breaks serverless routing there (platform-level NOT_FOUND).

  // Ship the seeded demo SQLite database inside serverless bundles so the
  // zero-config demo mode works on Vercel (lib/db.ts copies it to /tmp).
  outputFileTracingIncludes: {
    "/**": ["./db/custom.db"],
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
