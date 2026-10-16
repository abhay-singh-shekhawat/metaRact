"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { HeroObject } from "@/components/marketing/HeroObject";

/* ---------------------------------------------------------------------------
 * The hero stage (DESIGN.md §2.2, §5).
 *
 * Progressive enhancement, not replacement. The server renders the existing
 * CSS stack; the WebGL drafting object only mounts afterwards, and only when
 * the device can actually afford it. Everything else — small screens, coarse
 * pointers, reduced motion, data-saver, no WebGL — keeps the CSS object, which
 * is why the hero still holds up with JavaScript disabled.
 *
 * The fallback stays in the DOM behind the canvas deliberately: it defines the
 * box (so upgrading costs no layout shift) and it stays in the accessibility
 * tree, where four real documents beat four rasterised sheets.
 * ------------------------------------------------------------------------- */

const DraftingScene = dynamic(() => import("./DraftingScene"), { ssr: false });

const WIDE = "(min-width: 1024px)";
const FINE = "(hover: hover) and (pointer: fine)";
const MOTION = "(prefers-reduced-motion: no-preference)";

function hasWebGL(): boolean {
  try {
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") ?? probe.getContext("webgl");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function savingData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

async function canRunScene(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!window.matchMedia(WIDE).matches) return false;
  if (!window.matchMedia(FINE).matches) return false;
  if (!window.matchMedia(MOTION).matches) return false;
  if (savingData()) return false;
  if (!hasWebGL()) return false;
  // The sheet faces are drawn with the studio's own fonts; wait for them so the
  // object never paints in a fallback face for a frame.
  try {
    await document.fonts.ready;
  } catch {
    /* older engines: paint with whatever is available */
  }
  return true;
}

export function HeroStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  const [blueprint, setBlueprint] = useState(false);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const evaluate = () => {
      void canRunScene().then((ok) => {
        if (!cancelled) setLive(ok);
      });
    };
    evaluate();

    const query = window.matchMedia(WIDE);
    query.addEventListener("change", evaluate);
    return () => {
      cancelled = true;
      query.removeEventListener("change", evaluate);
    };
  }, []);

  // Stop rendering the moment the hero leaves the viewport. The last frame
  // stays on screen, so nothing flickers.
  useEffect(() => {
    const element = stageRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "160px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="hero-stage" data-mode={blueprint ? "blueprint" : "paper"} ref={stageRef}>
      <div aria-hidden className="hero-stage-bg" />
      <div aria-hidden className="hero-stage-grid" />

      <div className={`hero-stage-poster${live ? " is-hidden" : ""}`}>
        <HeroObject />
      </div>

      {live && (
        <div aria-hidden className="hero-stage-scene">
          <DraftingScene blueprint={blueprint} frameloop={inView ? "always" : "demand"} />
        </div>
      )}

      {live && (
        <div className="hero-stage-controls">
          <span className="meta hero-stage-caption">FIG. 01 — SCOPE STACK</span>
          <div className="hero-viewswitch" role="group" aria-label="Object view">
            <button type="button" aria-pressed={!blueprint} onClick={() => setBlueprint(false)}>
              Product
            </button>
            <button type="button" aria-pressed={blueprint} onClick={() => setBlueprint(true)}>
              Blueprint
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
