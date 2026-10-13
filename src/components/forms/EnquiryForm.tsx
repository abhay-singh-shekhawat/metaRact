"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { enabledServices } from "@/config/services";
import { siteConfig } from "@/config/site";

interface FieldErrors {
  [k: string]: string;
}

const BUDGETS: [string, string][] = [
  ["under_10000", "Under ₹10,000"],
  ["10000_30000", "₹10,000 – ₹30,000"],
  ["30000_75000", "₹30,000 – ₹75,000"],
  ["75000_150000", "₹75,000 – ₹1,50,000"],
  ["over_150000", "Over ₹1,50,000"],
  ["not_sure", "Not sure yet"],
  ["prefer_not_to_say", "Prefer not to say"],
];

const TIMELINES: [string, string][] = [
  ["flexible", "Flexible"],
  ["under_1_week", "Under 1 week"],
  ["2_4_weeks", "2–4 weeks"],
  ["1_3_months", "1–3 months"],
  ["specific_date", "Specific date (preference only)"],
];

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

/** Load Cloudflare Turnstile once; resolves when window.turnstile is ready. */
function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      // If it already loaded, resolve on next tick.
      setTimeout(() => resolve(), 0);
    });
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.setAttribute("data-turnstile", "");
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("turnstile_load_failed"));
    document.head.appendChild(s);
  });
}

const inputCls =
  "mt-1.5 block w-full rounded-[10px] border border-[var(--line)] bg-white px-3.5 py-3 text-[15px] text-[#151923] placeholder:text-[#8a94a8] focus:border-[#315BE8] focus:outline-none";
const labelCls = "block text-[14px] font-semibold text-[#151923]";
const helpCls = "mt-1 text-[13px] text-[#596273]";
const errCls = "mt-1 text-[13.5px] font-medium text-[#b42318]";

