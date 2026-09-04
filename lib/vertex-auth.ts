import { GoogleAuth } from "google-auth-library";

let auth: GoogleAuth | null = null;

function getAuth() {
  if (!auth) {
    auth = new GoogleAuth({
      credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON!),
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
  }
  return auth;
}

export async function getAccessToken() {
  const client = await getAuth().getClient();
  const token = await client.getAccessToken();
  if (!token.token) {
    throw new Error("Failed to obtain Vertex AI access token");
  }
  return token.token;
}
