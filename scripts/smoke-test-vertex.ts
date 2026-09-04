// Ad-hoc credential check: confirms the GCP service account can obtain a
// Vertex AI token and get a response back from Gemini. Not part of the app.
// Run with: npx tsx scripts/smoke-test-vertex.ts
import { loadEnvLocal } from "./lib/load-env";

async function main() {
  loadEnvLocal();

  const required = ["GCP_PROJECT_ID", "GCP_SERVICE_ACCOUNT_JSON"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing required env vars: ${missing.join(", ")}`);
    process.exit(1);
  }

  const { callGemini } = await import("../lib/gemini");

  console.log(`Requesting token + calling Vertex AI (project: ${process.env.GCP_PROJECT_ID}, model: ${process.env.GEMINI_MODEL || "gemini-2.5-flash"})...`);

  try {
    const result = await callGemini("Reply with exactly one word: OK");
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("SUCCESS — Vertex AI responded.");
    console.log("Model said:", text ?? JSON.stringify(result).slice(0, 300));
  } catch (err) {
    console.error("FAILED —", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
