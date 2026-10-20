import "server-only";
import { MongoClient, Db } from "mongodb";
import { isWorkersRuntime } from "@/lib/runtime";

declare global {
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

/**
 * Connection settings.
 *
 * All environment access is deferred to the call site. On Cloudflare Workers
 * `process.env` is only populated once the first request has been received
 * (OpenNext copies the Worker's variables and secrets onto `process.env` at that
 * point), so a module-level constant would capture `undefined`.
 */
function mongoUri(): string | undefined {
  return process.env.MONGODB_URI;
}

/** True when a MongoDB Atlas connection string is configured. */
export function isMongoConfigured(): boolean {
  return Boolean(mongoUri());
}

function createClientPromise(): Promise<MongoClient> {
  const connectionString = mongoUri();
  if (!connectionString) {
    throw new Error(
      "Missing MONGODB_URI. Configure MongoDB Atlas credentials or run without a database for local file-store mode."
    );
  }
  const client = new MongoClient(connectionString, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 15000,
    // A plain Worker cannot keep I/O objects (sockets) alive across requests,
    // so a pool larger than one would only hand out connections the runtime has
    // already invalidated. Node.js keeps its small pool as before.
    maxPoolSize: isWorkersRuntime() ? 1 : 10,
    maxIdleTimeMS: isWorkersRuntime() ? 5000 : undefined,
  });
  return client.connect();
}

/**
 * Per-request client scoping on Cloudflare Workers.
 *
 * The Workers runtime refuses work that continues on I/O started by an earlier
 * request — the second request that touches MongoDB then hangs until the runtime
 * cancels it ("A promise was resolved or rejected from a different request
 * context..."). The pooled singleton used under Node.js is therefore only valid
 * off Workers.
 *
 * `AsyncLocalStorage` would be the natural way to scope it, but the runtime does
 * not implement `enterWith()`, and there is no hook to wrap each request. The
 * OpenNext runtime already keeps one context object per request (the object
 * returned by `getCloudflareContext()`, published on `globalThis` under this
 * symbol); keying a WeakMap by that object gives every request its own client
 * while every `getDb()` call in the same request shares one connection. The
 * WeakMap releases clients with the request.
 *
 * If the context is absent (plain Node.js, or a unit test), the caller falls
 * back to a one-off client rather than sharing state across requests.
 */
const REQUEST_CONTEXT_SYMBOL = Symbol.for("__cloudflare-context__");

/** OpenNext's per-request context, or null outside the Workers runtime. */
function currentRequestContext(): object | null {
  const context = (globalThis as Record<symbol, unknown>)[REQUEST_CONTEXT_SYMBOL];
  return context !== null && typeof context === "object" ? context : null;
}

const clientsByRequest = new WeakMap<object, Promise<MongoClient>>();

function scopedClientPromise(): Promise<MongoClient> {
  const context = currentRequestContext();
  if (!context) return createClientPromise();

  const existing = clientsByRequest.get(context);
  if (existing) return existing;

  const promise = createClientPromise();
  clientsByRequest.set(context, promise);
  return promise;
}

function clientPromise(): Promise<MongoClient> {
  if (isWorkersRuntime()) return scopedClientPromise();
  if (!globalThis.__mongoClientPromise) {
    const promise = createClientPromise();
    globalThis.__mongoClientPromise = promise;
    // A failed connection must not poison the instance for the rest of its
    // life: drop the cache so the next request can retry. (Attaching the
    // handler also keeps the rejection from being reported as unhandled;
    // callers still see the rejection on the original promise.)
    promise.catch(() => {
      if (globalThis.__mongoClientPromise === promise) {
        globalThis.__mongoClientPromise = undefined;
      }
    });
  }
  return globalThis.__mongoClientPromise;
}

export function getDbName(): string {
  return process.env.MONGODB_DB_NAME || "digital_services_studio";
}

/**
 * Shared database handle for the current request. On Node.js the underlying
 * client is created once and reused across requests and dev hot reloads; on
 * Cloudflare Workers it is scoped to the request (see `clientsByRequest`).
 */
export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(getDbName());
}

/** The client for the current request, for the one caller that needs a session. */
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

/** The configured connection string, if any. Never log this value. */
export function getMongoUri(): string | undefined {
  return mongoUri();
}
