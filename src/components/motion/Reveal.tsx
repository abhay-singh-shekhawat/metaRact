"use client";

import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Scroll reveal (DESIGN.md §6). One shared IntersectionObserver for the whole
 * page, unobserve-after-fire, no scroll listeners. Under
 * `prefers-reduced-motion: reduce` the stylesheet keeps `.reveal` fully visible,
 * so nothing is hidden from anyone.
 */
let sharedObserver: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === "undefined") return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          sharedObserver?.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    );
  }
  return sharedObserver;
}

export type RevealTag = "div" | "li" | "article" | "section" | "header" | "aside" | "span";

export function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  /** Stagger in ms. Keep totals under ~400ms. */
  delay?: number;
  className?: string;
  as?: RevealTag;
}) {
  const nodeRef = useRef<HTMLElement | null>(null);

  const attach = useCallback((node: HTMLElement | null) => {
    nodeRef.current = node;
  }, []);

  useEffect(() => {
    const el = nodeRef.current;
    if (!el) return;
    const observer = getObserver();
    if (!observer) {
      el.classList.add("is-in");
      return;
    }
    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  const style = delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined;
  const props = { ref: attach, className: `reveal ${className}`.trim(), style };

  // Explicit elements rather than a dynamic tag: keeps the ref type-safe and
  // lets list items stay inside their list (valid HTML, correct a11y tree).
  switch (as) {
    case "li":
      return <li {...props}>{children}</li>;
    case "article":
      return <article {...props}>{children}</article>;
    case "section":
      return <section {...props}>{children}</section>;
    case "header":
      return <header {...props}>{children}</header>;
    case "aside":
      return <aside {...props}>{children}</aside>;
    case "span":
      return <span {...props}>{children}</span>;
    default:
      return <div {...props}>{children}</div>;
  }
}
