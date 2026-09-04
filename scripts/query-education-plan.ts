// Ad-hoc retrieval check: embeds a question and queries Pinecone to confirm
// the ingested chunks come back sensibly. Not part of the app.
// Run with: npx tsx scripts/query-education-plan.ts "your question here"
import { loadEnvLocal } from "./lib/load-env";

async function main() {
  loadEnvLocal();
  const question = process.argv[2] || "What happens if I surrender the policy early?";

  const { embedText } = await import("../lib/gemini");
  const { getIndex } = await import("../lib/pinecone");

  const vector = await embedText(question, "RETRIEVAL_QUERY");
  const index = getIndex();

  const result = await index.namespace("aia").query({
    vector,
    topK: 3,
    includeMetadata: true,
    filter: { plan_type: "education" },
  });

  console.log(`Query: "${question}"\n`);
  for (const match of result.matches ?? []) {
    console.log(`score=${match.score?.toFixed(3)}  section=${match.metadata?.section}`);
    console.log(String(match.metadata?.text).slice(0, 200) + "...\n");
  }
}

main().catch((err) => {
  console.error("FAILED —", err instanceof Error ? err.message : err);
  process.exit(1);
});
