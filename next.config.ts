import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `standalone` is for the sandbox/self-hosted production scripts.
  // On Vercel it must be off (Vercel manages the server bundle itself).
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),

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
