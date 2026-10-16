"use client";

import { useEffect, useRef } from "react";

/* ---------------------------------------------------------------------------
 * The signature dimensional object (DESIGN.md §2, §5).
 * It is not decoration: it renders the exact sequence the studio sells —
 * Brief -> Scope -> Quote -> Handover — as a stack of spec sheets with real
 * depth. Pointer tilt is desktop + fine-pointer only; every other environment
 * gets the same content as a flat, readable stack.
 * ------------------------------------------------------------------------- */

const STEPS = [
  { n: "01", label: "Brief", k: "What you send", v: "Two paragraphs in plain language — no tech knowledge required." },
  { n: "02", label: "Scope", k: "What we write", v: "Deliverables, exclusions and assumptions, agreed in writing." },
  { n: "03", label: "Quote", k: "What it costs", v: "Priced by a human after the scope, never before it." },
  { n: "04", label: "Handover", k: "What you keep", v: "Source, design files or exports — whatever the quote promised." },
] as const;

const BASE_RX = 5;
const BASE_RY = -13;

function useTilt(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let targetX = BASE_RX;
    let targetY = BASE_RY;

    const apply = () => {
      frame = 0;
      el.style.setProperty("--rx", `${targetX.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${targetY.toFixed(2)}deg`);
    };

    const scene = el.parentElement;
    const onMove = (event: PointerEvent) => {
      if (!scene) return;
      const rect = scene.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      targetY = BASE_RY + (px - 0.5) * 12;
      targetX = BASE_RX - (py - 0.5) * 12;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const reset = () => {
      targetX = BASE_RX;
      targetY = BASE_RY;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    scene?.addEventListener("pointermove", onMove);
    scene?.addEventListener("pointerleave", reset);
    return () => {
      scene?.removeEventListener("pointermove", onMove);
      scene?.removeEventListener("pointerleave", reset);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref]);
}

export function HeroObject() {
  const innerRef = useRef<HTMLDivElement>(null);
  useTilt(innerRef);

  return (
    <div>
      {/* Desktop / fine pointer: the dimensional stack */}
      <div className="scene relative hidden px-2 py-6 lg:block">
        <div ref={innerRef} className="scene-inner relative aspect-[6/5] w-full">
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className="plane"
              style={{
                transform: `translate3d(${i * 18}px, ${i * -18}px, ${i * -26}px)`,
                zIndex: 10 - i,
              }}
            >
              {i === 0 ? (
                <div className="flex h-full flex-col p-6">
                  <div className="flex items-center justify-between gap-4">
                    <span className="meta text-[var(--accent)]">
                      {step.n} / {step.label.toUpperCase()}
                    </span>
                    <span className="chip">REQ-2026-000042</span>
                  </div>
                  <p className="display-h3 mt-5 text-[19px]">Landing page for a new clinic</p>
                  <p className="meta mt-6 mb-2">What follows your brief</p>
                  <dl className="grid gap-0 border-t border-[var(--line)]">
                    {STEPS.slice(1).map((row) => (
                      <div key={row.n} className="grid grid-cols-[86px_1fr] items-start gap-4 border-b border-[var(--line)] py-3">
                        <dt className="meta pt-[3px]">{row.label}</dt>
                        <dd className="text-[13.5px] leading-snug text-[var(--ink-2)]">{row.v}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="meta mt-auto pt-4">Human-reviewed · one reply, from a person</p>
                </div>
              ) : (
                // The exposed right edge of each deeper document. Decorative only:
                // the step names are already legible on the sheet and in the list.
                <span
                  aria-hidden
                  className="absolute right-0 top-0 h-full w-[3px] rounded-r-[16px]"
                  style={{ background: "var(--accent)", opacity: 0.5 - i * 0.13 }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Everywhere else: the same four documents, flat and legible */}
      <ol className="grid gap-3 sm:grid-cols-2 lg:hidden">
        {STEPS.map((step) => (
          <li key={step.n} className="card p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="display-h3 text-[15px]">{step.label}</span>
              <span className="meta text-[var(--accent)]">{step.n}</span>
            </div>
            <p className="mt-1.5 text-[13.5px] leading-snug text-[var(--ink-2)]">{step.v}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
