// Creates or updates a login account. Passwords are hashed here — never
// insert an app_users row by hand, the login will reject a plain-text value.
//
//   npx tsx scripts/create-user.ts <username> <password> [admin|agent]
//
// Re-running with an existing username resets that user's password.
import { loadEnvLocal } from "./lib/load-env";

async function main() {
  loadEnvLocal();

  const [username, password, roleArg = "agent"] = process.argv.slice(2);

  if (!username || !password) {
    console.error("Usage: npx tsx scripts/create-user.ts <username> <password> [admin|agent]");
    process.exit(1);
  }
  if (roleArg !== "admin" && roleArg !== "agent") {
    console.error(`Role must be "admin" or "agent" — got "${roleArg}".`);
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const { createServiceClient } = await import("../lib/db/supabase");
  const { hashPassword } = await import("../lib/auth/password");

  const normalised = username.trim().toLowerCase();
  const supabase = createServiceClient();
  const password_hash = await hashPassword(password);

  const { data: existing } = await supabase
    .from("app_users")
    .select("id")
    .eq("username", normalised)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("app_users")
      .update({ password_hash, role: roleArg })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    console.log(`Updated "${normalised}" (role: ${roleArg}) — password reset.`);
    return;
  }

  const { error } = await supabase
    .from("app_users")
    .insert({ username: normalised, password_hash, role: roleArg });
  if (error) throw new Error(error.message);
  console.log(`Created "${normalised}" (role: ${roleArg}).`);
}

main().catch((err) => {
  console.error("FAILED —", err instanceof Error ? err.message : err);
  process.exit(1);
});