export function EnquiryForm({ preselected }: { preselected?: string }) {
  const services = enabledServices();
  const [serviceSlug, setServiceSlug] = useState(
    services.some((s) => s.slug === preselected) ? preselected! : services[0]?.slug ?? ""
  );
  const [idempotencyKey] = useState(newIdempotencyKey);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [successRef, setSuccessRef] = useState<string | null>(null);
  // Gate the submit on mount: a pre-hydration native submit would GET the
  // form (PII in URL query) instead of running the fetch handler.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const isWeb = serviceSlug === "websites-digital-experiences";
  const isSoftware = serviceSlug === "software-applications";
  const isDesign = serviceSlug === "product-design-prototyping";
  const isGraph = serviceSlug === "graphic-brand-design";
  const isAi = serviceSlug === "ai-automation";

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileFailed, setTurnstileFailed] = useState(false);
  const turnstileBoxRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  // Render the Turnstile widget explicitly and capture its token.
  // Without this, the form submits an empty token and the server 403s.
  useEffect(() => {
    if (!turnstileSiteKey) return;
    let cancelled = false;
    loadTurnstileScript()
      .then(() => {
        if (cancelled || !turnstileBoxRef.current || !window.turnstile) return;
        if (turnstileWidgetId.current) return;
        try {
          turnstileWidgetId.current = window.turnstile.render(turnstileBoxRef.current, {
            sitekey: turnstileSiteKey,
            callback: (t: string) => {
              setTurnstileToken(t);
              setTurnstileFailed(false);
            },
            "expired-callback": () => setTurnstileToken(""),
            "error-callback": () => {
              setTurnstileToken("");
              setTurnstileFailed(true);
            },
          });
        } catch {
          setTurnstileFailed(true);
        }
      })
      .catch(() => setTurnstileFailed(true));
    return () => {
      cancelled = true;
      try {
        if (turnstileWidgetId.current && window.turnstile) window.turnstile.remove(turnstileWidgetId.current);
      } catch {
        /* noop */
      }
      turnstileWidgetId.current = null;
    };
  }, [turnstileSiteKey]);

  function resetTurnstile() {
    setTurnstileToken("");
    setTurnstileFailed(false);
    try {
      if (turnstileWidgetId.current && window.turnstile) window.turnstile.reset(turnstileWidgetId.current);
    } catch {
      /* noop */
    }
  }

  function retryTurnstile() {
    // 600* errors are retryable per Cloudflare docs — reset, don't force page reload.
    resetTurnstile();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setTopError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);

    const referenceUrls = String(fd.get("referenceUrls") || "")
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5);

    const serviceDetails: Record<string, unknown> = {};
    fd.forEach((v, k) => {
      if (k.startsWith("sd_")) {
        const key = k.slice(3);
        if (key === "features" || key === "assetTypes" || key === "exportFormats") {
          const all = fd.getAll(k).map(String);
          if (all.length) serviceDetails[key] = all;
        } else if (key === "quantity") {
          const n = Number(v);
          serviceDetails[key] = Number.isFinite(n) && String(v).trim() !== "" ? n : null;
        } else if (String(v).trim() !== "") {
          serviceDetails[key] = String(v);
        }
      }
    });

    const payload = {
      idempotencyKey,
      serviceSlug,
      projectTitle: String(fd.get("projectTitle") || ""),
      projectSummary: String(fd.get("projectSummary") || ""),
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      privacyNoticeAcknowledged: fd.get("privacy") === "on",
      companyOrOrganization: String(fd.get("company") || ""),
      phone: String(fd.get("phone") || ""),
      preferredContactMethod: String(fd.get("contactMethod") || "email"),
      budgetBand: String(fd.get("budget") || "") || undefined,
      timelinePreference: String(fd.get("timeline") || "") || undefined,
      preferredDate: String(fd.get("preferredDate") || "") || undefined,
      referenceUrls,
      serviceDetails,
      turnstileToken: String(fd.get("turnstileToken") || ""),
      website: String(fd.get("website") || ""),
      sourcePath: window.location.pathname,
    };

    try {
      const res = await fetch("/api/public/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccessRef(data?.data?.referenceNumber || "received");
        form.reset();
        resetTurnstile();
        document.getElementById("form-status")?.focus();
        // analytics: aggregate only
        try {
          (window as unknown as { dataLayer?: unknown[] }).dataLayer?.push?.({ event: "project_form_submitted" });
        } catch { /* noop */ }
      } else {
        const fe: FieldErrors = data?.error?.fieldErrors || {};
        setErrors(fe);
        setTopError(data?.error?.message || "Something went wrong. Your request was not confirmed — please check and retry.");
        document.getElementById("form-errors")?.focus();
      }
    } catch {
      setTopError("Network error — your request was not confirmed as received. Please retry with the same form (your text is preserved).");
      document.getElementById("form-errors")?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  const err = (k: string) => errors[k];

  if (successRef) {
    return (
      <div id="form-status" tabIndex={-1} role="status" className="rounded-[16px] border border-[#B9E2C6] bg-[#EDF7F0] p-8" aria-live="polite">
        <p className="text-[19px] font-semibold text-[#14532d]">Request received — thank you.</p>
        <p className="mt-2 text-[15px] text-[#1c5c34]">
          Your reference number is <strong className="font-mono">{successRef}</strong>. This confirms receipt, not acceptance or a quote.
          We&apos;ll review your brief and contact you using the details you shared.
        </p>
        <p className="mt-2 text-[14px] text-[#1c5c34]">Save this reference for any follow-up.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-describedby="form-intro" className="space-y-6">
      <p id="form-intro" className="text-[14.5px] text-[#596273]">
        Plain language is fine. Fields marked * are required. We acknowledge privacy notice version {siteConfig.privacyNoticeVersion}. Please don&apos;t send passwords, keys, or sensitive data.
      </p>

      {topError && (
        <div id="form-errors" tabIndex={-1} role="alert" className="rounded-[12px] border border-[#F1B8B2] bg-[#FDECEA] p-4 text-[14.5px] font-medium text-[#7a1f18]">
          {topError}
        </div>
      )}

      {/* Honeypot */}
      <input type="text" name="website" autoComplete="off" tabIndex={-1} aria-hidden className="hidden" />

      <div>
        <label htmlFor="service" className={labelCls}>Which service fits best? *</label>
        <select id="service" name="service" value={serviceSlug} onChange={(e) => setServiceSlug(e.target.value)} className={inputCls} required>
          {services.map((s) => (
            <option key={s.slug} value={s.slug}>{s.title}</option>
          ))}
        </select>
        {err("serviceSlug") && <p className={errCls}>{err("serviceSlug")}</p>}
        <p aria-live="polite" className="sr-only">Showing follow-up questions for the selected service.</p>
      </div>

      <div>
        <label htmlFor="projectTitle" className={labelCls}>Project title *</label>
        <input id="projectTitle" name="projectTitle" type="text" maxLength={120} required autoComplete="off" placeholder="e.g. Landing page for a new clinic" className={inputCls} aria-invalid={!!err("projectTitle")} aria-describedby={err("projectTitle") ? "e-title" : undefined} />
        {err("projectTitle") ? <p id="e-title" className={errCls}>{err("projectTitle")}</p> : <p className={helpCls}>3–120 characters.</p>}
      </div>

      <div>
        <label htmlFor="projectSummary" className={labelCls}>Project summary *</label>
        <textarea id="projectSummary" name="projectSummary" rows={6} required maxLength={5000} placeholder="What should change, who it's for, and what 'done' looks like…" className={inputCls} aria-invalid={!!err("projectSummary")} />
        {err("projectSummary") ? <p className={errCls}>{err("projectSummary")}</p> : <p className={helpCls}>At least 30 characters. Plain text only.</p>}
      </div>

      {/* Conditional: websites */}
      {isWeb && (
        <fieldset className="rounded-[12px] border border-[var(--line)] bg-white p-5">
          <legend className="px-1 text-[14px] font-semibold">Website details (optional)</legend>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="sd_purpose" className={labelCls}>Site purpose</label>
              <select id="sd_purpose" name="sd_purpose" className={inputCls} defaultValue="">
                <option value="">Not sure yet</option>
                {[["lead_generation","Lead generation"],["informational","Informational"],["portfolio","Portfolio"],["ecommerce","E-commerce"],["content","Content / blog"],["redesign","Redesign"],["other","Other"],["not_sure","Not sure"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="sd_pageCount" className={labelCls}>Pages</label>
              <select id="sd_pageCount" name="sd_pageCount" className={inputCls} defaultValue="">
                <option value="">Not sure yet</option>
                {[["1","1"],["2_5","2–5"],["6_10","6–10"],["10_plus","10+"],["not_sure","Not sure"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="sd_contentReadiness" className={labelCls}>Content readiness</label>
              <select id="sd_contentReadiness" name="sd_contentReadiness" className={inputCls} defaultValue="">
                <option value="">Not sure yet</option>
                {[["ready","Ready"],["mostly_ready","Mostly ready"],["needs_help","Need help"],["not_sure","Not sure"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="sd_existingSiteUrl" className={labelCls}>Existing site URL</label>
              <input id="sd_existingSiteUrl" name="sd_existingSiteUrl" type="url" inputMode="url" placeholder="https://…" className={inputCls} />
            </div>
          </div>
          <fieldset className="mt-4">
            <legend className="text-[14px] font-semibold">Needed features</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[14px]">
              {[["contact_form","Contact form"],["booking","Booking"],["authentication","Login / accounts"],["payments","Payments"],["cms","CMS"],["api_integration","API integration"],["multilingual","Multiple languages"],["other","Other"]].map(([v,l]) => (
                <label key={v} className="flex items-center gap-2 rounded-[8px] border border-[var(--line)] px-3 py-2.5"><input type="checkbox" name="sd_features" value={v} className="h-4 w-4 accent-[#315BE8]" />{l}</label>
              ))}
            </div>
          </fieldset>
        </fieldset>
      )}

      {isSoftware && (
        <fieldset className="rounded-[12px] border border-[var(--line)] bg-white p-5">
          <legend className="px-1 text-[14px] font-semibold">Software details (optional)</legend>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="sd_userTypes" className={labelCls}>Who will use it?</label>
              <select id="sd_userTypes" name="sd_userTypes" className={inputCls} defaultValue="">
                <option value="">Not sure yet</option>
                {[["internal_team","Our team"],["external_customers","Customers"],["both","Both"],["not_sure","Not sure"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="sd_targetEnvironment" className={labelCls}>Where should it run?</label>
              <select id="sd_targetEnvironment" name="sd_targetEnvironment" className={inputCls} defaultValue="">
                <option value="">Not sure yet</option>
                {[["web","Web"],["mobile","Mobile"],["desktop","Desktop"],["internal_tool","Internal tool"],["not_sure","Not sure"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="sd_deploymentNeed" className={labelCls}>Need deployment help?</label>
              <select id="sd_deploymentNeed" name="sd_deploymentNeed" className={inputCls} defaultValue="">
                <option value="">Not sure yet</option>
                {[["yes","Yes"],["no","No"],["not_sure","Not sure"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="sd_maintenanceInterest" className={labelCls}>Interested in maintenance?</label>
              <select id="sd_maintenanceInterest" name="sd_maintenanceInterest" className={inputCls} defaultValue="">
                <option value="">Not sure yet</option>
                {[["yes","Yes"],["no","No"],["not_sure","Not sure"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 grid gap-4">
            <div>
              <label htmlFor="sd_problemWorkflow" className={labelCls}>What happens today? (the workflow to replace)</label>
              <textarea id="sd_problemWorkflow" name="sd_problemWorkflow" rows={3} maxLength={2000} className={inputCls} placeholder="e.g. We track stock in spreadsheets…" />
            </div>
            <div>
              <label htmlFor="sd_mustHaveFeatures" className={labelCls}>Must-have features</label>
              <textarea id="sd_mustHaveFeatures" name="sd_mustHaveFeatures" rows={3} maxLength={2000} className={inputCls} placeholder="e.g. Roles for warehouse staff, low-stock alerts…" />
            </div>
          </div>
        </fieldset>
      )}

      {isDesign && (
        <fieldset className="rounded-[12px] border border-[var(--line)] bg-white p-5">
          <legend className="px-1 text-[14px] font-semibold">Design & prototype details (optional)</legend>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="sd_fidelity" className={labelCls}>Fidelity needed</label>
              <select id="sd_fidelity" name="sd_fidelity" className={inputCls} defaultValue="">
                <option value="">Not sure yet</option>
                {[["wireframe","Wireframe"],["clickable","Clickable prototype"],["functional_demo","Functional demo"],["not_sure","Not sure"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="sd_screenCount" className={labelCls}>Screens (approx.)</label>
              <select id="sd_screenCount" name="sd_screenCount" className={inputCls} defaultValue="">
                <option value="">Not sure yet</option>
                {[["1_5","1–5"],["6_10","6–10"],["11_25","11–25"],["over_25","Over 25"],["not_sure","Not sure"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="sd_developmentAlso" className={labelCls}>Build after design?</label>
              <select id="sd_developmentAlso" name="sd_developmentAlso" className={inputCls} defaultValue="">
                <option value="">Not sure yet</option>
                {[["yes","Yes"],["no","No"],["considering","Considering"],["not_sure","Not sure"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <p className={helpCls}>A prototype shows look and flow — production code, hosting, and integrations are quoted separately.</p>
        </fieldset>
      )}

      {isAi && (
        <fieldset className="rounded-[12px] border border-[var(--line)] bg-white p-5">
          <legend className="px-1 text-[14px] font-semibold">AI / automation details (optional)</legend>
          <div className="grid gap-4">
            <div>
              <label htmlFor="sd_desiredOutcome" className={labelCls}>What should the automation do?</label>
              <textarea id="sd_desiredOutcome" name="sd_desiredOutcome" rows={3} maxLength={2000} className={inputCls} placeholder="e.g. Draft replies from our help docs…" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="sd_dataRights" className={labelCls}>Data rights</label>
                <select id="sd_dataRights" name="sd_dataRights" className={inputCls} defaultValue="">
                  <option value="">Not sure yet</option>
                  {[["owned_or_authorized","We own / are authorised"],["permission_needed","Permission needed"],["no_dataset","No dataset"],["not_sure","Not sure"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="sd_evaluationNeed" className={labelCls}>Need accuracy evaluation?</label>
                <select id="sd_evaluationNeed" name="sd_evaluationNeed" className={inputCls} defaultValue="">
                  <option value="">Not sure yet</option>
                  {[["yes","Yes"],["no","No"],["not_sure","Not sure"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <p className={helpCls}>Do not include secrets or live personal data — describe the shape of inputs/outputs only.</p>
          </div>
        </fieldset>
      )}

      {isGraph && (
        <fieldset className="rounded-[12px] border border-[var(--line)] bg-white p-5">
          <legend className="px-1 text-[14px] font-semibold">Design assets (optional)</legend>
          <fieldset>
            <legend className="text-[14px] font-semibold">Asset types</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[14px]">
              {[["social_media","Social media"],["poster_flyer","Poster / flyer"],["brochure","Brochure"],["brand_identity","Brand identity"],["digital_invitation","Digital invitation"],["presentation","Presentation"],["campaign_assets","Campaign assets"],["other","Other"]].map(([v,l]) => (
                <label key={v} className="flex items-center gap-2 rounded-[8px] border border-[var(--line)] px-3 py-2.5"><input type="checkbox" name="sd_assetTypes" value={v} className="h-4 w-4 accent-[#315BE8]" />{l}</label>
              ))}
            </div>
          </fieldset>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="sd_quantity" className={labelCls}>Quantity (1–100)</label>
              <input id="sd_quantity" name="sd_quantity" type="number" min={1} max={100} className={inputCls} />
            </div>
            <div>
              <label htmlFor="sd_usage" className={labelCls}>Usage</label>
              <select id="sd_usage" name="sd_usage" className={inputCls} defaultValue="">
                <option value="">Not sure</option>
                {[["digital","Digital"],["print","Print"],["both","Both"],["not_sure","Not sure"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="sd_brandAssets" className={labelCls}>Brand assets</label>
              <select id="sd_brandAssets" name="sd_brandAssets" className={inputCls} defaultValue="">
                <option value="">Not sure</option>
                {[["ready","Ready"],["partial","Partial"],["not_ready","Not ready"],["not_sure","Not sure"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
        </fieldset>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelCls}>Your name *</label>
          <input id="name" name="name" type="text" autoComplete="name" required maxLength={120} className={inputCls} aria-invalid={!!err("name")} />
          {err("name") && <p className={errCls}>{err("name")}</p>}
        </div>
        <div>
          <label htmlFor="email" className={labelCls}>Email *</label>
          <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className={inputCls} aria-invalid={!!err("email")} />
          {err("email") && <p className={errCls}>{err("email")}</p>}
        </div>
        <div>
          <label htmlFor="company" className={labelCls}>Company / organisation</label>
          <input id="company" name="company" type="text" autoComplete="organization" maxLength={160} className={inputCls} />
        </div>
        <div>
          <label htmlFor="phone" className={labelCls}>Phone <span className="font-normal text-[#596273]">(optional)</span></label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={40} className={inputCls} />
        </div>
        <div>
          <label htmlFor="budget" className={labelCls}>Budget band <span className="font-normal text-[#596273]">(planning only)</span></label>
          <select id="budget" name="budget" className={inputCls} defaultValue="">
            <option value="">Select…</option>
            {BUDGETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="timeline" className={labelCls}>Timeline <span className="font-normal text-[#596273]">(preference only)</span></label>
          <select id="timeline" name="timeline" className={inputCls} defaultValue="">
            <option value="">Select…</option>
            {TIMELINES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="contactMethod" className={labelCls}>Preferred contact</label>
          <select id="contactMethod" name="contactMethod" className={inputCls} defaultValue="email">
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp (where available)</option>
          </select>
        </div>
        <div>
          <label htmlFor="preferredDate" className={labelCls}>Preferred date <span className="font-normal text-[#596273]">(optional, preference only)</span></label>
          <input id="preferredDate" name="preferredDate" type="date" className={inputCls} />
        </div>
      </div>

      <div>
        <label htmlFor="referenceUrls" className={labelCls}>Reference links <span className="font-normal text-[#596273]">(up to 5, one per line)</span></label>
        <textarea id="referenceUrls" name="referenceUrls" rows={2} inputMode="url" placeholder="https://example.com/inspiration" className={inputCls} />
        {err("referenceUrls") && <p className={errCls}>{err("referenceUrls")}</p>}
      </div>

      <div className="rounded-[12px] border border-[var(--line)] bg-white p-5">
        <div className="flex cursor-pointer items-start gap-3 text-[14.5px]">
          <input id="privacy" type="checkbox" name="privacy" required aria-describedby="privacy-detail" className="mt-1 h-5 w-5 accent-[#315BE8]" />
          <span>
            <label htmlFor="privacy">I have read the privacy notice and understand my brief will be used to review and respond to my enquiry. *</label>
            <span id="privacy-detail" className="mt-1 block text-[13px] text-[#596273]">Please read the <a href="/privacy" className="font-semibold text-[#315BE8] hover:underline" target="_blank" rel="noreferrer">privacy notice</a> before submitting.</span>
          </span>
        </div>
        {err("privacyNoticeAcknowledged") && <p className={errCls}>{err("privacyNoticeAcknowledged")}</p>}
      </div>

      {turnstileSiteKey ? (
        <div>
          <div ref={turnstileBoxRef} />
          <input type="hidden" name="turnstileToken" value={turnstileToken} readOnly />
          {turnstileFailed ? (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className={errCls}>Verification failed (code 600* — retryable). This is common on Brave / Firefox / VPN.</p>
              <button type="button" onClick={retryTurnstile} className="rounded-[8px] border border-[var(--line)] bg-white px-4 py-2 text-[14px] font-semibold text-[#151923] hover:bg-[#F0F3F9]">
                Retry verification
              </button>
            </div>
          ) : (
            !turnstileToken && <p className={helpCls}>Complete the verification above before submitting.</p>
          )}
        </div>
      ) : (
        <input type="hidden" name="turnstileToken" value="" />
      )}

      <button
        type="submit"
        disabled={submitting || !mounted}
        className="inline-flex min-h-[48px] w-full items-center justify-center rounded-[10px] bg-[#315BE8] px-6 text-[15px] font-semibold text-white transition-all hover:bg-[#2446BE] active:translate-y-[1px] disabled:cursor-wait disabled:opacity-60 md:w-auto"
      >
        {submitting ? "Sending… (do not double-click)" : "Submit enquiry"}
      </button>
      <p className={helpCls}>You&apos;ll get a reference number on success. Retries reuse the same submission key — no duplicates.</p>
    </form>
  );
}

export function usePreselected() {
  return useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return new URLSearchParams(window.location.search).get("service") || undefined;
  }, []);
}
