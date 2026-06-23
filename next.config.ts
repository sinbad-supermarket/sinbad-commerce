import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
