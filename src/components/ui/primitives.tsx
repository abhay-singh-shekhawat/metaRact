import Link from "next/link";
import type { ReactNode } from "react";

export function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`py-14 md:py-20 ${className}`}>{children}</section>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#315BE8]">{children}</p>
  );
}

export function PageHero({
  title,
  lead,
  cta,
}: {
  title: string;
  lead: string;
  cta?: ReactNode;
}) {
  return (
    <div className="border-b border-[var(--line)] bg-white">
      <div className="container-studio grid gap-8 py-12 md:grid-cols-[1.4fr_1fr] md:items-end md:py-16">
        <div>
          <h1 className="max-w-[22ch] text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-[62ch] text-[16px] leading-relaxed text-[#596273]">{lead}</p>
          {cta && <div className="mt-6 flex flex-wrap gap-3">{cta}</div>}
        </div>
        <div className="hidden md:block" aria-hidden>
          <div className="rounded-[16px] border border-[var(--line)] bg-[#F0F3F9] p-6">
            <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-[#596273]">How we work</p>
            <ol className="mt-3 space-y-2 text-[14px] font-medium">
              {["Brief →", "Scope in writing →", "Human quote →", "Build & review →", "Handover"].map((s) => (
                <li key={s} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#315BE8]" />
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "dark" | "ghost";
}) {
  const styles =
    variant === "primary"
      ? "bg-[#315BE8] text-white hover:bg-[#2446BE]"
      : variant === "dark"
        ? "bg-[#151923] text-white hover:bg-black"
        : "border border-[var(--line)] bg-white text-[#151923] hover:bg-[#F0F3F9]";
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[44px] items-center justify-center rounded-[10px] px-5 text-[14px] font-semibold transition-all active:translate-y-[1px] ${styles}`}
    >
      {children}
    </Link>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[16px] border border-[var(--line)] bg-white p-6 ${className}`}>{children}</div>
  );
}
