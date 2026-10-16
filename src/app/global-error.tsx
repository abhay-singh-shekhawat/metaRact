"use client";

/**
 * Last-resort boundary: the root layout (and therefore the app stylesheet) may
 * not have rendered, so this file must be legible with inline styles alone.
 * App tokens are used when they happen to be available, with plain fallbacks.
 */

const marker: React.CSSProperties = {
  margin: 0,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize: 12,
  letterSpacing: "0.08em",
  color: "var(--ink-3, #6b7488)",
};

const heading: React.CSSProperties = {
  margin: "20px 0 0",
  maxWidth: "22ch",
  fontFamily:
    "var(--font-display, var(--font-geist, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif))",
  fontSize: "clamp(2rem, 3.6vw, 3rem)",
  fontWeight: 600,
  lineHeight: 1.05,
  letterSpacing: "-0.02em",
  color: "var(--ink, #0b0f17)",
};

const body: React.CSSProperties = {
  margin: "16px 0 0",
  maxWidth: "54ch",
  fontSize: 16,
  lineHeight: 1.6,
  color: "var(--ink-2, #434c60)",
};

const primaryButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
  padding: "0.65rem 1.25rem",
  borderRadius: 10,
  border: "1px solid var(--ink, #0b0f17)",
  background: "var(--ink, #0b0f17)",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
  padding: "0.65rem 1.25rem",
  borderRadius: 10,
  border: "1px solid var(--line-2, #c6cdda)",
  background: "var(--surface, #ffffff)",
  color: "var(--ink, #0b0f17)",
  fontSize: 14,
  fontWeight: 600,
  textDecoration: "none",
};

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "var(--canvas, #f0f2f6)",
          color: "var(--ink, #0b0f17)",
          fontFamily:
            "var(--font-geist, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif)",
        }}
      >
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(4rem, 10vw, 8rem) 1.5rem" }}>
          <p style={marker}>Error · unexpected</p>
          <h1 style={heading}>Something went wrong.</h1>
          <p style={body}>
            The page could not be rendered. Please try again. If the problem persists, come back in a
            moment or start again from the homepage.
          </p>
          <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 12 }}>
            <button type="button" onClick={() => reset()} style={primaryButton}>
              Try again
            </button>
            {/* A plain anchor is deliberate: this is the last-resort boundary and
                must hard-navigate even if the router or app bundle never loaded. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={secondaryLink}>
              Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
