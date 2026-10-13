/**
 * Safe operator script: create or activate an admin user in MongoDB Atlas.
 * Not a web endpoint; never in the browser bundle.
 * Usage: MONGODB_URI=... MONGODB_DB_NAME=... pnpm tsx scripts/bootstrap-admin.ts user@example.com 'a-strong-password' [owner|member]
 */
async function main() {
  const email = (process.argv[2] || "").trim().toLowerCase();
  const password = process.argv[3] || "";
  const role = (process.argv[4] || "owner").trim();
  if (!email || !email.includes("@")) {
    console.error("Usage: bootstrap-admin.ts <email> <password> [owner|member]");
    process.exit(1);
  }
  if (!password || password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }
  if (role !== "owner" && role !== "member") {
    console.error("Role must be owner or member.");
    process.exit(1);
  }
  if (process.env.ADMIN_BOOTSTRAP_ALLOWED === "true") {
    console.warn("Note: ADMIN_BOOTSTRAP_ALLOWED=true — ensure this is an operator run, not web runtime.");
  }
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI.");
    process.exit(1);
  }
  const { getDb } = await import("../src/lib/mongodb/client");
  const { COLLECTIONS, ensureIndexes } = await import("../src/lib/mongodb/collections");
  const { hashPassword } = await import("../src/lib/auth/password");
  const db = await getDb();
  await ensureIndexes(db);
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();
  await db.collection(COLLECTIONS.adminUsers).updateOne(
    { email },
    {
      $set: { role, isActive: true },
      $setOnInsert: {
        passwordHash,
        createdAt: now,
        createdBy: null,
        lastLoginAt: null,
      },
    },
    { upsert: true }
  );
  // Rotate the password hash on every bootstrap run so a re-run resets access.
  await db
    .collection(COLLECTIONS.adminUsers)
    .updateOne({ email }, { $set: { passwordHash } });
  console.log(`OK: ${email} is now an active ${role}. (No credentials printed.)`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Bootstrap failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
