"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/dal";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { UserRole } from "@/lib/auth/session";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const MIN_PASSWORD_LENGTH = 8;

// Server actions are directly callable endpoints — the layout's requireAdmin()
// does not protect them, so every one of these re-checks for itself.
async function requireAdminActor() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

// Removing the last admin would lock everyone out of /admin permanently, with
// no way back except the CLI script. Guarded on both delete and demotion.
async function otherAdminsExist(excludingUserId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("app_users").select("id").eq("role", "admin");
  return (data ?? []).some((row) => row.id !== excludingUserId);
}

function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export async function createUser(username: string, password: string, role: UserRole): Promise<ActionResult> {
  const actor = await requireAdminActor();
  if (!actor) return { ok: false, error: "Not authorised." };

  const normalised = username.trim().toLowerCase();
  if (!normalised) return { ok: false, error: "Username is required." };
  if (!/^[a-z0-9._-]+$/.test(normalised)) {
    return { ok: false, error: "Username can only use letters, numbers, dot, dash and underscore." };
  }
  if (role !== "admin" && role !== "agent") return { ok: false, error: "Invalid role." };

  const passwordError = validatePassword(password);
  if (passwordError) return { ok: false, error: passwordError };

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("app_users")
    .insert({ username: normalised, password_hash: await hashPassword(password), role });

  if (error) {
    // 23505 = unique_violation on the lower(username) index.
    if (error.code === "23505") return { ok: false, error: `"${normalised}" already exists.` };
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function deleteUser(id: string): Promise<ActionResult> {
  const actor = await requireAdminActor();
  if (!actor) return { ok: false, error: "Not authorised." };

  if (id === actor.id) {
    return { ok: false, error: "You can't delete your own account." };
  }
  if (!(await otherAdminsExist(id))) {
    return { ok: false, error: "That's the last admin — promote someone else first." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("app_users").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function updateUserRole(id: string, role: UserRole): Promise<ActionResult> {
  const actor = await requireAdminActor();
  if (!actor) return { ok: false, error: "Not authorised." };
  if (role !== "admin" && role !== "agent") return { ok: false, error: "Invalid role." };

  if (role === "agent" && !(await otherAdminsExist(id))) {
    return { ok: false, error: "That's the last admin — promote someone else first." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("app_users").update({ role }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function resetUserPassword(id: string, newPassword: string): Promise<ActionResult> {
  const actor = await requireAdminActor();
  if (!actor) return { ok: false, error: "Not authorised." };

  const passwordError = validatePassword(newPassword);
  if (passwordError) return { ok: false, error: passwordError };

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("app_users")
    .update({ password_hash: await hashPassword(newPassword) })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/users");
  return { ok: true };
}

// Changing your OWN password requires the current one — otherwise anyone who
// walked up to an unlocked session could lock the real owner out.
export async function changeOwnPassword(currentPassword: string, newPassword: string): Promise<ActionResult> {
  const actor = await requireAdminActor();
  if (!actor) return { ok: false, error: "Not authorised." };

  const passwordError = validatePassword(newPassword);
  if (passwordError) return { ok: false, error: passwordError };

  const supabase = createServiceClient();
  const { data: row, error: readError } = await supabase
    .from("app_users")
    .select("password_hash")
    .eq("id", actor.id)
    .maybeSingle();

  if (readError || !row) return { ok: false, error: "Could not load your account." };
  if (!(await verifyPassword(currentPassword, row.password_hash as string))) {
    return { ok: false, error: "Current password is incorrect." };
  }

  const { error } = await supabase
    .from("app_users")
    .update({ password_hash: await hashPassword(newPassword) })
    .eq("id", actor.id);
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
