"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/db/supabase";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  type UserRole,
} from "@/lib/auth/session";

export interface LoginResult {
  ok: boolean;
  error?: string;
}

export async function login(username: string, password: string, next?: string): Promise<LoginResult> {
  const trimmed = username.trim().toLowerCase();
  if (!trimmed || !password) {
    return { ok: false, error: "Enter both a username and a password." };
  }

  const supabase = createServiceClient();
  // eq, not ilike: usernames are stored lowercased, and ilike would treat a
  // "%" or "_" in the input as a wildcard matching other people's accounts.
  const { data: user, error } = await supabase
    .from("app_users")
    .select("id, username, password_hash, role")
    .eq("username", trimmed)
    .maybeSingle();

  if (error) {
    return { ok: false, error: "Could not reach the login service. Please try again." };
  }

  // Same message whether the username doesn't exist or the password is wrong —
  // telling them which one was right would let someone enumerate usernames.
  const invalid: LoginResult = { ok: false, error: "Incorrect username or password." };
  if (!user) return invalid;

  const passwordOk = await verifyPassword(password, user.password_hash as string);
  if (!passwordOk) return invalid;

  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAME,
    createSessionToken({ id: user.id as string, username: user.username as string, role: user.role as UserRole }),
    SESSION_COOKIE_OPTIONS,
  );

  // Only allow relative paths back — an absolute URL here would turn the
  // ?next= param into an open redirect to any site.
  const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/child-report";
  redirect(destination);
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
