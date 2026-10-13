export function requestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function sanitizeForLog(value: unknown): string {
  const s = String(value ?? "");
  return s.replace(/[\r\n]+/g, " ").slice(0, 300);
}

export function logEvent(entry: Record<string, unknown>): void {
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(entry)) {
    if (/email|phone|token|secret|key|note|summary|body/i.test(k)) {
      safe[k] = "[redacted]";
    } else if (typeof v === "string") {
      safe[k] = sanitizeForLog(v);
    } else {
      safe[k] = v;
    }
  }
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...safe }));
}
