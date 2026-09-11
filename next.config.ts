import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep these out of the webpack/Turbopack bundle — they ship native
  // binaries (headless Chromium) that must be resolved from node_modules at
  // runtime, not statically bundled, or the serverless function build breaks.
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium", "puppeteer"],
  // serverExternalPackages alone doesn't pull @sparticuz/chromium's binary
  // bin/ directory into the Vercel function bundle — without this, the
  // deployed function's node_modules/@sparticuz/chromium/bin doesn't exist
  // at runtime even though the package itself does.
  outputFileTracingIncludes: {
    "/api/generate-pdf": ["./node_modules/@sparticuz/chromium/**"],
    "/api/admin/generate-pdf/[id]": ["./node_modules/@sparticuz/chromium/**"],
  },
};

export default nextConfig;
