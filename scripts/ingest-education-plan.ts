// Embeds data/education.json and upserts it into Pinecone (namespace "aia",
// per Section 4). Run with: npx tsx scripts/ingest-education-plan.ts
import { readFileSync } from "fs";
import { resolve } from "path";
import { loadEnvLocal } from "./lib/load-env";

const SOURCE_DOC = "education.json";
const PLAN_TYPE = "education";
const NAMESPACE = "aia";

async function main() {
  loadEnvLocal();

  const required = ["GCP_PROJECT_ID", "GCP_SERVICE_ACCOUNT_JSON", "PINECONE_API_KEY", "PINECONE_INDEX"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing required env vars: ${missing.join(", ")}`);
    process.exit(1);
  }

  const { chunkEducationPlan } = await import("../lib/rag/chunk-education-plan");
  const { embedText } = await import("../lib/gemini");
  const { ensureIndexExists } = await import("../lib/pinecone");

  const planPath = resolve(process.cwd(), "data/education.json");
  const plan = JSON.parse(readFileSync(planPath, "utf8"));
  const chunks = chunkEducationPlan(plan);

  console.log(`Chunked ${SOURCE_DOC} into ${chunks.length} sections. Embedding...`);

  const index = await ensureIndexExists();

  const vectors = [];
  for (const chunk of chunks) {
    const values = await embedText(chunk.text, "RETRIEVAL_DOCUMENT");
    vectors.push({
      id: `${PLAN_TYPE}__${chunk.id}`,
      values,
      metadata: {
        plan_type: PLAN_TYPE,
        source_doc: SOURCE_DOC,
        section: chunk.section,
        text: chunk.text,
      },
    });
    console.log(`  embedded: ${chunk.id} (${chunk.section})`);
  }

  await index.namespace(NAMESPACE).upsert({ records: vectors });

  console.log(`SUCCESS — upserted ${vectors.length} vectors into namespace "${NAMESPACE}".`);
}

main().catch((err) => {
  console.error("FAILED —", err instanceof Error ? err.message : err);
  process.exit(1);
});
