import "server-only";
import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "digital_services_studio";

declare global {
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

/** True when a MongoDB Atlas connection string is configured. */
export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

function createClientPromise(): Promise<MongoClient> {
  const connectionString = process.env.MONGODB_URI;
  if (!connectionString) {
    throw new Error(
      "Missing MONGODB_URI. Configure MongoDB Atlas credentials or run without a database for local file-store mode."
    );
  }
  const client = new MongoClient(connectionString, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 15000,
    maxPoolSize: 10,
  });
  return client.connect();
}

function clientPromise(): Promise<MongoClient> {
  if (!globalThis.__mongoClientPromise) {
    globalThis.__mongoClientPromise = createClientPromise();
  }
  return globalThis.__mongoClientPromise;
}

/**
 * Shared database handle. The underlying client is created once and reused
 * across requests and development hot reloads via a global cache.
 */
export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(dbName);
}

/** The shared client, for the one caller that needs a session (transactions). */
export async function getClient(): Promise<MongoClient> {
  return clientPromise();
}

/** Lightweight connectivity probe for readiness checks. Never throws. */
export async function pingDb(): Promise<boolean> {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}

export function getDbName(): string {
  return dbName;
}

export { uri as mongoUri };
