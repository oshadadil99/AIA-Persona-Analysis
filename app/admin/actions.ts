"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/db/supabase";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

async function requireOperatorSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    throw new Error("Not authenticated.");
  }
}

export interface DeleteResult {
  ok: boolean;
  error?: string;
}

export async function deleteChildProfile(id: string): Promise<DeleteResult> {
  try {
    await requireOperatorSession();
  } catch {
    return { ok: false, error: "Not authenticated." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("child_profiles").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteChildProfiles(ids: string[]): Promise<DeleteResult> {
  if (ids.length === 0) {
    return { ok: false, error: "No records selected." };
  }

  try {
    await requireOperatorSession();
  } catch {
    return { ok: false, error: "Not authenticated." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("child_profiles").delete().in("id", ids);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true };
}
