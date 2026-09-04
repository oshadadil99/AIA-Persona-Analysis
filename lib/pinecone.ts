import { Pinecone } from "@pinecone-database/pinecone";

let client: Pinecone | null = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) throw new Error("Missing PINECONE_API_KEY");
    client = new Pinecone({ apiKey });
  }
  return client;
}

// One index for all insurers/plans (Section 4) — never create a second index.
export async function ensureIndexExists() {
  const pc = getClient();
  const indexName = process.env.PINECONE_INDEX;
  const dimension = Number(process.env.PINECONE_DIMENSION) || 768;
  const cloud = (process.env.PINECONE_CLOUD || "aws") as "aws" | "gcp" | "azure";
  const region = process.env.PINECONE_REGION || "us-east-1";

  if (!indexName) throw new Error("Missing PINECONE_INDEX");

  const { indexes } = await pc.listIndexes();
  const exists = indexes?.some((i) => i.name === indexName);

  if (!exists) {
    await pc.createIndex({
      name: indexName,
      dimension,
      metric: "cosine",
      spec: { serverless: { cloud, region } },
      waitUntilReady: true,
    });
  }

  return pc.index(indexName);
}

export function getIndex() {
  const indexName = process.env.PINECONE_INDEX;
  if (!indexName) throw new Error("Missing PINECONE_INDEX");
  return getClient().index(indexName);
}
