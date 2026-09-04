import { getAccessToken } from "./vertex-auth";

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = process.env.GCP_LOCATION || "us-central1";
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
const EMBEDDING_DIMENSIONALITY = Number(process.env.EMBEDDING_OUTPUT_DIMENSIONALITY) || 768;

export async function callGemini(prompt: string) {
  const token = await getAccessToken();
  const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vertex AI generateContent failed (${res.status}): ${body}`);
  }

  return res.json();
}

export type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

// Single place that calls the Vertex AI embeddings endpoint. Pipeline/ingest
// code should call this, never hit the API directly (Section 8).
export async function embedText(
  text: string,
  taskType: EmbeddingTaskType = "RETRIEVAL_DOCUMENT",
): Promise<number[]> {
  const token = await getAccessToken();
  const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${EMBEDDING_MODEL}:predict`;

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ content: text, task_type: taskType }],
      parameters: { outputDimensionality: EMBEDDING_DIMENSIONALITY },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vertex AI embeddings failed (${res.status}): ${body}`);
  }

  const json = await res.json();
  const values = json?.predictions?.[0]?.embeddings?.values;
  if (!Array.isArray(values)) {
    throw new Error(`Vertex AI embeddings response missing values: ${JSON.stringify(json).slice(0, 300)}`);
  }
  return values;
}
