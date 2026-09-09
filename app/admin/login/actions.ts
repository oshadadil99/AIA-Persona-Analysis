"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, verifyPassword, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/lib/auth/session";

export interface LoginResult {
  ok: boolean;
  error?: string;
}

export async function loginOperator(password: string): Promise<LoginResult> {
  if (!verifyPassword(password)) {
    return { ok: false, error: "Incorrect password." };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(), SESSION_COOKIE_OPTIONS);

  redirect("/admin");
}

export async function logoutOperator(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/admin/login");
}
