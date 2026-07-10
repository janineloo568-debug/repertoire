import type { NextConfig } from "next";
import path from "path";

/** Home-dir lockfiles (e.g. ~/package-lock.json) must not become the Next.js workspace root. */
const projectRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.figma.com",
        pathname: "/api/mcp/asset/**",
      },
    ],
  },
  serverExternalPackages: ["better-sqlite3", "canvas", "pdfjs-dist"],
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
