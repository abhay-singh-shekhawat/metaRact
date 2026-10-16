"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { primaryNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";

export function Header() {
  const [open, setOpen] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const pathname = usePathname();
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Condense the bar once the page has scrolled past it — observed, not
  // scrolled-listened (DESIGN.md §6).
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setCondensed(!entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Sheet behaviour: lock scroll, move focus into the panel, and close on Escape
  // or browser back/forward (every in-sheet link closes the sheet on click).
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = sheetRef.current?.querySelector<HTMLElement>("a,button");
    first?.focus();

    const close = () => setOpen(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      close();
      triggerRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("popstate", close);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", close);
    };
  }, [open]);

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <span ref={sentinelRef} aria-hidden className="pointer-events-none absolute left-0 top-0 h-16 w-px" />
      <header
        className={`sticky top-0 z-40 border-b bg-[var(--surface)]/85 backdrop-blur-md transition-[box-shadow,border-color] duration-300 ${
          condensed ? "border-[var(--line)] shadow-[0_1px_0_rgba(11,15,23,0.04),0_18px_30px_-30px_rgba(11,15,23,0.5)]" : "border-transparent"
        }`}
      >
        <div
          className={`container-studio flex items-center justify-between gap-6 transition-[height] duration-300 ${
            condensed ? "h-[60px]" : "h-[72px]"
          }`}
        >
          <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label={`${siteConfig.studioName} home`}>
            <span
              aria-hidden
              className="grid h-8 w-8 place-items-center rounded-[9px] bg-[var(--ink)] text-[14px] font-semibold text-white transition-transform duration-300 group-hover:rotate-[-6deg]"
            >
              {siteConfig.studioName.charAt(0).toUpperCase()}
            </span>
            <span className="hidden font-display text-[15.5px] font-semibold tracking-[-0.02em] sm:block">
              {siteConfig.studioName}
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`relative rounded-md px-3 py-2 text-[14px] font-medium transition-colors ${
                  isActive(item.href)
                    ? "text-[var(--ink)]"
                    : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                }`}
              >
                {item.label}
                <span
                  aria-hidden
                  className={`absolute inset-x-3 -bottom-px h-[2px] origin-left bg-[var(--accent)] transition-transform duration-300 ${
                    isActive(item.href) ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </Link>
            ))}
            <Link
              href="/contact"
              className={`rounded-md px-3 py-2 text-[14px] font-medium transition-colors ${
                isActive("/contact") ? "text-[var(--ink)]" : "text-[var(--ink-2)] hover:text-[var(--ink)]"
              }`}
            >
              Contact
            </Link>
            <Link href="/start-project" className="btn-primary ml-3">
              {siteConfig.primaryCta}
            </Link>
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            <Link href="/start-project" className="btn-primary !min-h-[40px] !px-3.5 !text-[13px]">
              {siteConfig.primaryCta}
            </Link>
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="grid h-10 w-10 place-items-center rounded-[10px] border border-[var(--line-2)] bg-[var(--surface)] text-[var(--ink)]"
            >
              <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 12h14" />}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full bg-[rgba(11,15,23,0.35)] backdrop-blur-[2px]"
          />
          <div
            ref={sheetRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-x-0 top-0 max-h-[100dvh] overflow-y-auto overscroll-contain border-b border-[var(--line)] bg-[var(--surface)] pt-[84px] pb-8 shadow-[0_40px_60px_-40px_rgba(11,15,23,0.6)]"
          >
            <nav aria-label="Mobile" className="container-studio">
              <ul className="border-t border-[var(--line)]">
                {[...primaryNav, { href: "/contact", label: "Contact" }, { href: "/faq", label: "FAQ" }].map((item, i) => (
                  <li key={item.href} className="rise border-b border-[var(--line)]" style={{ animationDelay: `${i * 45}ms` }}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-baseline justify-between gap-4 py-4 font-display text-[22px] font-semibold tracking-[-0.02em]"
                    >
                      {item.label}
                      <span aria-hidden className="meta">{String(i + 1).padStart(2, "0")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/start-project" onClick={() => setOpen(false)} className="btn-primary mt-6 w-full">
                {siteConfig.primaryCta}
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
