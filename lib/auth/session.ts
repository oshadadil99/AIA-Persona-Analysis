import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE_NAME = "operator_session";
const SESSION_MESSAGE = "operator-authenticated";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Session token is an HMAC of a fixed message, keyed by the operator
// password. This ties session validity to the password without needing a
// separate secret or a sessions table — rotating the password automatically
// invalidates all existing sessions.
function getSecret(): string {
  const secret = process.env.OPERATOR_PASSWORD;
  if (!secret) {
    throw new Error("OPERATOR_PASSWORD is not set — cannot manage operator sessions.");
  }
  return secret;
}

export function createSessionToken(): string {
  return createHmac("sha256", getSecret()).update(SESSION_MESSAGE).digest("hex");
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  let secret: string;
  try {
    secret = getSecret();
  } catch {
    return false;
  }
  const expected = createHmac("sha256", secret).update(SESSION_MESSAGE).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const tokenBuf = Buffer.from(token, "hex");
  if (expectedBuf.length !== tokenBuf.length) return false;
  return timingSafeEqual(expectedBuf, tokenBuf);
}

export function verifyPassword(password: string): boolean {
  const secret = process.env.OPERATOR_PASSWORD;
  if (!secret) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
