import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Verhindert, dass Next.js ~/package-lock.json als Workspace-Root nimmt
  // und ins falsche `out/` schreibt (Mac-Warnung „multiple lockfiles“).
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
