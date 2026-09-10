import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep these out of the webpack/Turbopack bundle — they ship native
  // binaries (headless Chromium) that must be resolved from node_modules at
  // runtime, not statically bundled, or the serverless function build breaks.
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium", "puppeteer"],
};

export default nextConfig;
