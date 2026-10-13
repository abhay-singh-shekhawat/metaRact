"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="container-studio max-w-xl pt-20 text-center">
          <h1 className="text-3xl font-bold">Something went wrong</h1>
          <button type="button" onClick={() => reset()} className="btn-primary mt-6">
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
