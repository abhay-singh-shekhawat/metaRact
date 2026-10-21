"use client";

import { useEffect, useRef } from "react";

/**
 * Cloudflare Turnstile, explicit rendering mode.
 *
 * `render=explicit` is required here because the form is a client component that
 * may mount after the page has loaded. The widget is rendered into the container
 * below once the API is ready; the integration never calls `render()` twice for
 * the same container.
 */

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const LOAD_TIMEOUT_MS = 15_000;

type TurnstileOptions = {
  sitekey: string;
  theme?: "auto" | "light" | "dark";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "timeout-callback"?: () => void;
  "error-callback"?: (errorCode?: string) => void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
  ready?: (callback: () => void) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function waitForApi(): Promise<TurnstileApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("turnstile_unavailable"));
  }
  if (window.turnstile) return Promise.resolve(window.turnstile);

  return new Promise((resolve, reject) => {
    let settled = false;
    const existing =
      (document.getElementById(SCRIPT_ID) as HTMLScriptElement | null) ??
      document.querySelector<HTMLScriptElement>('script[src*="challenges.cloudflare.com/turnstile"]');
    const script = existing ?? document.createElement("script");

    const cleanup = () => {
      clearTimeout(timer);
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };

    const succeed = () => {
      if (settled) return;
      const api = window.turnstile;
      if (!api) return;
      settled = true;
      cleanup();
      resolve(api);
    };

    const fail = () => {
      if (settled) return;
      settled = true;
      cleanup();
      // A failed script is removed so a later retry can load it again instead of
      // attaching another listener to an element that will never fire `load`.
      script.remove();
      reject(new Error("turnstile_load_failed"));
    };

    function onLoad() {
      // Some browsers fire `load` a tick before the global is assigned.
      if (window.turnstile) succeed();
      else setTimeout(succeed, 0);
    }

    function onError() {
      fail();
    }

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);
    const timer = setTimeout(fail, LOAD_TIMEOUT_MS);

    if (!existing) {
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.dataset.turnstile = "";
      document.head.appendChild(script);
    } else if (window.turnstile) {
      succeed();
    }
  });
}

/** Load the Turnstile script once per page and resolve when the API is ready. */
function loadTurnstileApi(): Promise<TurnstileApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("turnstile_unavailable"));
  }
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = waitForApi().catch((error: unknown) => {
      scriptPromise = null;
      throw error;
    });
  }
  return scriptPromise;
}

export interface TurnstileWidgetProps {
  siteKey: string;
  /** Increment to discard the current widget and render a fresh challenge. */
  resetKey?: number;
  onToken: (token: string) => void;
  onLoading?: () => void;
  onExpired?: () => void;
  onError?: () => void;
}

export function TurnstileWidget({
  siteKey,
  resetKey = 0,
  onToken,
  onLoading,
  onExpired,
  onError,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const callbacksRef = useRef({ onToken, onLoading, onExpired, onError });

  useEffect(() => {
    callbacksRef.current = { onToken, onLoading, onExpired, onError };
  });

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;
    const callbacks = callbacksRef.current;
    callbacks.onLoading?.();

    loadTurnstileApi()
      .then((api) => {
        if (cancelled || !containerRef.current || widgetIdRef.current) return;

        const render = () => {
          if (cancelled || !containerRef.current || widgetIdRef.current) return;
          try {
            widgetIdRef.current = api.render(containerRef.current, {
              sitekey: siteKey,
              callback: (token: string) => {
                if (!cancelled) callbacksRef.current.onToken(token);
              },
              "expired-callback": () => {
                if (!cancelled) callbacksRef.current.onExpired?.();
              },
              "timeout-callback": () => {
                if (!cancelled) callbacksRef.current.onExpired?.();
              },
              "error-callback": () => {
                if (!cancelled) callbacksRef.current.onError?.();
              },
            });
          } catch {
            if (!cancelled) callbacksRef.current.onError?.();
          }
        };

        // `ready()` is the supported way to wait for the explicit-rendering API.
        // The fallback keeps the integration compatible with script stubs/proxies
        // that expose render/reset/remove but not ready().
        if (typeof api.ready === "function") api.ready(render);
        else render();
      })
      .catch(() => {
        if (!cancelled) callbacksRef.current.onError?.();
      });

    return () => {
      cancelled = true;
      const widgetId = widgetIdRef.current;
      widgetIdRef.current = null;
      if (widgetId && typeof window !== "undefined" && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          // The widget may already have been removed by a navigation.
        }
      }
    };
  }, [siteKey, resetKey]);

  return <div ref={containerRef} data-turnstile-widget="" className="min-h-[65px]" />;
}
