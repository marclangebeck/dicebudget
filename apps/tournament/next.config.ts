import path from "node:path";
import type { NextConfig } from "next";

const appDir = path.resolve(__dirname);

const nextConfig: NextConfig = {
  output: "export",
  distDir: ".next",
  outputFileTracingRoot: appDir,
  turbopack: {
    root: appDir,
  },
};

export default nextConfig;
