"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

function useMounted(): boolean {
  // Gate submits on mount: a pre-hydration native submit would GET the form
  // (credentials in URL query) instead of running the fetch handler.
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function SignInForm({ devMode, supabaseMode }: { devMode: boolean; supabaseMode: boolean }) {
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
      if (supabaseMode) {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
        );
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError("Invalid credentials.");
          return;
        }
        // Membership is enforced server-side; confirm before entering.
        const me = await fetch("/api/admin/session");
        if (!me.ok) {
          await supabase.auth.signOut();
          setError("No active team membership for this account.");
          return;
        }
        router.push("/admin");
      } else {
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
      }
    } finally {
      setLoading(false);
    }
  }

  if (!devMode && !supabaseMode) {
    return (
      <p role="note" className="rounded-[10px] bg-[#FFF8E1] p-3 text-[13.5px] text-[#6b4e00]">
        Sign-in is not configured in this environment. Set Supabase credentials or enable the documented local operator flow.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {devMode && !supabaseMode && (
        <p role="note" className="rounded-[10px] bg-[#FFF8E1] p-3 text-[13.5px] text-[#6b4e00]">
          Development sign-in — use your local operator credentials. Production uses team single sign-on.
        </p>
      )}
      {error && <p ref={alertRef} tabIndex={-1} role="alert" className="rounded-[10px] bg-[#FDECEA] p-3 text-[14px] font-medium text-[#7a1f18]">{error}</p>}
      <div>
        <label htmlFor="email" className="block text-[14px] font-semibold">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="mt-1.5 block w-full rounded-[10px] border border-[var(--line)] px-3.5 py-3 text-[15px]" />
      </div>
      <div>
        <label htmlFor="password" className="block text-[14px] font-semibold">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="mt-1.5 block w-full rounded-[10px] border border-[var(--line)] px-3.5 py-3 text-[15px]" />
      </div>
      <button type="submit" disabled={loading || !mounted} className="inline-flex min-h-[48px] w-full items-center justify-center rounded-[10px] bg-[#151923] px-6 text-[15px] font-semibold text-white disabled:opacity-60">
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
