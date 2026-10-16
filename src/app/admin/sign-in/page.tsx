import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/admin/SignInForm";
import { isDevAuthAllowed } from "@/lib/auth/devSession";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function SignInPage() {
  // Shown only when no database session is configured: the POST handler
  // authenticates against MongoDB admin users when MONGODB_URI is set,
  // otherwise against the local operator credentials below.
  const devNote = !process.env.MONGODB_URI && isDevAuthAllowed();

  return (
    <div className="relative overflow-hidden border-b border-[var(--line)] bg-[var(--surface)]">
      <div aria-hidden className="grid-backdrop pointer-events-none absolute inset-0 opacity-60" />
      <div className="container-studio relative grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1fr_minmax(380px,440px)]">
        <div>
          <p className="eyebrow">Console</p>
          <h1 className="display-h1 mt-5 max-w-[20ch] text-balance">Team sign-in</h1>
          <p className="lead mt-4 max-w-[46ch]">
            Founder accounts only — there is no public registration, and no customer data is reachable from this
            console without a session.
          </p>
          <Link href="/" className="link-inline mt-6 inline-block text-[14px]">
            ← Back to {siteConfig.studioName}
          </Link>
        </div>

        <div className="card p-6 md:p-7">
          <SignInForm devNote={devNote} />
        </div>
      </div>
    </div>
  );
}
