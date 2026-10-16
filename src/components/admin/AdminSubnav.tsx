"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/settings", label: "Settings" },
];

/**
 * The console gets its own sub-navigation rather than a different shell
 * (DESIGN.md §10). Hidden on the sign-in screen, which has no session yet.
 */
export function AdminSubnav() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin/sign-in")) return null;

  return (
    <nav aria-label="Console" className="admin-subnav sticky top-[60px] z-20 border-b border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur">
      <div className="container-studio flex flex-wrap items-center gap-2 py-2.5">
        <span className="meta mr-1">Console</span>
        {LINKS.map((l) => {
          const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full border px-3.5 py-1.5 text-[13.5px] font-medium transition-colors ${
                active
                  ? "border-[var(--line)] text-[var(--ink)]"
                  : "border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
