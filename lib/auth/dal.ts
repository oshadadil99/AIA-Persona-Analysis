import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/db/supabase";
import { SESSION_COOKIE_NAME, verifySessionToken, type UserRole } from "./session";

export interface CurrentUser {
  id: string;
  username: string;
  role: UserRole;
}

// The real authorization check, per the Next.js auth guide: proxy.ts does a
// fast cookie-only pre-filter, but everything that touches data calls through
// here. The row lookup means deleting a user or changing their role takes
// effect on their next request instead of waiting out their 7-day cookie.
//
// cache() dedupes this to one query per render pass, however many layouts,
// pages and actions ask for the user.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("id, username, role")
    .eq("id", session.uid)
    .maybeSingle();

  if (error || !data) return null;
  return data as CurrentUser;
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  // A signed-in agent isn't an intruder — send them somewhere they can use
  // rather than bouncing them back to a login they've already passed.
  if (user.role !== "admin") redirect("/child-report");
  return user;
}
