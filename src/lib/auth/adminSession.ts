import "server-only";
import { cookies } from "next/headers";
import { randomBytes, createHash } from "crypto";
import { ObjectId } from "mongodb";
import { getDb, isMongoConfigured } from "@/lib/mongodb/client";
import {
  COLLECTIONS,
  ensureIndexes,
  type AdminSessionDoc,
} from "@/lib/mongodb/collections";

export const ADMIN_COOKIE = "studio_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function isMongoToken(value: string): boolean {
  return /^[0-9a-f]{64}$/i.test(value);
}

/** Create a stateful admin session in MongoDB and set the session cookie. */
export async function createMongoSession(
  adminUserId: ObjectId,
  email: string,
  role: "owner" | "member"
): Promise<void> {
  const db = await getDb();
  await ensureIndexes(db);
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const doc: Omit<AdminSessionDoc, "_id"> = {
    tokenHash: hashToken(token),
    adminUserId,
    email,
    role,
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
    createdAt: now.toISOString(),
    revokedAt: null,
  };
  await db.collection(COLLECTIONS.adminSessions).insertOne(doc);
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

/** Resolve a Mongo-backed session token to its admin identity, or null. */
export async function getMongoSessionAdmin(): Promise<{
  email: string;
  role: "owner" | "member";
  userId: string;
} | null> {
  if (!isMongoConfigured()) return null;
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token || !isMongoToken(token)) return null;
  try {
    const db = await getDb();
    await ensureIndexes(db);
    const session = await db
      .collection<AdminSessionDoc>(COLLECTIONS.adminSessions)
      .findOne({ tokenHash: hashToken(token), revokedAt: null });
    if (!session) return null;
    if (session.expiresAt.getTime() <= Date.now()) return null;
    const user = await db
      .collection(COLLECTIONS.adminUsers)
      .findOne(
        { _id: session.adminUserId },
        { projection: { email: 1, role: 1, isActive: 1 } }
      );
    const row = user as { email: string; role: string; isActive: boolean } | null;
    if (!row?.isActive || (row.role !== "owner" && row.role !== "member")) return null;
    return {
      email: row.email,
      role: row.role as "owner" | "member",
      userId: session.adminUserId.toHexString(),
    };
  } catch {
    return null;
  }
}

/** Revoke the current Mongo session (if any) and clear the cookie. */
export async function revokeMongoSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (token && isMongoToken(token) && isMongoConfigured()) {
    try {
      const db = await getDb();
      await db
        .collection(COLLECTIONS.adminSessions)
        .updateOne(
          { tokenHash: hashToken(token), revokedAt: null },
          { $set: { revokedAt: new Date().toISOString() } }
        );
    } catch {
      /* revocation is best-effort; cookie is still cleared below */
    }
  }
  store.delete(ADMIN_COOKIE);
}
