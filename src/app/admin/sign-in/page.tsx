import type { Metadata } from "next";
import { SignInForm } from "@/components/admin/SignInForm";
import { isDevAuthAllowed } from "@/lib/auth/devSession";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function SignInPage() {
  const supabaseMode = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
  const devMode = !supabaseMode && isDevAuthAllowed();
  return (
    <div className="container-studio max-w-[480px] py-16">
      <h1 className="text-2xl font-bold tracking-tight">Team sign-in</h1>
      <p className="mt-2 text-[14.5px] text-[#596273]">
        Founder accounts only — there is no public registration.{" "}
        {supabaseMode ? "Use your Supabase Auth credentials." : ""}
      </p>
      <div className="mt-6 rounded-[16px] border border-[var(--line)] bg-white p-6">
        <SignInForm devMode={devMode} supabaseMode={supabaseMode} />
      </div>
    </div>
  );
}
