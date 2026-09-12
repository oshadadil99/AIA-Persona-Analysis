import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type UserRole = "agent" | "admin";

export interface SessionPayload {
  uid: string;
  username: string;
  role: UserRole;
  exp: number; // unix seconds
}

// The cookie is "<base64url payload>.<hmac>" — readable but not forgeable
// without SESSION_SECRET. Keyed by its own secret rather than by a password,
// so changing someone's password doesn't sign everyone else out.
function getSecret(): string | null {
  return process.env.SESSION_SECRET || null;
}

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export function createSessionToken(user: { id: string; username: string; role: UserRole }): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error("SESSION_SECRET is not set — cannot create a login session.");
  }

  const payload: SessionPayload = {
    uid: user.id,
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

// Returns the payload only if the signature checks out AND it hasn't expired;
// null otherwise. Fails closed on a missing secret rather than throwing, since
// this runs on every request including the proxy.
export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;

  const secret = getSecret();
  if (!secret) return null;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;

  const body = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  const expected = Buffer.from(sign(body, secret));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return null;
  }

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof payload?.uid !== "string" || typeof payload?.exp !== "number") return null;
  if (payload.role !== "agent" && payload.role !== "admin") return null;
  if (payload.exp * 1000 < Date.now()) return null;

  return payload;
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
