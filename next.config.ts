import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "18mb",
    },
  },
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
