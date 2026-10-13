"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { primaryNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-white/95 backdrop-blur">
      <div className="container-studio flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${siteConfig.studioName} home`}>
          <span aria-hidden className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#151923] text-[15px] font-bold text-white">
            {siteConfig.studioName.charAt(0).toUpperCase()}
          </span>
          <span className="hidden text-[15px] font-semibold tracking-tight min-[420px]:block">{siteConfig.studioName}</span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={`rounded-md px-3 py-2 text-[14px] font-medium transition-colors ${
                pathname === item.href ? "text-[#151923] bg-[#F0F3F9]" : "text-[#596273] hover:text-[#151923] hover:bg-[#F0F3F9]"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/start-project"
            className="ml-3 inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-[10px] bg-[#315BE8] px-5 text-[14px] font-semibold text-white transition-all hover:bg-[#2446BE] active:translate-y-[1px]"
          >
            {siteConfig.primaryCta}
          </Link>
        </nav>
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/start-project"
            className="inline-flex min-h-[44px] items-center whitespace-nowrap rounded-[10px] bg-[#315BE8] px-4 text-[14px] font-semibold text-white"
          >
            {siteConfig.primaryCta}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid h-11 w-11 place-items-center rounded-[10px] border border-[var(--line)] bg-white text-xl"
          >
            {open ? "×" : "☰"}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-[var(--line)] bg-white px-5 py-3 lg:hidden">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-2 py-3 text-[15px] font-medium text-[#151923] hover:bg-[#F0F3F9]"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="block rounded-md px-2 py-3 text-[15px] font-medium text-[#596273]"
          >
            Contact
          </Link>
        </nav>
      )}
    </header>
  );
}
