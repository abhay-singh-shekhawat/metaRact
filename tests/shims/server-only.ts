// Test shim for the `server-only` package. Outside the Next.js runtime the
// real package throws on import, so Vitest maps it to this no-op module.
// Production bundles keep the real guard.
export {};
