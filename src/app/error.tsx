"use client";

import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="relative overflow-hidden border-b border-[var(--line)] bg-[var(--surface)]">
      <div aria-hidden className="grid-backdrop pointer-events-none absolute inset-0 opacity-60" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-32 h-[420px] w-[420px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(42,60,240,0.10), transparent 68%)" }}
      />
      <div className="container-studio relative grid gap-12 pt-16 pb-20 md:grid-cols-[1.15fr_0.85fr] md:items-start md:pt-24 md:pb-28">
        <div>
          <p className="meta text-[var(--warn)]">Error · unexpected</p>
          <h1 className="display-h1 mt-5 max-w-[22ch] text-balance">Something went wrong.</h1>
          <p className="lead mt-5 max-w-[52ch]">
            Please try again. If the problem persists, contact us with the reference of your enquiry if
            you have one.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => reset()} className="btn-primary">
              Try again
            </button>
            <Link href="/" className="btn-secondary">
              Home
            </Link>
          </div>
        </div>

        <div className="w-full border-t border-[var(--line)]">
          <p className="meta py-3">What you can do</p>
          <ul className="text-[14.5px] leading-relaxed text-[var(--ink-2)]">
            <li className="border-t border-[var(--line)] py-3.5">
              Retry the page with the button above.
            </li>
            <li className="border-t border-[var(--line)] py-3.5">
              <Link href="/" className="link-inline">
                Return to the homepage
              </Link>{" "}
              and start again from there.
            </li>
            <li className="border-t border-[var(--line)] py-3.5">
              <Link href="/contact" className="link-inline">
                Contact the studio
              </Link>{" "}
              with your enquiry reference, if you have one.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
