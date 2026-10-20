import Link from "next/link";
import type { ReactNode } from "react";

/* ---------------------------------------------------------------------------
 * Presentation primitives — DESIGN.md §5.
 * Server-safe. Anything needing pointer/observer behaviour is its own client
 * leaf (Reveal, HeroObject, ProcessRail, ServiceTilt, Header).
 * ------------------------------------------------------------------------- */

/** Page band with the studio's vertical rhythm and a hairline top rule. */
export function Section({
  children,
  className = "",
  tone = "paper",
  id,
}: {
  children: ReactNode;
  className?: string;
  tone?: "paper" | "surface" | "plain";
  id?: string;
}) {
  const tones = {
    paper: "band",
    surface: "band bg-[var(--surface)]",
    plain: "",
  } as const;
  return (
    <section id={id} className={`${tones[tone]} py-20 md:py-28 ${className}`}>
      {children}
    </section>
  );
}

/** The one small label allowed above a heading. Use sparingly (one per 3 sections). */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

/**
 * Section header. Single message: heading, optional lead, optional right-hand
 * action. Never a split headline/explainer (DESIGN.md §2).
 */
export function SectionHeading({
  title,
  lead,
  eyebrow,
  action,
  className = "",
}: {
  title: ReactNode;
  lead?: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-x-8 gap-y-4 ${className}`}>
      <div className="max-w-[46ch]">
        {eyebrow ? <div className="mb-4">{eyebrow}</div> : null}
        <h2 className="display-h2 text-balance">{title}</h2>
        {lead ? <p className="mt-4 text-[15.5px] leading-relaxed text-[var(--ink-2)]">{lead}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export interface HeroMeta {
  k: string;
  v: string;
}

/**
 * Chapter opener for every non-home route. Left: the page's message.
 * Right: a page-specific spec rail (mono labels over hairlines) — never a
 * repeated marketing card.
 */
export function PageHero({
  title,
  lead,
  cta,
  eyebrow,
  folio,
  meta,
}: {
  title: string;
  lead: string;
  cta?: ReactNode;
  eyebrow?: ReactNode;
  folio?: string;
  meta?: HeroMeta[];
}) {
  const hasAside = Boolean(meta && meta.length > 0);
  return (
    <header className="relative overflow-hidden border-b border-[var(--line)] bg-[var(--surface)]">
      <div aria-hidden className="grid-backdrop pointer-events-none absolute inset-0 opacity-70" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-32 h-[420px] w-[420px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(42,60,240,0.10), transparent 68%)" }}
      />
      <div
        className={`container-studio relative grid gap-10 pt-14 pb-16 md:pt-20 md:pb-20 ${
          hasAside ? "md:grid-cols-[1.15fr_0.85fr] md:items-end" : ""
        }`}
      >
        <div>
          {eyebrow ? <div className="mb-5">{eyebrow}</div> : null}
          <h1 className="display-h1 max-w-[24ch] text-balance">{title}</h1>
          <p className="lead mt-5 max-w-[58ch]">{lead}</p>
          {cta ? <div className="mt-7 flex flex-wrap gap-3">{cta}</div> : null}
        </div>
        {hasAside ? (
          <dl className="grid content-end gap-0 border-t border-[var(--line)]">
            {folio ? (
              <div className="flex items-baseline justify-between gap-6 border-b border-[var(--line)] py-3">
                <dt className="meta">File</dt>
                <dd className="meta text-[var(--ink)]">{folio}</dd>
              </div>
            ) : null}
            {meta!.map((m) => (
              <div key={m.k} className="flex items-baseline justify-between gap-6 border-b border-[var(--line)] py-3">
                <dt className="meta">{m.k}</dt>
                <dd className="max-w-[30ch] text-right text-[14px] font-medium text-[var(--ink)]">{m.v}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </header>
  );
}

export function Rule({ className = "" }: { className?: string }) {
  return <hr className={`rule ${className}`} />;
}

export function Card({
  children,
  className = "",
  pad = true,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return <div className={`card ${pad ? "p-6" : ""} ${className}`}>{children}</div>;
}

export function Panel({
  children,
  className = "",
  ink = false,
}: {
  children: ReactNode;
  className?: string;
  ink?: boolean;
}) {
  return <div className={`${ink ? "panel-ink" : "panel"} ${className}`}>{children}</div>;
}

export function Chip({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`chip ${className}`}>{children}</span>;
}

/** Small inline mark used beside verified/required facts. Geometric only. */
export function Tick({ tone = "ok" }: { tone?: "ok" | "muted" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="mt-[3px] h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke={tone === "ok" ? "var(--ok)" : "var(--ink-3)"}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 8.5 6 12l7.5-8" />
    </svg>
  );
}

export function Dash() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="mt-[8px] h-3 w-3 shrink-0" stroke="var(--ink-3)" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 8h10" />
    </svg>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
  target,
  rel,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "accent" | "onInk";
  className?: string;
  target?: string;
  rel?: string;
}) {
  const styles = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    accent: "btn-accent",
    onInk: "btn-onink",
  } as const;
  return (
    <Link href={href} className={`${styles[variant]} ${className}`} target={target} rel={rel}>
      {children}
    </Link>
  );
}

/** Big number + mono label, used for real (never invented) counts. */
export function Stat({
  value,
  label,
  href,
}: {
  value: ReactNode;
  label: string;
  href?: string;
}) {
  const body = (
    <>
      <span className="display-h2 block tabular-nums">{value}</span>
      <span className="meta mt-1 block">{label}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="surface-link group p-6">
        {body}
      </Link>
    );
  }
  return <div className="panel p-6">{body}</div>;
}
