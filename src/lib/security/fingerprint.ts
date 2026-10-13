import { createHash } from "crypto";

export function canonicalize(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map((v) => canonicalize(v)).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries
    .map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`)
    .join(",")}}`;
}

export function payloadFingerprint(payload: Record<string, unknown>): string {
  const rest = { ...payload };
  delete rest.turnstileToken;
  delete rest.website;
  return createHash("sha256").update(canonicalize(rest)).digest("hex");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateReference(year: number, seq: number): string {
  return `REQ-${year}-${String(seq).padStart(6, "0")}`;
}
