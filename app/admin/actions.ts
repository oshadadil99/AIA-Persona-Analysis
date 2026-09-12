"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/dal";

// Server actions are publicly callable endpoints — the proxy redirect and the
// layout's requireAdmin() don't protect them, so each action re-checks. Throws
// rather than redirects so the caller can show the error inline.
async function requireOperatorSession(): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
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
