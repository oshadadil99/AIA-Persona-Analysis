import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

// scrypt from Node's own crypto — deliberately no bcrypt/argon2 dependency,
// which would pull a native binary into the Vercel function bundle for the
// sake of one login call.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

// Constant-time comparison — a plain === would leak how much of the hash
// matched via response timing.
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;

  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== KEY_LENGTH) return false;

  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return timingSafeEqual(keyBuffer, derived);
}
