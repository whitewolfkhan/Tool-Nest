import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* standalone output is for self-hosted/Docker deploys — Vercel does its
     own file tracing and breaks on standalone (missing next-server.js.nft.json) */
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
