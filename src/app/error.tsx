"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="container-studio max-w-xl pt-20 text-center">
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-[var(--ink-2)]">
        Please try again. If the problem persists, contact us with the reference
        of your enquiry if you have one.
      </p>
      <button type="button" onClick={() => reset()} className="btn-primary mt-6">
        Try again
      </button>
    </section>
  );
}
