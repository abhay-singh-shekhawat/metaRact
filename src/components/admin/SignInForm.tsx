"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

function useMounted(): boolean {
  // Gate submits on mount: a pre-hydration native submit would GET the form
  // (credentials in URL query) instead of running the fetch handler.
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function SignInForm({ devNote }: { devNote: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Gate the submit on mount: a pre-hydration native submit would GET the
  // form (credentials in URL query) instead of running the fetch handler.
  const mounted = useMounted();
  const alertRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error) alertRef.current?.focus();
  }, [error]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) router.push("/admin");
      else {
        const d = await res.json().catch(() => ({}));
        setError((d as { error?: string })?.error || "Sign-in failed. Check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {devNote && (
        <p
          role="note"
          className="rounded-[10px] border border-[var(--warn)]/25 bg-[var(--warn-soft)] p-3.5 text-[13.5px] leading-relaxed text-[var(--warn)]"
        >
          Development sign-in — use your local operator credentials.
        </p>
      )}

      {error && (
        <p
          ref={alertRef}
          tabIndex={-1}
          role="alert"
          className="rounded-[10px] border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-3.5 text-[14px] font-medium text-[var(--danger)]"
        >
          {error}
        </p>
      )}

      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="field-input" />
      </div>

      <div>
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field-input" />
      </div>

      <button type="submit" disabled={loading || !mounted} className="btn-primary w-full !min-h-[48px]">
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
