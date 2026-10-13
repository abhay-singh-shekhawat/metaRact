import type { Metadata } from "next";
import { SignInForm } from "@/components/admin/SignInForm";
import { isDevAuthAllowed } from "@/lib/auth/devSession";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function SignInPage() {
  // Shown only when no database session is configured: the POST handler
  // authenticates against MongoDB admin users when MONGODB_URI is set,
  // otherwise against the local operator credentials below.
  const devNote = !process.env.MONGODB_URI && isDevAuthAllowed();
  return (
    <div className="container-studio max-w-[480px] py-16">
      <h1 className="text-2xl font-bold tracking-tight">Team sign-in</h1>
      <p className="mt-2 text-[14.5px] text-[#596273]">
        Founder accounts only — there is no public registration.{" "}
      </p>
      <div className="mt-6 rounded-[16px] border border-[var(--line)] bg-white p-6">
        <SignInForm devNote={devNote} />
      </div>
    </div>
  );
}
