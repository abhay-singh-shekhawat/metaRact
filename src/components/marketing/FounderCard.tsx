"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { Founder } from "@/config/team";

/* ---------------------------------------------------------------------------
 * One founder on the bench.
 *
 * The pointer moves the card in three dimensions: the shell tilts, the avatar
 * sits 24px in front of the name, and the links 6px behind it, so the parallax
 * is real rather than a faked image shift. A single rAF-throttled listener
 * writes CSS custom properties straight to the node — no React state, no
 * re-render per pointer event.
 *
 * Depth is granted only to fine pointers with motion allowed. Everything a
 * visitor needs — name, role, both profiles — is visible before any of that
 * runs, so touch, keyboard, reduced-motion, and no-JS all get a complete card.
 * ------------------------------------------------------------------------- */

const MAX_TILT = 5;
const LIFT = -3;

function ArrowUpRight() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden focusable="false">
      <path
        d="M2.6 7.4 7.4 2.6M3.7 2.6h3.7v3.7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const profileLinks = [
  { key: "linkedin", label: "LinkedIn" },
  { key: "github", label: "GitHub" },
] as const;

export function FounderCard({ founder, index }: { founder: Founder; index: number }) {
  const cardRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let rx = 0;
    let ry = 0;
    let lift = 0;

    const paint = () => {
      frame = 0;
      el.style.setProperty("--fc-rx", `${rx.toFixed(2)}deg`);
      el.style.setProperty("--fc-ry", `${ry.toFixed(2)}deg`);
      el.style.setProperty("--fc-lift", `${lift}px`);
    };

    const queue = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = (event.clientX - rect.left) / rect.width;
      const ny = (event.clientY - rect.top) / rect.height;
      rx = (0.5 - ny) * MAX_TILT * 2;
      ry = (nx - 0.5) * MAX_TILT * 2;
      lift = LIFT;
      queue();
    };

    const reset = () => {
      rx = 0;
      ry = 0;
      lift = 0;
      queue();
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", reset);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <li ref={cardRef} className="founder-card border-t border-[var(--line)] pt-5">
      <span aria-hidden className="founder-index meta absolute right-0 top-2 tabular-nums">
        {String(index).padStart(2, "0")}
      </span>

      <div className="flex items-center gap-5">
        <span className="founder-avatar founder-ring size-16 shrink-0 overflow-hidden rounded-full lg:size-[84px]">
          <Image
            src={founder.photo.src}
            alt=""
            width={founder.photo.width}
            height={founder.photo.height}
            sizes="(min-width: 1024px) 84px, 64px"
            className="h-full w-full object-cover"
          />
        </span>
        <div className="founder-copy min-w-0">
          <h3 className="display-h3 text-[21px]">{founder.name}</h3>
          <p className="meta mt-1">{founder.role}</p>
        </div>
      </div>

      <ul className="founder-links mt-6 flex flex-wrap items-center gap-2">
        {profileLinks.map(({ key, label }) => (
          <li key={key}>
            <a
              href={founder[key]}
              target="_blank"
              rel="noopener noreferrer"
              className="founder-link"
            >
              {label}
              <ArrowUpRight />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </li>
  );
}
