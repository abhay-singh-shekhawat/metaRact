/**
 * Safe operator script: activate an admin membership for an existing,
 * verified Supabase Auth user. Not a web endpoint; never in the browser bundle.
 * Usage: SUPABASE_SERVICE_ROLE_KEY=... pnpm tsx scripts/bootstrap-admin.ts user@example.com owner
 */
async function main() {
  const email = (process.argv[2] || "").trim().toLowerCase();
  const role = (process.argv[3] || "owner").trim();
  if (!email || !email.includes("@")) {
    console.error("Usage: bootstrap-admin.ts <email> [owner|member]");
    process.exit(1);
  }
  if (role !== "owner" && role !== "member") {
    console.error("Role must be owner or member.");
    process.exit(1);
  }
  if (process.env.ADMIN_BOOTSTRAP_ALLOWED === "true") {
    console.warn("Note: ADMIN_BOOTSTRAP_ALLOWED=true — ensure this is an operator run, not web runtime.");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  // Look up existing user by exact email
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) {
    console.error("Failed to list users:", error.message);
    process.exit(1);
  }
  const user = data.users.find(
    (u) => (u.email || "").toLowerCase() === email
  );
  if (!user) {
    console.error(`No Supabase Auth user found for ${email}. Invite/create the user first, then rerun.`);
    process.exit(1);
  }
  if (!user.email_confirmed_at) {
    console.error(`User ${email} exists but email is not verified. Verify first, then rerun.`);
    process.exit(1);
  }
  const { error: upsertError } = await admin.from("admin_memberships").upsert(
    { user_id: user.id, role, is_active: true },
    { onConflict: "user_id" }
  );
  if (upsertError) {
    console.error("Membership upsert failed:", upsertError.message);
    process.exit(1);
  }
  console.log(`OK: ${email} is now an active ${role}. (No credentials printed.)`);
}

main().catch((e) => {
  console.error("Bootstrap failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
