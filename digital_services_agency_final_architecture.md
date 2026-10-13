# Digital Services Studio — Final Product & System Architecture

**Document ID:** DSS-ARCH-001  
**Version:** 2.0  
**Status:** Implementation specification for an AI coding agent  
**Prepared:** 12 October 2026  
**Supersedes:** Digital Services Agency Website Architecture v1.0 and the architecture audit v2 notes  
**Primary market assumption:** India; initial display currency INR; English-first website  
**Business model:** Three-person digital-services studio; service delivery is human-reviewed and manually quoted in the first release  

---

## 0. Binding instructions for the implementation agent

This document is the product and technical source of truth. Implement the requirements marked **MUST**. Treat **SHOULD** as the default unless there is a documented technical reason not to. **MAY** identifies optional future work, not launch scope.

### 0.1 Rules against invention and unnecessary scope

1. Do not invent the studio's name, founder names, email address, phone number, customer, testimonial, client logo, case study, project result, price guarantee, delivery guarantee, legal claim, or credential.
2. Use clearly named configuration placeholders for unknown business facts. Never ship a placeholder as if it were real. `Your Studio Name` is a development placeholder only.
3. Do not ask the business owner to decide things already decided in this file. Use the defaults below.
4. If a required third-party secret or real-world fact is unavailable, implement the integration, document the missing environment variable, and keep the affected production feature blocked. Do not make up credentials or report a successful live integration.
5. Inspect the existing repository before editing. Preserve valid existing work, conventions, and assets unless they conflict with this specification. If the repository is empty, create the structure in Section 8.
6. Implement the system in phases, starting at Phase 1. Do not build deferred features simply because a future extension is described here.
7. Do not use microservices, queues, a separate backend service, Kubernetes, a customer portal, payment processing, a CRM clone, automated final pricing, or AI chat on the marketing site in Phase 1.
8. Do not add dependencies solely for visual flair. Use semantic HTML, native browser behaviour, a small set of accessible components, and original layout composition.
9. Do not claim that the application is secure, compliant, production-ready, or fully tested unless the acceptance tests in this document have actually passed. Report unrun tests explicitly.
10. If a source or API changes after the research date, verify the current official documentation before using a new API or pattern. Do not copy deprecated patterns from model memory.

### 0.2 Delivery protocol

Before coding:

- Inspect the repository, installed runtime, package manager, lockfile, current tests, existing environment variable names, and deployment configuration.
- Write a brief implementation checklist against the phase-1 acceptance criteria in Section 18.
- Identify conflicts between existing code and this file. Resolve them conservatively and record a short ADR (architecture decision record) instead of silently diverging.

During coding:

- Implement small, verifiable slices: scaffold/design tokens; public pages; enquiry form; database/migrations; admin authentication; admin workflow; hardening/tests.
- Use migrations for every schema change. Never rely on an undocumented manual production database edit.
- Add tests alongside each meaningful feature.
- Keep secrets server-side. Never place service-role credentials or private environment variables in client components, logs, browser bundles, screenshots, or public repositories.

Before reporting completion:

- Run all available lint, type-check, unit, integration, end-to-end, and production-build checks.
- Fix failures caused by the implementation. Do not suppress errors merely to obtain a green build.
- Verify the end-to-end enquiry journey and the unauthorized-access cases.
- Provide a concise report with implemented scope, changed files, commands run, pass/fail results, missing secrets, and any remaining launch blocker.

---

## 1. Product definition

### 1.1 What is being built

A polished public website for a three-founder digital-services studio. Visitors can understand the studio's services, inspect genuine work, explain a digital project, provide contact details, and request a human-reviewed estimate. A small authenticated internal area lets the founders triage enquiries and manage their statuses.

The website is a **service business front door and lead-management tool**, not a freelancer marketplace or a self-service SaaS product. Human review determines scope, feasibility, price, timeline, and whether the studio should accept the work.

### 1.2 Product goals

1. Explain the offer quickly and credibly.
2. Turn suitable visitors into complete, actionable enquiries.
3. Capture enough information to qualify the work without making the form unnecessarily difficult.
4. Persist every accepted enquiry reliably and provide a traceable reference number.
5. Alert the internal team without losing the enquiry if email delivery fails.
6. Let authorized founders review, assign, update, and archive enquiries.
7. Establish a testable security, accessibility, reliability, and deployment baseline.
8. Leave clean extension points for later quotations, projects, milestones, payments, and a customer portal.

### 1.3 Non-goals for Phase 1

- Customer accounts, customer login, customer dashboard, or customer-visible project tracking.
- Automated quotations, instant binding prices, automatic deadline promises, or automatic acceptance of work.
- Online payments, invoices, refunds, or a payment-provider integration.
- Marketplace functions, freelancer accounts, public reviews, chat, messaging inbox, or AI chatbot.
- A general-purpose CMS or admin interface for editing every marketing paragraph.
- A large file-upload subsystem. In Phase 1, accept reference URLs and explicitly ask users not to send passwords, private keys, confidential datasets, or sensitive personal information. Secure uploads are a later feature with the requirements in Section 16.6.
- Fine-tuning or running models on website enquiries.
- Mobile native apps, hardware work, or claims that every conceivable service is available.

### 1.4 Measurable success criteria

Phase 1 is successful when:

- A visitor can understand the offer and reach the project form in no more than two obvious actions from any primary page.
- The form works with keyboard-only navigation, mobile screens, and clear field-level errors.
- A valid form request is saved once, assigned a reference, and visible to an authorized administrator.
- Invalid, spam-blocked, or rate-limited submissions are rejected without creating an enquiry.
- A notification failure does not delete the enquiry or return a false “not received” result after the database commit.
- A non-admin cannot view or mutate private enquiries or internal notes, even by calling routes directly.
- The application builds and passes required tests before deployment.
- No false testimonials, invented work, fake urgency, or unverified superiority claims appear on the public site.

---

## 2. Product decisions and default assumptions

These defaults remove avoidable ambiguity. The founders may change them later through explicit product decisions.

| Decision | Phase-1 default | Reason / rule |
|---|---|---|
| Business model | Agency/studio with human-reviewed projects | No marketplace matching or self-service checkout |
| Primary market | India, with potential international enquiries | Do not block international email addresses or URLs |
| UI language | English | Add translations only after translated content is reviewed |
| Default currency | INR (`INR`, displayed as ₹) | Currency is metadata, not a promise of fixed pricing |
| Business timezone | `Asia/Kolkata` | Store timestamps in UTC; display business times in this zone |
| Website stack | Next.js App Router + TypeScript + Tailwind CSS | Single codebase and server-rendered public pages |
| Data/auth | Supabase-managed PostgreSQL and Supabase Auth | Use private records and database-level access policies |
| Architecture style | Modular monolith | One deployable app; no microservices in v1 |
| Quote model | Manual, outside the public system in phase 1 | Avoid inaccurate automated prices before real delivery data exists |
| Public project references | URL fields, no file upload in phase 1 | Reduces file-exposure and malware risk; upload requirements are specified later |
| Email | Transactional email adapter; Resend is the default provider adapter | Provider must be configured with a verified sender domain before production |
| Abuse protection | Server-verified Cloudflare Turnstile + Upstash rate limiting in production | Do not rely on browser-only checks or process-local memory for production rate limits |
| Analytics | Minimal aggregate event analytics only; no session replay | Never send form contents, email, phone, internal notes, or attachment URLs to analytics |
| Public pricing | Explain pricing method and external expenses; no unvalidated numeric guarantees | Actual quote follows scope review |
| Portfolio | Only real authorized projects or clearly labelled concept work | No invented client work, names, outcomes, ratings, or testimonials |
| Public contact | Configurable email and optional WhatsApp link | Do not invent a contact address/number |
| Admin accounts | Invited founder accounts; membership is explicit in the database | No public sign-up route |
| Customer project files | No uploaded files in Phase 1 | External links only; private upload design is reserved for a later approved slice |
| Deployment | Preview/staging and production separated | Production data must not be used in local development or previews |

### 2.1 Launch-blocking business inputs

Create a single typed configuration module (for example `src/config/site.ts`) and a `.env.example`. The application may run in development with placeholders, but production readiness validation MUST fail if any required public field remains a placeholder.

Required before public production launch:

- Studio/brand name and approved logo or wordmark.
- Public contact email, configured sender email, verified email domain, and a monitored team inbox.
- Confirmation of which services the founders can actually deliver. Disable any service that cannot be delivered reliably.
- Genuine portfolio entries or an explicit decision to launch with no portfolio/case studies section shown yet.
- Approved Privacy Policy, Terms of Service, and cancellation/refund wording appropriate to the actual business model.
- Founder admin accounts invited and verified.
- Production environment secrets, domain, email, Turnstile, rate limiter, database, and deployment configuration.

The coding agent must build a visible development placeholder state and a production preflight check. It must not fabricate the above values.

---

## 3. Service taxonomy and public content

Use five outcome-led service pillars on the home page. This replaces the overlapping six-card taxonomy with a clearer menu; no capability should be advertised as available unless the founders have approved it. The website/software distinction is based on the customer outcome, while graphic design remains separate from AI services.

### 3.1 Pillar A — Websites and Digital Experiences

**Use for:** public-facing business websites, landing pages, campaign pages, portfolios, content sites, storefronts, and website redesigns.

**Possible deliverables:** agreed responsive pages, navigation, approved forms, defined integrations, agreed browser/device checks, source-code handover if contracted, and deployment assistance if contracted.

**Not automatically included:** domain fees, hosting, premium themes/plugins, copywriting, licensed media, third-party API usage, ongoing maintenance, or content entry beyond the agreed scope.

### 3.2 Pillar B — Software and Applications

**Use for:** custom web applications, dashboards, internal tools, business workflows, APIs, database-backed apps, integrations, and data-processing tools. Mobile applications may be offered only when that capability has been explicitly enabled by the founders.

**Possible deliverables:** agreed user flows, frontend/backend, database and API components, role permissions, agreed tests, setup notes, and agreed deployment/handover.

**Boundary:** Use this category when the core value is working software and repeated user/business workflows. Distinguish it from a mainly informational website by the primary outcome, not by arbitrary technical terms.

### 3.3 Pillar C — Product Design and Prototyping

**Use for:** discovery, wireframes, user flows, interface design, design systems, clickable prototypes, proof-of-concept demos, early MVP definition, and product redesigns.

**Possible deliverables:** agreed user flows, specified number of screens, clickable prototype, design files if included, components/specifications, and a handoff document.

**Boundary:** A clickable prototype does not imply production backend, persistence, authentication, security review, integrations, deployment, or production-ready source code. The quote must say whether the output is visual, interactive, functional, or production-oriented.

### 3.4 Pillar D — AI and Automation

**Use for:** defined API/model integrations, retrieval-based assistants where appropriate, workflow automation, AI proof-of-concept work, evaluation, model adaptation/fine-tuning only when evidence supports it, and deployment assistance if contracted.

The team must assess whether prompting, retrieval, conventional software, a third-party API, or fine-tuning is appropriate. Do not promise model accuracy without an evaluation set, test method, and acceptance criteria. Compute, API usage, storage, licensed datasets and hosting are separate expenses unless a quote says otherwise.

### 3.5 Pillar E — Graphic and Brand Design

**Use for:** social media assets, posters, flyers, brochures, digital invitations, branding collateral, campaign graphics, and related variations.

State dimensions, quantity, exports, revisions, source-file handoff, third-party asset licences, and print responsibility. Clarify whether the customer receives exclusive rights, editable source files, or only final exports.

### 3.6 Service availability configuration

Maintain service content in a typed source configuration, not in scattered conditional code. Use these canonical initial slugs: `websites-digital-experiences`, `software-applications`, `product-design-prototyping`, `ai-automation`, and `graphic-brand-design`. Each service has:

- `slug`, `title`, `shortDescription`, `longDescription`;
- `enabled` boolean;
- `formSchemaKey`;
- `deliverables[]`, `exclusions[]`, `faq[]`;
- `seoTitle`, `seoDescription`;
- optional `relatedWorkSlugs[]`.

Only `enabled: true` services appear in navigation, sitemap, public service lists, or the service selector. If a service is disabled, its route returns a real not-found response rather than a misleading empty page. Keep capabilities configurable so founders can launch narrower than the complete service taxonomy.

### 3.6 Copy rules

- Lead with the customer's outcome and concrete deliverables.
- Do not use unsupported claims such as “cheapest,” “best,” “world-class,” “guaranteed,” “instant,” or invented customer counts.
- Explain that final price and timing depend on approved scope, feasibility, dependencies, and team capacity.
- State that third-party costs are separate unless a quote explicitly includes them.
- Every concept project must be labelled **Concept project** or **Self-initiated demo**.
- Use no fake countdowns, scarcity messages, review stars, logos, or testimonials.

---

## 4. Information architecture and routes

### 4.1 Public routes

| Route | Requirement |
|---|---|
| `/` | Homepage with clear offer and primary CTA |
| `/services` | Overview of enabled service pillars/capabilities |
| `/services/[slug]` | Reusable detail template; category-specific content |
| `/work` | Real and concept work, correctly labelled; hide route content when no entries are approved rather than inventing projects |
| `/work/[slug]` | Case-study template for approved entries |
| `/process` | Enquiry-to-delivery steps, revisions, review points and handoff |
| `/pricing` | Pricing method, quote types, external costs; no automatic/final quote calculator |
| `/about` | Studio description and founder details only after provided/approved |
| `/faq` | Operational FAQs about scope, estimates, timeline, revisions, handoff and recurring costs |
| `/start-project` | Project enquiry form, optionally preselects a service from query/path state safely |
| `/contact` | Approved contact channels and a link to the form |
| `/privacy` | Approved privacy notice/policy; publication requires review |
| `/terms` | Approved terms of service; publication requires review |
| `/cancellation` | Approved cancellation/refund policy; publication requires review |
| `/intellectual-property` | Approved IP/portfolio usage terms; publication requires review |
| `/robots.txt`, `/sitemap.xml` | Valid generated SEO endpoints |

### 4.2 Admin routes

| Route | Requirement |
|---|---|
| `/admin/sign-in` | Supabase-authenticated sign-in; no public account creation |
| `/admin` | Overview counts and recent enquiries |
| `/admin/enquiries` | Filterable/paginated list |
| `/admin/enquiries/[id]` | Detail, notes, timeline, assignment, status update |
| `/admin/settings` | Minimal operational settings only if actually required; never secrets in a browser-editable form |

All `/admin/*` routes require authentication and active `admin_memberships` membership. Hiding a link or checking only in UI is not authorization. Protect pages, server actions, route handlers, database access, and file access independently.

### 4.3 Navigation

Desktop: logo/wordmark, Services, Work, Process, Pricing, About, **Start a Project** primary button.  
Mobile: accessible menu with the same key destinations; primary CTA remains easy to find.  
Footer: enabled services, work, process, pricing, contact, legal/policy links, approved social profiles only.

---

## 5. UX and visual design specification

### 5.1 Art direction

Create a premium, credible digital studio website that feels intentionally designed rather than like a generic agency template. Prioritize strong composition, typography, clear hierarchy, real work, precise spacing, restrained motion and useful detail. Do not make an arbitrary 3D/WebGL hero, animated cursor, noisy gradient mesh, glassmorphism dashboard, or large visual effect the central concept.

Default starter tokens (change only as part of a documented visual direction, not randomly per component):

- Background: `#F7F8FA`.
- Surface: `#FFFFFF`.
- Primary text: `#151923`.
- Secondary text: `#596273`.
- Border: `#DDE2EA`.
- Primary action: `#315BE8`.
- Action hover: `#2446BE`.
- Success/warning/error colours must also meet contrast requirements and never be communicated by colour alone.
- Use a legible sans-serif type family with clear heading/body contrast. Use a system fallback. Do not bundle unlicensed fonts.
- Use a consistent spacing scale and a small set of corner radii. Avoid applying cards to every paragraph.

These are initial implementation defaults, not a claim about final brand identity. Put tokens in CSS variables so a future rebrand is cheap.

### 5.2 Homepage section order

1. **Header**: wordmark, navigation, one primary CTA.
2. **Hero**: concrete outcome headline, short explanation, primary “Start a Project” and secondary “Explore Our Work” links. Acknowledge that a visitor can submit an idea without knowing the technical solution.
3. **Proof / work**: approved real projects or labelled concept work; do not fabricate content. If no work is approved, replace this section with a truthful “What we can help you build” section until content exists.
4. **Service pillars**: five outcome-led groups defined in Section 3, with subcategories and examples.
5. **How it works**: Brief → Scope → Quote → Build/review → Handover.
6. **Pricing philosophy**: clear scope-based pricing and separate third-party expenses.
7. **Why this process works**: only verifiable process commitments—written scope, clear exclusions, feasibility-checked timelines, explicit revisions, direct communication.
8. **FAQ**: common purchasing uncertainties.
9. **Final CTA**: “Have an idea? Let’s scope it.” or equivalent copy from site config.
10. **Footer**: useful links and approved contact details.

### 5.3 Responsive requirements

- Design mobile-first for common phone widths, then tablet and desktop.
- No horizontal scrolling at 320 CSS pixels except where a genuinely two-dimensional component requires it (none expected for Phase 1).
- Interactive targets should meet WCAG 2.2 AA target-size expectations; prefer at least 44×44 CSS pixels for main controls.
- Forms must have visible labels, correct input types, meaningful autocomplete values, inline errors, a top-level error summary when useful, loading state, and preserved input after recoverable failures.
- Focus must be visible, focus order logical, and menus/dialogs keyboard operable.
- Respect `prefers-reduced-motion`. Motion must not delay access to content or cause vestibular discomfort.
- Images need meaningful alt text or empty alt for decorative images. Avoid text baked into images for important content.

### 5.4 Accessibility and performance targets

Target WCAG 2.2 AA as the design/test baseline. This is an engineering target, not a certification claim. Verify contrast, keyboard operation, focus visibility, labels, error identification, semantic headings, status messages, and touch interaction. [Source: W3C WCAG 2.2, listed in Section 19.]

Performance targets on representative mobile and desktop runs:

- LCP ≤ 2.5 seconds, INP ≤ 200 milliseconds, CLS ≤ 0.1 where field data is available.
- Avoid shipping large animation/3D bundles or unnecessary client-side JavaScript.
- Use optimized responsive images, dimensions/aspect ratio to prevent layout shifts, and lazy-load below-the-fold images.
- Use Server Components by default. Client Components only for actual interaction.
- Do not cache private/admin responses publicly. Keep authenticated and enquiry-specific data out of shared static caches.

---

## 6. Project enquiry workflow

### 6.1 Form principles

The enquiry form is the key conversion workflow. It must be progressive, concise, server-validated, and saveable without the user answering questions they cannot reasonably know. No file uploads in Phase 1; accept reference URLs instead.

The user may select one primary service. If multiple capabilities are relevant, the brief can explain the cross-service needs. Do not force them to choose a model, framework, database, or fine-tuning approach.

### 6.2 Fields and validation

**Required fields**

- `serviceSlug`: must match an enabled service.
- `projectTitle`: 3–120 characters, trimmed.
- `projectSummary`: 30–5000 characters, trimmed; describe the problem, goal, or output wanted.
- `name`: 2–120 characters, trimmed.
- `email`: valid normalized email, maximum 254 characters.
- `privacyNoticeAcknowledged`: boolean that must be `true` to submit. Label this as acknowledgement that the notice was read; do not disguise marketing consent as a required condition.
- `idempotencyKey`: UUID created by client when the form session starts and reused on retry of the same submission.
- `turnstileToken`: verified by the server in production.

**Optional fields**

- `companyOrOrganization`: 0–160 characters.
- `phone`: optional; normalize cautiously; do not require an Indian number.
- `preferredContactMethod`: `email` (default) or `whatsapp` only when approved contact details support it.
- `budgetBand`: one of `under_10000`, `10000_30000`, `30000_75000`, `75000_150000`, `over_150000`, `not_sure`, or `prefer_not_to_say`. These are planning bands only and must not imply accepted pricing.
- `timelinePreference`: `flexible`, `under_1_week`, `2_4_weeks`, `1_3_months`, `specific_date`. If `specific_date`, a date can be supplied as a preference, not a commitment.
- `referenceUrls`: up to 5 URLs, each ≤ 2048 chars. Allow only `https:` and optionally `http:` after server-side URL parsing. Reject `javascript:`, `data:`, `file:`, localhost, private IP literal addresses, credentials in URLs, and unsupported protocols. Do not fetch arbitrary URLs server-side; this avoids SSRF.
- `serviceDetails`: category-specific data validated by a discriminated Zod schema. Only accept documented keys; reject unknown keys or discard them explicitly—do not persist arbitrary client objects.
- `marketingOptIn`: omitted in Phase 1. Do not add marketing communications without an explicit separately designed opt-in.

**Limits**

- Total request body: no more than 32 KB JSON.
- Maximum 5 reference URLs.
- `projectSummary` must be plain text; escape/render as text, never raw HTML.
- Reject invalid enum values, oversized fields, invalid emails, disabled services, malformed UUIDs and dates in the past where a specific future date is expected.
- Server is authoritative. Browser checks exist only to improve UX.

### 6.3 Category-specific fields and exact enums

Ask only the short set appropriate to the selected category. All category-specific fields are optional unless explicitly required below; allow “not sure yet.” The application must define these as discriminated Zod schemas keyed by the canonical service slug. Persist only these keys and validated values.

**A. `websites-digital-experiences`**

- `purpose`: `lead_generation | informational | portfolio | ecommerce | content | redesign | other | not_sure`.
- `pageCount`: `1 | 2_5 | 6_10 | 10_plus | not_sure`.
- `features`: array (max 10) of `contact_form | booking | authentication | payments | ecommerce | cms | api_integration | multilingual | other`.
- `otherFeatures`: optional text, max 1000 chars; only meaningful when `features` contains `other`.
- `existingSiteUrl`: optional URL, validated using the same URL safety rules as reference URLs.
- `contentReadiness`: `ready | mostly_ready | needs_help | not_sure`.
- `deploymentNeed`: `yes | no | not_sure`.

**B. `software-applications`**

- `problemWorkflow`: optional text, max 2000 chars.
- `userTypes`: `internal_team | external_customers | both | not_sure`.
- `targetEnvironment`: `web | mobile | desktop | internal_tool | not_sure`.
- `mustHaveFeatures`: optional text, max 2000 chars.
- `integrations`: optional text, max 1500 chars.
- `deploymentNeed`: `yes | no | not_sure`.
- `maintenanceInterest`: `yes | no | not_sure`.

**C. `product-design-prototyping`**

- `fidelity`: `wireframe | clickable | functional_demo | not_sure`.
- `screenCount`: `1_5 | 6_10 | 11_25 | over_25 | not_sure`.
- `developmentAlso`: `yes | no | considering | not_sure`.
- `targetUsers`: optional text, max 1000 chars.

**D. `ai-automation`**

- `desiredOutcome`: optional text, max 2000 chars.
- `exampleInputOutput`: optional text, max 2000 chars; do not ask for secrets or live personal/customer data.
- `dataRights`: `owned_or_authorized | permission_needed | no_dataset | not_sure`.
- `targetEnvironment`: `existing_app | web_app | workflow | standalone_demo | not_sure`.
- `evaluationNeed`: `yes | no | not_sure`.
- `integrationNeed`: `yes | no | not_sure`.

**E. `graphic-brand-design`**

- `assetTypes`: array (max 10) of `social_media | poster_flyer | brochure | brand_identity | digital_invitation | presentation | campaign_assets | other`.
- `otherAssetType`: optional text, max 500 chars.
- `quantity`: integer 1–100 or null if undecided.
- `dimensionsOrPlatform`: optional text, max 500 chars.
- `usage`: `digital | print | both | not_sure`.
- `exportFormats`: array (max 6) of `png | jpg | pdf | svg | editable_source | not_sure`.
- `brandAssets`: `ready | partial | not_ready | not_sure`.

Client-provided text has normal length limits and is always rendered as text. Lists must be deduplicated and length-limited. Reject values outside these enums; do not silently coerce arbitrary strings. Empty/unknown values can use the explicit `not_sure` option where listed.

### 6.4 User-facing states

- Idle: explain what information helps the team respond.
- Validation error: show field-specific messages and preserve entered values.
- Submitting: prevent accidental duplicate button clicks; do not clear fields.
- Success: display the generated enquiry reference and explain that a request was received, not that the work was accepted or quoted.
- Recoverable failure before persistence: tell the user the request was not confirmed as received and allow retry with the same idempotency key.
- Persistence succeeded but email delivery failed: still show success; the database is the source of truth. Notification failures are an internal operational problem and are visible to admins.

### 6.5 Submission sequence

1. Client validates for usability and creates/reuses an idempotency UUID.
2. Server validates request size, origin, schema, enabled service, URL list, honeypot, Turnstile token, and rate-limit policy.
3. Server computes a canonical payload fingerprint excluding volatile anti-bot token fields.
4. Server inserts the enquiry and initial audit event atomically. A unique idempotency key prevents duplicate creation. If the same key is replayed with a different payload fingerprint, reject it with a conflict response; if the same fingerprint is replayed, return the original reference.
5. Server records an email notification job/outbox item in the same database transaction as the enquiry.
6. Send an immediate best-effort notification. Update the outbox state to `sent` or `failed` with a safe error code. A failure must never delete the enquiry.
7. Return `201 Created` for new submissions or `200 OK` for idempotent replays.
8. Do not include the full customer brief, private note, or personal details in URL query parameters or analytics events.

---

## 7. Admin operating workflow

### 7.1 Admin authentication

- Use Supabase Auth with email-based login/magic link or OTP. No public sign-up route.
- A founder account must be invited/created in the Supabase dashboard or through a privileged operator workflow; membership must then be explicitly added to `admin_memberships`.
- For production, require MFA for founders if supported by the selected plan and deployment flow; at minimum, use verified email identity and strong account/session controls.
- Do not authorize a user merely because their email domain matches the business or because the UI hides the admin route.
- Use the official Supabase SSR/client pattern for the chosen Next.js version; refresh/auth cookies correctly and validate identity on the server. Never trust a client-supplied user ID or role.

### 7.2 Admin capabilities in Phase 1

- List enquiries with pagination (default 25 per page) and filters for status, service, creation date and assigned owner.
- View full enquiry details, approved contact fields, reference URLs, event history and internal notes.
- Change status only through allowed transitions.
- Assign or unassign an enquiry to an active founder account.
- Add an internal note. Notes are never returned to the public API or sent in customer-facing email.
- View notification state and retry failed notifications.
- Archive/decline an enquiry, with a reason recorded.
- Export is not included in Phase 1; do not add a public or unauthenticated CSV export endpoint.

### 7.3 Roles

Initial roles: `owner` and `member`.

- `owner`: all Phase-1 admin actions and membership administration via a safe operator workflow.
- `member`: view/manage enquiries, update status, assign work, add internal notes, retry notification.
- Membership table changes must not be available to anonymous users. In Phase 1, invite/remove users operationally using a documented admin script/dashboard step; a custom invite UI is deferred.

### 7.4 Enquiry status machine

Allowed statuses: `new`, `reviewing`, `awaiting_customer`, `qualified`, `declined`, `converted`, `archived`.

Allowed transitions:

- `new` → `reviewing`, `awaiting_customer`, `declined`, `archived`.
- `reviewing` → `awaiting_customer`, `qualified`, `declined`, `archived`.
- `awaiting_customer` → `reviewing`, `qualified`, `declined`, `archived`.
- `qualified` → `converted`, `reviewing`, `declined`, `archived`.
- `converted` → `archived` only; it indicates the enquiry has been accepted into the external delivery workflow, not that the Phase-1 system manages the project.
- `declined` → `archived` only.
- `archived` → no transition in Phase 1. Owner may restore a record only through a documented administrative procedure, not a general status update.

Each status change must go through one server-side use case, verify actor membership, verify the transition, update the enquiry and insert the audit event in a single database transaction. Invalid transitions return `409 Conflict` and do not mutate data.

### 7.5 Response target

Use a configurable internal target, default **two business days** for first human response. Do not promise this publicly unless the founders agree to staff it. If no operational commitment is approved, present the acknowledgement as “we’ll review your request” without a specific response guarantee.

---

## 8. Technical architecture and repository structure

### 8.1 Selected architecture

A single Next.js App Router application with server-side route handlers/use cases and a managed Supabase PostgreSQL database. Public content can be statically rendered or cached when safe; all admin data and enquiry mutations are dynamic and private. Keep the system modular, not distributed.

### 8.2 Required stack

- Next.js App Router, using the stable release supported at implementation time and pinned in the lockfile.
- TypeScript with `strict: true`.
- React version compatible with the selected Next.js release.
- Tailwind CSS and an accessible component layer where useful.
- Zod for server-side request schemas.
- Supabase Auth + PostgreSQL; `@supabase/ssr` for server/browser session clients.
- Supabase migration tooling/CLI for schema migrations.
- Resend adapter for transactional emails, behind an internal provider interface.
- Cloudflare Turnstile server verification in production.
- Upstash Redis with an official supported rate-limiter integration for production abuse limits; do not use in-memory-only rate limiting in production.
- Vitest for unit/integration tests and Playwright for critical end-to-end tests, unless a compatible existing test stack already exists.
- pnpm preferred for package management. If the repository already has a committed lockfile from another supported package manager, preserve it unless a migration is explicitly needed.

Before installing dependencies, verify current official docs and select patched stable versions compatible with the chosen runtime. Pin them through the lockfile. Do not leave production dependencies on floating version ranges without a lockfile.

### 8.3 Repository structure for a new project

```text
.
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   ├── page.tsx
│   │   │   ├── services/page.tsx
│   │   │   ├── services/[slug]/page.tsx
│   │   │   ├── work/page.tsx
│   │   │   ├── work/[slug]/page.tsx
│   │   │   ├── process/page.tsx
│   │   │   ├── pricing/page.tsx
│   │   │   ├── about/page.tsx
│   │   │   ├── faq/page.tsx
│   │   │   ├── start-project/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── privacy/page.tsx
│   │   │   ├── terms/page.tsx
│   │   │   ├── cancellation/page.tsx
│   │   │   └── intellectual-property/page.tsx
│   │   ├── admin/
│   │   │   ├── sign-in/page.tsx
│   │   │   ├── page.tsx
│   │   │   ├── enquiries/page.tsx
│   │   │   ├── enquiries/[id]/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/
│   │   │   ├── public/enquiries/route.ts
│   │   │   ├── admin/enquiries/route.ts
│   │   │   ├── admin/enquiries/[id]/route.ts
│   │   │   ├── admin/enquiries/[id]/status/route.ts
│   │   │   ├── admin/enquiries/[id]/notes/route.ts
│   │   │   ├── admin/enquiries/[id]/assignment/route.ts
│   │   │   ├── admin/notifications/[id]/retry/route.ts
│   │   │   ├── health/live/route.ts
│   │   │   └── health/ready/route.ts
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   └── global-error.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── marketing/
│   │   ├── forms/
│   │   └── admin/
│   ├── config/
│   │   ├── site.ts
│   │   ├── services.ts
│   │   └── navigation.ts
│   ├── lib/
│   │   ├── auth/
│   │   ├── supabase/
│   │   ├── security/
│   │   ├── email/
│   │   ├── rate-limit/
│   │   ├── validation/
│   │   ├── http/
│   │   └── observability/
│   ├── server/
│   │   ├── use-cases/
│   │   ├── repositories/
│   │   ├── policies/
│   │   └── notifications/
│   ├── types/
│   └── styles/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/
│   ├── check-production-config.ts
│   └── bootstrap-admin.ts
├── public/
├── .env.example
├── .nvmrc
├── package.json
├── pnpm-lock.yaml
├── README.md
└── SECURITY.md
```

Adapt the structure to the existing repository if one exists. The structure is a responsibility map, not a reason to create empty directories or empty files. Use a server-only marker for modules that contain service-role access or secrets.

### 8.4 Boundaries

- **Presentation:** React components and page layout; no direct privileged database access.
- **Validation:** reusable Zod schemas with shared inferred TypeScript types.
- **Use cases:** `createEnquiry`, `listEnquiries`, `getEnquiry`, `changeEnquiryStatus`, `assignEnquiry`, `addInternalNote`, `retryNotification`.
- **Repositories:** narrow database operations; no raw database calls scattered through UI components.
- **Policy/authorization:** one server-side place to resolve authenticated identity, admin membership, permission and allowed transitions.
- **Providers:** email/rate-limit/Turnstile interfaces with concrete provider adapters.
- **Observability:** structured logs and request IDs, with PII redaction.

Do not build generic frameworks or excessive abstraction. Add boundaries only where they isolate meaningful business rules or external dependencies.

---

## 9. Database model — Phase 1

All timestamps are stored as `timestamptz` in UTC. Use UUID primary keys unless a sequence is explicitly needed for the human-readable reference. Use named constraints, foreign keys, `NOT NULL` wherever required, indexes for listing/filtering, and server-controlled timestamps. Money is not stored in Phase 1 because the system does not issue quotes or take payments.

### 9.1 `admin_memberships`

| Field | Type | Rules |
|---|---|---|
| `user_id` | `uuid` PK/FK → `auth.users.id` | One membership per auth identity |
| `role` | text/enum | `owner` or `member` only |
| `is_active` | boolean | Default true |
| `created_at` | `timestamptz` | Server default `now()` |
| `created_by` | `uuid` nullable | Membership operator where known |

RLS: authenticated user may read only their own membership. Only an authorized owner/privileged bootstrap path may create, revoke or change membership. Do not allow a user to set their own role or `is_active`.

### 9.2 `enquiries`

Required fields:

- `id uuid primary key default gen_random_uuid()`.
- `reference_number text not null unique`, generated server-side in a database-safe way such as a sequence-backed `REQ-YYYY-000001` reference; never accept from the client.
- `idempotency_key uuid not null unique`.
- `payload_fingerprint text not null` (SHA-256 over canonical allowed payload; never hash/log raw secrets as telemetry).
- `service_slug text not null` and checked against the enabled service list in the server use case.
- `status` enum/text constrained to the statuses in Section 7.4; default `new`.
- `project_title text not null`.
- `project_summary text not null`.
- `service_details jsonb not null default '{}'::jsonb`; persist only validated, allowlisted keys.
- `name text not null`, `email text not null`, `email_normalized text not null`.
- `company_or_organization text null`, `phone text null`, `preferred_contact_method text not null default 'email'` with allowed values `email`, `whatsapp`.
- `budget_band text null` constrained to Section 6.2 values.
- `timeline_preference text null` constrained to Section 6.2 values.
- `preferred_date date null`; validate according to selected timeline and treat only as customer preference.
- `reference_urls jsonb not null default '[]'::jsonb`; server accepts a maximum of five validated strings.
- `privacy_notice_version text not null` and `privacy_notice_acknowledged_at timestamptz not null`.
- `assigned_to uuid null references auth.users(id)`; must be an active admin membership on assignment.
- `decline_reason text null`, internal only.
- `source_path text null`, `utm_source text null`, `utm_medium text null`, `utm_campaign text null`; collect only when supplied via allowed query parameters and never store arbitrary query strings.
- `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`.
- `converted_at timestamptz null`, `archived_at timestamptz null`.

Database/validation rules:

- Trim strings and enforce lengths in Zod and database constraints where appropriate.
- `email_normalized` is lower-cased/normalized server-side and indexed. Do not treat email alone as proof of identity or deduplicate separate enquiries solely by email.
- `idempotency_key` uniqueness handles request retry deduplication, not business-level duplicate leads.
- Use a unique constraint/index for `reference_number` and `idempotency_key`.
- Index `(created_at desc)`, `(status, created_at desc)`, `(service_slug, created_at desc)`, and `assigned_to` where justified.
- Do not put a user-provided project summary into a dynamically executed SQL fragment or HTML string.

### 9.3 `enquiry_events`

- `id uuid primary key`.
- `enquiry_id uuid not null references enquiries(id) on delete cascade`.
- `actor_user_id uuid null references auth.users(id)`; null for a system event.
- `event_type text not null`, constrained by the code-supported event types (e.g. `created`, `status_changed`, `assigned`, `unassigned`, `internal_note_added`, `notification_failed`, `notification_retried`, `archived`).
- `from_status text null`, `to_status text null`.
- `summary text not null` (short, redacted and not a duplicate of the full brief).
- `metadata jsonb not null default '{}'::jsonb`, restricted to small allowlisted non-sensitive facts.
- `created_at timestamptz not null default now()`.

Events are append-only through the application. Admin users cannot edit event history through a generic endpoint. Do not record secrets, full request bodies, tokens, or sensitive personal information in events.

### 9.4 `enquiry_internal_notes`

- `id uuid primary key`.
- `enquiry_id uuid not null references enquiries(id) on delete cascade`.
- `author_user_id uuid not null references auth.users(id)`.
- `body text not null` with length 1–5000 after trim.
- `created_at timestamptz not null default now()`.

Internal notes are available only in the authorized admin area. Never include them in notification emails, public responses, or analytics. The notes table may be merged into `enquiry_events` only if separate access control and note querying remain equally clear; do not create two competing sources for the same note.

### 9.5 `notification_outbox`

- `id uuid primary key`.
- `enquiry_id uuid not null references enquiries(id) on delete cascade`.
- `notification_type text not null` (initially `team_new_enquiry` and `customer_receipt`).
- `recipient text not null`.
- `status text not null` constrained to `pending`, `processing`, `sent`, `failed`.
- `attempt_count int not null default 0 check (attempt_count >= 0)`.
- `last_attempt_at timestamptz null`.
- `sent_at timestamptz null`.
- `provider_message_id text null`.
- `last_error_code text null` (safe normalized code, not raw secrets or provider response payload).
- `created_at timestamptz not null default now()`.

Create the enquiry, initial event, and outbox records within one database transaction. A provider outage must not cause the request to be lost. Retrying a notification must not recreate an enquiry or send an unbounded email loop.

### 9.6 Future entities — do not create until Phase 2

Quotes, quote line items, projects, milestones, payment records, project file records, customer accounts, and client-facing project events are Phase 2/3. Their design is specified in Section 16. Do not add unused schema “just in case.”

### 9.7 Database migrations and seeding

- All schema is stored in versioned SQL migrations.
- Seeding is idempotent and limited to safe reference data; never seed fake users, fake testimonials, fake clients, or false project history.
- Use local Supabase for development where feasible. Keep a distinct production project.
- RLS must be enabled for every table exposed to the Supabase Data API. Default to no anonymous table access. Only the intended admin policies grant private access.
- Public enquiry creation goes through the validated server endpoint and a server-only privileged write path or narrowly permissioned database function. Do not grant broad anonymous `INSERT` on the `enquiries`, `enquiry_events`, notes, membership or outbox tables.
- Use least privilege. If a service-role credential is used by the server for the public submission flow, isolate its module using a server-only import, restrict the function surface, validate all input first, and never make the key available to browser code. Prefer the least-privileged supported database function/role that reliably enforces the same invariants.
- Add database tests for constraints, allowed statuses, idempotency uniqueness, and RLS/authorization behaviour.

### 9.8 Required database invariants and RPC contracts

The implementation agent must translate these rules into actual versioned migrations, constraints, policies and SQL functions. Do not leave the policies as comments or implement only a UI-side check.

**Required constraints and indexes**

- Primary keys and foreign keys exactly as defined above.
- Unique `enquiries.reference_number` and `enquiries.idempotency_key`.
- A check that `reference_urls` is a JSON array and `service_details` is a JSON object.
- Check constraints for status, role, notification state, budget band, timeline preference and contact preference.
- Index enquiry creation time descending, `(status, created_at desc)`, `(service_slug, created_at desc)`, and `assigned_to`.
- Foreign-key relationships must not allow orphan notes, events or notification records.
- `updated_at` must be updated server-side for every enquiry mutation.
- Generate a reference like `REQ-2026-000123` inside the database transaction using a sequence or another concurrency-safe mechanism. A client can never choose the reference. Gaps in a sequence are acceptable; duplicate references are not.

**RLS/policy matrix**

| Table | `anon` | Authenticated non-admin | Active admin |
|---|---|---|---|
| `admin_memberships` | no access | read own membership row only | read own membership row; never self-edit role |
| `enquiries` | no direct access | no access | select permitted list/detail rows; direct writes denied |
| `enquiry_events` | no access | no access | select event history; direct writes denied |
| `enquiry_internal_notes` | no access | no access | select notes; direct writes denied |
| `notification_outbox` | no access | no access | select delivery state; direct writes denied |

Enable RLS on every table. Explicitly revoke anonymous table privileges. Do not depend on a missing policy or obscurity as the only protection. For reads, use the authenticated Supabase SSR client so RLS sees the actual user session. For writes, use only the named RPC paths below; avoid generic table update endpoints.

Create a hardened `public.is_active_admin()` helper or equivalent policy-safe mechanism to check that `auth.uid()` maps to an active membership. If implemented as `SECURITY DEFINER`, fix `search_path` to an empty or explicitly safe value, fully qualify all objects, revoke execute from `PUBLIC` as appropriate, and grant only the needed role. Avoid recursive RLS policies on the membership table.

**RPC contract A: `create_public_enquiry(payload jsonb, fingerprint text, team_recipient text)`**

- Callable only by the server's privileged role; revoke execution from `anon`, `authenticated` and `PUBLIC`.
- Must be `SECURITY DEFINER` only if needed to write private tables; use a fixed safe `search_path`, fully qualified references, and a minimal function body.
- Caller has already performed Turnstile, rate-limit, origin and Zod validation. The function is not a replacement for API validation.
- The application passes only the normalized, allowlisted, validated payload; it must omit the Turnstile token and all anti-bot metadata. `team_recipient` comes from validated server configuration, never the public request.
- The customer receipt recipient is the enquiry's normalized email; the team-alert recipient is `team_recipient`. Reject an empty/invalid team recipient at the application configuration check.
- In one transaction: check `idempotency_key`; if an existing row has the same fingerprint, return its `id` and `reference_number` with `is_duplicate=true`; if the fingerprint differs, raise a stable conflict condition; otherwise insert the enquiry, `created` event, and both initial notification outbox rows, then return the new ID/reference with `is_duplicate=false`.
- Never accept `status`, `assigned_to`, `reference_number`, event actor, or notification status from the public payload as authoritative. Set those values in the function.
- If any insert fails, roll back every insert in that transaction.

**RPC contract B: `admin_change_enquiry_status(enquiry_id uuid, new_status enquiry_status, reason text)`**

- Callable only by authenticated users.
- Must check `auth.uid()` and active membership inside the function, independently of the UI.
- Apply the exact transition graph in Section 7.4; reject invalid transitions with a stable conflict error.
- Update status/related timestamps and insert an event atomically.
- Set `converted_at` when transitioning to `converted`; set `archived_at` when transitioning to `archived`.
- Require a non-empty reason when setting `declined`; limit it to 500 characters, store it in `decline_reason` and event metadata, and expose it only inside the authorized admin area.

**RPC contract C: `admin_assign_enquiry(enquiry_id uuid, assigned_user_id uuid nullable)`**

- Callable only by authenticated active members.
- Check the actor is active; if assignee is non-null, confirm the target is an active admin membership.
- Update the assignment and append the assignment/unassignment event atomically.

**RPC contract D: `admin_add_enquiry_note(enquiry_id uuid, body text)`**

- Callable only by authenticated active members.
- Validate body length again in the database function.
- Insert the note and note-added event atomically.

**RPC contract E: notification attempts, retry and completion**

- `begin_notification_attempt(notification_id uuid)` is callable only by the server's privileged role. It may claim a `pending` job with fewer than five attempts, atomically changes it to `processing`, increments `attempt_count`, sets `last_attempt_at`, and returns only the fields needed to render/send that notification.
- `admin_claim_notification_retry(notification_id uuid)` is callable only by active admins. It may claim a `failed` job or a `pending`/`processing` job stale for at least ten minutes, with fewer than five attempts. It atomically changes the job to `processing`, increments `attempt_count`, sets `last_attempt_at`, and records a retry event. A recently processing job cannot be claimed twice.
- The application sends the email outside the database transaction. Use provider idempotency support if available, keyed by the outbox ID and attempt number; still design for possible at-least-once delivery if a provider outcome is ambiguous.
- `complete_notification_attempt(notification_id uuid, sent boolean, provider_message_id text, safe_error_code text)` is callable only by the server's privileged role. It changes `processing` to `sent` or `failed`, sets the safe provider ID/error code and timestamps, and appends a redacted `notification_failed` event on failure. It must not store raw exception payloads or secrets. Reject completion for a record that is not in the expected `processing` state unless the call is an explicitly idempotent replay with the same final result.

All privileged functions must use stable SQLSTATE/error codes that the API maps to documented HTTP responses. Tests must prove users cannot call a privileged function they are not authorized to invoke. Do not enable PostgreSQL `SECURITY DEFINER` casually; review function owner, grants, `search_path`, and all object references.

---

## 10. API contracts

Use JSON for application endpoints. Add a request ID to all responses and logs. Responses must use a stable envelope and must not expose stack traces, SQL errors, environment values, provider secrets, or sensitive internal records.

### 10.1 Response format

Success example:

```json
{
  "data": { "referenceNumber": "REQ-2026-000123" },
  "requestId": "<server-generated-request-id>"
}
```

Error example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "fieldErrors": { "email": "Enter a valid email address." }
  },
  "requestId": "<server-generated-request-id>"
}
```

`fieldErrors` is optional and limited to known public field names. Never send raw exception messages to clients.

### 10.2 `POST /api/public/enquiries`

Purpose: create or idempotently replay an enquiry.

- Request body: the documented fields from Section 6.2, plus `turnstileToken`.
- Required headers: `Content-Type: application/json`; `Idempotency-Key: <UUID>` matching the body idempotency key. Check same-origin `Origin` against the configured canonical origin; do not trust an unvalidated forwarded host.
- Verify the Turnstile token server-side, expected action/hostname where configured, and reject invalid/expired/reused tokens.
- Apply the configured IP rate limiter and honeypot check before database creation.
- New submission: `201 Created` with reference and generic received message.
- Exact replay: `200 OK` with same reference; no second enquiry or duplicate outbox entries.
- Same idempotency key, different canonical payload: `409 Conflict` with code `IDEMPOTENCY_KEY_REUSED`.
- Validation error: `400` or `422` consistently; choose one and document the choice in code/tests (`422` recommended).
- Turnstile failure: `403 Forbidden` with a generic anti-abuse message.
- Rate limited: `429 Too Many Requests` and `Retry-After`.
- Unexpected internal failure before commit: `500` with request ID; generic text only.
- If the DB commit succeeds but email delivery fails, return success and leave the outbox item failed/retryable. Before each provider call, atomically claim the outbox row so simultaneous replays/admin actions cannot send the same job concurrently.

Example valid-enquiry payload (the `turnstileToken` is a real short-lived token obtained from the browser widget; do not hardcode this example token in tests or source):

```json
{
  "idempotencyKey": "0b5e3f3c-8f86-4ac7-9ad6-2e2c9dfb8e11",
  "serviceSlug": "websites-digital-experiences",
  "projectTitle": "Landing page for a new service",
  "projectSummary": "We need a responsive page that explains the service and collects enquiries.",
  "name": "Example Customer",
  "email": "customer@example.com",
  "privacyNoticeAcknowledged": true,
  "companyOrOrganization": "Example Company",
  "preferredContactMethod": "email",
  "budgetBand": "10000_30000",
  "timelinePreference": "flexible",
  "referenceUrls": ["https://example.com/reference"],
  "serviceDetails": {
    "purpose": "lead_generation",
    "pageCount": "1",
    "features": ["contact_form", "responsive_design"],
    "contentReadiness": "mostly_ready"
  },
  "turnstileToken": "<runtime-token>"
}
```

Treat this only as a schema example. The server derives the normalized email, fingerprint, reference, status, timestamps, assignment and audit actor.

### 10.3 `GET /api/admin/enquiries`

- Requires active admin membership.
- Query allowlist: `status`, `serviceSlug`, `assignedTo` (valid admin user ID), `createdFrom`, `createdTo`, `page`, `pageSize`.
- Defaults: page 1, page size 25; maximum page size 100.
- Validate dates and status; reject unsupported query parameters or ignore only according to one consistent policy.
- Return paginated summaries, not internal notes or full provider data.
- Sort by `created_at desc` by default; no arbitrary column sorting from user input.

### 10.4 `GET /api/admin/enquiries/[id]`

- Requires active admin membership.
- Validate UUID route parameter.
- Return complete allowed enquiry details, internal notes and event timeline to authorized admins only.
- Return `404` for missing or inaccessible records; avoid leaking existence to unauthenticated callers.

### 10.5 `PATCH /api/admin/enquiries/[id]/status`

- Requires active admin membership.
- Body: `{ "status": "reviewing", "reason": "optional short reason" }`.
- Validate the transition through Section 7.4 on the server.
- Atomically update status and append an event.
- Return `409` for invalid transition; `404` for nonexistent record; `403` for an authenticated non-member.
- Do not allow updates to `reference_number`, `idempotency_key`, payload fingerprint, creation time, or other immutable/security fields.

### 10.6 `PATCH /api/admin/enquiries/[id]/assignment`

- Body: `{ "assignedTo": "uuid" | null }`.
- Assignee must be an active admin member.
- Atomically change assignment and append an assignment/unassignment event.

### 10.7 `POST /api/admin/enquiries/[id]/notes`

- Body: `{ "body": "..." }`.
- Enforce 1–5000 characters after trim.
- Write a private note and corresponding audit event atomically.
- Never send note content by email.

### 10.8 `POST /api/admin/notifications/[id]/retry`

- Requires active membership.
- Retry `failed` records or stale `pending`/`processing` records according to RPC contract E; apply per-record retry limits and cooldown.
- Do not permit arbitrary recipient changes through the retry endpoint.
- Update attempts and result; do not expose raw provider exceptions.

### 10.9 Health endpoints

- `GET /api/health/live`: returns `200` when the process is running; no secret/config details.
- `GET /api/health/ready`: internal/deployment use only; verifies required configuration and the database connectivity. Returns coarse readiness only; never disclose hostnames, secrets, SQL messages or environment values. If a deployment platform probes this endpoint publicly, ensure response remains safe.

---

## 11. Security requirements

Security is part of the implementation contract, not a later polish task.

### 11.1 Authentication and authorization

- Authenticate every admin request on the server.
- Authorize membership and role for every protected record read and mutation. Perform the check inside the server-side operation, not solely in middleware or UI.
- Protect against insecure direct object references: possession of an enquiry UUID does not authorize access.
- Never accept admin role, actor ID, assigned user, status history or permission from the browser as trusted facts.
- Use secure session cookies/official Supabase SSR session handling; HTTPS in production; review session lifetime, logout, revocation and MFA options.
- Do not use `NEXT_PUBLIC_` prefixes for secret credentials. Only truly public keys/config may use public prefixes.
- Do not create a public `/admin/register` route.

### 11.2 Secrets

Required secrets are listed in Section 17. Store them in local `.env.local` (gitignored) and the hosting platform's secret manager. `.env.example` contains names and harmless placeholder values only. Rotate any secret that has been committed or exposed. No secrets in logs, responses, source maps or screenshots.

### 11.3 Input and output safety

- Validate all public data server-side using explicit schemas.
- Normalize/trim user text; render it as text, not raw HTML/Markdown.
- Avoid unsafe `dangerouslySetInnerHTML`. If rich text is ever needed, define a strict sanitization policy and test it.
- Use parameterized database queries or a safe ORM/client API.
- Do not fetch arbitrary customer-provided URLs server-side. This prevents SSRF and redirects to local/private network services.
- Use a strict request-size limit, rate-limiting, Turnstile verification, honeypot and generic error text.
- Use an allowlist of response fields to prevent returning full rows or provider internals.

### 11.4 HTTP and browser security

Configure security headers using the currently supported Next.js configuration approach. Include at minimum:

- Content Security Policy appropriate to the exact scripts, styles, images, fonts, and Turnstile integration in use. Start restrictive and test it; do not use `unsafe-eval` in production without a documented requirement.
- `X-Content-Type-Options: nosniff`.
- A suitable `Referrer-Policy`, such as `strict-origin-when-cross-origin`.
- `Permissions-Policy` disabling unused features such as geolocation, camera and microphone.
- Anti-framing control through CSP `frame-ancestors 'none'` unless a documented embedding requirement exists.
- HTTPS and HSTS in production after confirming HTTPS works across the domain/subdomains.
- Appropriate `Cache-Control` so admin pages, authentication responses and enquiry API data are not publicly cached.

Do not copy a CSP blindly; include only the origins actually needed by the app and test that forms/auth still work.

### 11.5 Abuse controls

- Production requires server-side Turnstile verification and Upstash-backed rate limiting for public submissions.
- Configure a sensible baseline such as 5 submission attempts per IP per 10 minutes and a short per-action cooldown; tune based on abuse telemetry. Do not block ordinary repeated legitimate form edits.
- Key rate limits with a privacy-conscious stable hash if feasible; do not put raw IP addresses into application event logs.
- Honeypot is supplemental only, not the only protection.
- Reject requests with missing anti-abuse configuration in production. In local development, allow a clearly documented test-only bypass that cannot be activated in production.

### 11.6 Logging and errors

Structured application logs include timestamp, severity, request ID, route/use-case, safe error code, latency, and outcome. Do not log full enquiry bodies, email/phone, internal notes, session cookies, tokens, service keys, or attachment contents. Sanitize CR/LF in user-derived log values. Return safe error envelopes. Alert on repeated auth failures, high error rates, database failures, and notification failures where supported.

### 11.7 Personal data and retention

- Collect only the fields needed to respond and scope the requested work.
- Explain the purpose of data collection in the privacy notice and use a versioned notice acknowledgement record.
- Do not accept passwords, API keys, secrets, identity documents or confidential datasets through the initial form.
- Default operational policy: delete or anonymize unconverted/declined enquiries after 12 months of inactivity, unless there is a documented business/legal reason to retain them longer. Approved client records and contractual/accounting records may require a different policy.
- Limit access to enquiry data to active founders. Restrict production database/dashboard access to the smallest practical set.
- Create a documented process for access/correction/deletion requests, incidents, and data breach escalation. The exact statutory response obligations and timelines must be reviewed against current Indian law before launch.
- Do not claim legal compliance solely because the technical controls exist.

### 11.8 Payments

No payment processing is included in Phase 1. If added later, never trust a browser return URL as proof of payment. Verify provider signatures/webhooks server-side, persist idempotent provider event IDs, reconcile status, and do not store card PAN/CVV. The future payment module requires its own design/review before implementation.

---

## 12. Reliability and failure behaviour

### 12.1 Enquiry persistence is the source of truth

The enquiry row, initial event and notification outbox record are committed in one transaction. If this transaction fails, return a safe failure. If it succeeds, the form must show confirmation even if email is unavailable.

### 12.2 Email failure and retry

- Notification provider calls have a bounded timeout.
- Store safe provider message ID and normalized error code.
- Retry only when the outbox row is `failed`; cap immediate manual retry attempts (for example 5 attempts per job) and provide a cooldown.
- A duplicate route call must not create duplicate outbox records for the same enquiry/type.
- The admin screen must visibly distinguish sent, pending and failed notifications.
- The notification content is minimal: enquiry reference, service, safe summary/link to authenticated admin page. Do not attach private files or send internal notes.

### 12.3 Database/network failures

- Use bounded timeouts and meaningful retry policy only for transient operations.
- Avoid blind retries for non-idempotent writes unless the idempotency contract protects the operation.
- Never swallow a database error and return success.
- Provide a generic request ID so operators can correlate error reports without exposing customer data.

### 12.4 Backups and recovery

- Configure backups according to the chosen database plan; the operator must understand what is and is not included in the selected provider backup. For any later object storage feature, database backups do not necessarily restore object contents.
- Keep a periodic logical export or provider-supported backup policy appropriate to the budget.
- Document and test a restore procedure before production launch and again after major schema/storage changes.
- At minimum, perform a test restore to a non-production environment before the first real client enquiry is accepted.

### 12.5 Availability

Phase 1 does not require multi-region architecture, a message broker or custom autoscaling. Use managed hosting and database availability features. Add uptime and error monitoring with thresholds that are meaningful for a low-volume lead intake system.

---

## 13. Email specifications

### 13.1 Customer receipt

Subject: `We received your project enquiry — {reference_number}`

Body must:

- Confirm the request was received, not accepted.
- Include the reference number.
- Say the team will review the brief and contact the user using the submitted contact information.
- Avoid guaranteeing a response time until the founders approve one.
- Avoid echoing the complete project brief or any sensitive data.
- Include the approved public contact address.

### 13.2 Internal notification

Subject: `New project enquiry — {reference_number} — {service_title}`

Body contains reference, service, project title, created time and a protected admin link. A short summary may be included only if safely escaped and necessary. Do not include internal notes, secrets, large URLs containing credentials, or uploaded content.

### 13.3 Email deliverability requirements

- Use a verified sender domain and provider-supported SPF/DKIM configuration; apply DMARC according to the domain owner's setup.
- Do not claim deliverability is verified until a real end-to-end test is completed.
- Keep provider abstraction narrow; avoid building a generic multi-provider email platform in Phase 1.

---

## 14. SEO, analytics and content quality

### 14.1 SEO

- Unique title and meta description for each public route.
- Canonical URLs based on configured production site URL.
- Generate a sitemap from enabled services and approved work only.
- `robots.txt` must disallow admin and private application paths. Robots directives are not a security control.
- Add Open Graph metadata; use an approved brand asset or neutral generated site graphic, never a fake client screenshot.
- Use semantic heading hierarchy, descriptive internal links, meaningful alt text, readable slugs and server-rendered essential content.
- Avoid thin duplicated service pages: category pages must have genuinely distinct use cases, deliverables, scope boundaries and FAQs.

### 14.2 Analytics events

Phase 1 may track aggregate events:

- `page_view` (if analytics is enabled and configured appropriately).
- `project_cta_clicked`.
- `project_form_started`.
- `project_form_validation_failed` with error category only, not field content.
- `project_form_submitted`.
- `project_form_submission_failed` with safe error code.

Never send names, emails, phone numbers, project descriptions, notes, reference URLs, tokens, or enquiry IDs into analytics properties. The site must remain usable if analytics is blocked. Avoid session replay in Phase 1. If non-essential analytics/cookies are added, reassess notice/consent requirements and update policy.

### 14.3 Content approval

Marketing content is source-controlled. Do not build a CMS until the founders have a recurring editing need. Portfolio items should include `isApproved`, `isConcept`, `clientPermissionConfirmed`, and `publishedAt` fields in source config or a content file. Only approved entries can be rendered.

---

## 15. Testing strategy and acceptance criteria

### 15.1 Static quality checks

The repository must provide scripts equivalent to:

- `lint`
- `typecheck`
- `test` (unit + non-network-dependent tests)
- `test:integration`
- `test:e2e`
- `build`
- `db:reset` or a documented local migration/test reset command
- `check:production-config`

Use names consistent with the existing repo if it already has scripts. The agent must not claim a command passed unless it ran it and inspected the result.

### 15.2 Unit tests

Cover:

- Each service-specific Zod schema and invalid enum/unknown fields.
- URL protocol, credential, localhost/private IP and URL-count restrictions.
- Idempotency fingerprint canonicalization and replay conflict logic.
- Enquiry status transitions and role permissions.
- Safe email rendering/escaping and notification content composition.
- Public config placeholder detection.
- Budget/deadline treated as preferences, never final quote commitments.

### 15.3 Integration tests

Cover:

- Enquiry, initial event and outbox record commit atomically.
- Failed transaction creates no partial enquiry.
- Unique idempotency key prevents duplicate records.
- Replayed matching request returns original reference; different payload returns conflict.
- Public anonymous callers cannot select/read/update private enquiry data directly.
- Admin member can read permitted records and perform valid transitions.
- Unauthenticated and non-member requests cannot read or mutate any enquiry.
- User cannot assign an enquiry to a non-member or alter immutable fields.
- Notification retry updates only the intended outbox record and does not create new enquiries.
- Database constraints enforce allowed statuses and foreign keys.

### 15.4 End-to-end tests

At minimum:

1. Visitor navigates Home → Service → Start a Project.
2. Valid request submission displays a reference.
3. Request is visible in the admin list with `new` status.
4. Admin sign-in works with a seeded test admin; logout removes access.
5. Admin changes `new` → `reviewing` and an event appears.
6. Admin adds a private note; it is not present in public responses or email templates.
7. Invalid form input shows accessible field errors and preserves input.
8. Turnstile failure/invalid token is rejected in production-like tests.
9. Rate limit returns 429 after configured threshold.
10. Unauthenticated direct requests to all admin endpoints are denied.
11. Email provider failure still leaves the enquiry saved and notification marked failed.
12. Mobile navigation and form can be used by keyboard and a narrow viewport.
13. Unknown service slug, unknown work slug, and invalid enquiry UUID are handled without 500 errors.

### 15.5 Security checks before release

- Search production build artifacts and repository for accidental secrets.
- Confirm no service-role secret is exposed in client bundles, source maps, HTML, or browser network requests.
- Inspect RLS policies and grants on every data table.
- Test horizontal access control using two different admin/test identities and an anonymous identity.
- Validate no admin API response is publicly cached.
- Confirm CSP/security headers on deployed staging pages.
- Verify rate limiting, Turnstile and origin checks are active in production configuration.
- Run dependency/security audit and resolve high/critical actionable findings; document any accepted exception with owner and rationale.
- Test the backup/restore runbook.

### 15.6 Accessibility checks

- Manual keyboard navigation through header, form, menus, admin table and dialogs.
- Visible focus on all interactive controls.
- Labels and error messages programmatically associated with form controls.
- Screen-reader announcement for submitting, error and success status.
- Text and control contrast checked; no status represented by colour alone.
- Reduced-motion preference honoured.
- Use automated checks as assistance, not as proof of WCAG conformance.

---

## 16. Implementation phases and future architecture

### Phase 1 — Lead-generation MVP (must implement now)

- Public marketing routes and responsive visual design.
- Five service pillars with enabled/disabled capability configuration.
- Approved work/case-study structure that can be empty without fabricated entries.
- Pricing/process/FAQ/contact/policy routes.
- Project enquiry form with conditional fields, server validation, anti-abuse controls, idempotency and reference number.
- Supabase/PostgreSQL schema, migrations, RLS and admin membership.
- Minimal private admin area: list, detail, status transitions, assignment, internal notes and notification retry.
- Transactional customer receipt and internal alert using outbox semantics.
- Logging/redaction, basic health endpoints, metadata, sitemap/robots and security headers.
- Unit/integration/E2E tests, environment template, README, security runbook and production preflight.

### Phase 1.1 — Secure file uploads (deferred until explicitly approved)

Do not silently add uploads to Phase 1. If later approved, implement the following entire feature, not only an upload button:

- Private quarantine bucket/object storage; never public project-file URLs.
- Server-generated upload session UUID and per-file signed upload URL with short expiry. A token is restricted to one generated object path and may not list/read arbitrary objects.
- Maximum 5 files per enquiry, 10 MB per file, 25 MB aggregate. Allow only the approved types `pdf`, `png`, `jpg`, `jpeg`, `webp`, `txt`, and `csv`; do not allow archive formats, executables, scripts, or arbitrary office formats in the first upload iteration. Validate extension, declared MIME, detected file signature where applicable, length and path independently.
- Uploads are quarantined and cannot be downloaded until scanning/validation succeeds. Integrate malware scanning or a suitable managed scanning service before production enablement. If scanning is not configured, uploads remain disabled.
- Store files privately, use random object keys, restrict signed download URLs to active admins with a short TTL, and never render uploaded content inline in the application origin.
- Validate the upload session and actual object metadata before attaching to an enquiry; prevent cross-enquiry object access and abandoned-session attachment.
- Delete unattached/quarantined objects after 24 hours. Delete/anonymize completed/declined enquiry attachments according to the approved retention policy.
- Never place files in email attachments or public analytics.
- Test malicious extensions, MIME spoofing, oversized files, anonymous listing/read access, expired links, unauthorized object IDs, and delete/restore behaviour.

### Phase 2 — Formal quotations and delivery operations

Add only after founders have completed enough real projects to validate scope and prices:

- `quotes` with immutable sent versions, version number, validity, status and approval evidence.
- `quote_line_items` for service work, third-party expenses, discounts if approved, tax treatment, subtotal and total; amounts in minor units or exact `numeric`, never JS floating-point currency arithmetic.
- `projects` created only after explicit accepted quote/engagement requirements are met.
- `milestones` with owner, deliverable, planned date, dependencies and acceptance state.
- Scope change requests with impact, separate quote/approval and schedule update.
- Manual payment records or an integrated gateway only after a separate payment design.
- Handover checklist and support/maintenance agreement tracking.

Quote data rules for future phase: a sent/accepted quote version is immutable; changes produce a new version. Store currency, the customer-approved scope/exclusions, service fee, external-expense estimates, tax assumptions, payment milestones, revision allowance, schedule assumptions, acceptance criteria, quote expiry, and who/when accepted. Approval must be tied to the exact version and relevant terms version. Never convert an enquiry to a paid/accepted project merely because a customer viewed or replied to an email.

### Phase 3 — Client portal and selected automation

Only after repeated customers and actual operational need justify it:

- Customer authentication and account recovery.
- Customer access scoped strictly to their own projects.
- Quote review/approval tied to an exact version.
- Project milestone view, files and approved deliverable download.
- Revision/change requests with explicit scope impact.
- Payment history if payment features exist.
- Automated reminders and status notifications.

This phase requires fresh threat modeling and per-customer authorization tests. Do not simply expose the admin API to customer accounts.

### Phase 4 — Optimization

Use measured data to improve: qualified-enquiry rate, quote acceptance, cost-estimate accuracy, planned-vs-actual hours, on-time delivery, rework, gross margin, recurring work and customer satisfaction. Only introduce automated pricing after validating the underlying cost/risk model against actual completed projects and maintaining manual review for uncertainty.

---

## 17. Environment and operational configuration

Create `.env.example` with descriptions and safe placeholder values. Actual secrets must be provided by the operator.

Required/expected variables:

```dotenv
# Public site config (safe to expose only where prefixed NEXT_PUBLIC_)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_STUDIO_NAME=Your Studio Name
NEXT_PUBLIC_TURNSTILE_SITE_KEY=

# Supabase public connection values
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Server-only credentials — never use NEXT_PUBLIC_ prefix
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=

# Transactional email
RESEND_API_KEY=
EMAIL_FROM=
INTERNAL_NOTIFICATION_EMAIL=

# Anti-abuse
TURNSTILE_SECRET_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Admin bootstrap / operational policy
ADMIN_BOOTSTRAP_ALLOWED=false
PRIVACY_NOTICE_VERSION=2026-10-01
ENQUIRY_RETENTION_MONTHS=12
LOG_RETENTION_DAYS=30

# Environment
NODE_ENV=development
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, or `UPSTASH_REDIS_REST_TOKEN` to the browser. `SUPABASE_DB_URL` is optional if all data access uses Supabase APIs; if used for migrations/scripts, never bundle it in the application and use a runtime role with the least privileges supported.

Production configuration rules:

- `NEXT_PUBLIC_SITE_URL` must be the canonical HTTPS production origin, no trailing-path ambiguity.
- `NEXT_PUBLIC_STUDIO_NAME` must not be a placeholder.
- Turnstile and rate limiter secrets must be present; production submission must fail closed if they are missing.
- `EMAIL_FROM` must use a verified sender domain; `INTERNAL_NOTIFICATION_EMAIL` must be configured and monitored.
- Supabase redirect/callback URLs must be exact and configured for the production hostname; do not use wildcards unnecessarily.
- Admin memberships must be created through the documented bootstrap step after the auth user exists.
- `ADMIN_BOOTSTRAP_ALLOWED` must be false for normal production runtime. Bootstrap is an operator-only script, not a web endpoint.
- Never reuse production credentials/data in local or preview environments.

### 17.1 Bootstrap-admin script

Provide a safe operator script that:

1. Requires an explicit command-line email argument and operator confirmation in interactive use.
2. Requires the relevant service-role credential in the process environment.
3. Looks up an existing verified Supabase Auth user by exact normalized email.
4. Creates or activates a membership with the selected role only after the user exists and is verified.
5. Is not routed through a public API or browser bundle.
6. Prints the user email and membership result, never credentials/tokens.
7. Can be safely rerun without duplicate memberships.

Document the manual dashboard alternative, including how to revoke a founder's membership and session if access is lost.

### 17.2 Required operational docs

`README.md` must cover local prerequisites, environment setup, local database/migrations, seed, dev server, tests, build, admin bootstrap, deployment, and known launch blockers. `SECURITY.md` must cover reporting a vulnerability, secret rotation, access revocation, incident triage, data deletion requests and backup recovery.

---

## 18. Deployment and release gates

### 18.1 Environments

- Local development: local `.env.local`, local/test database, test email mode if available.
- Preview/staging: separate project/database from production; only synthetic/test data; test provider credentials where available.
- Production: canonical domain, verified sender, production database and secrets, backups, anti-abuse configuration, privacy/legal pages approved.

### 18.2 CI pipeline

Pull request checks MUST run:

1. Dependency install using the committed lockfile.
2. Formatting/lint.
3. TypeScript check with strict mode.
4. Unit tests.
5. Integration tests against a test/local database where available.
6. Production build.
7. Dependency/security audit and secret scanning through supported CI tooling.
8. Migration validation (apply migrations from a clean database in CI or a reproducible migration-test job).

Critical Playwright tests should run on pull requests or at minimum before production deployment. No failed required checks may be silently ignored.

### 18.3 Production go/no-go checklist

Deployment is blocked until each of these is true:

- [ ] Brand name, logo/wordmark, contact email and canonical domain are approved.
- [ ] All publicly enabled service categories match real team capability.
- [ ] Public content has no fictional work, testimonials, logos, metrics, or unapproved claims.
- [ ] Privacy, Terms, Cancellation/Refund and IP/portfolio policies are reviewed and match the actual process.
- [ ] Supabase production project is separate from development/preview.
- [ ] Migrations have been applied and RLS/grants reviewed table-by-table.
- [ ] All three founder accounts are intentionally invited, verified and authorized; no public sign-up exists.
- [ ] Service-role keys and other secrets are server-only and not present in client bundles/repository.
- [ ] Production Turnstile verification and distributed rate limiting are active.
- [ ] Email sender domain is verified, team recipient is monitored, and customer/internal test messages are received.
- [ ] Idempotency, persistence, admin authorization, notification failure/retry, and form error paths pass tests.
- [ ] HTTPS and security headers are verified on the deployed site.
- [ ] Mobile, keyboard accessibility and core public pages have been manually checked.
- [ ] Backup policy and a test restore have been completed.
- [ ] `lint`, `typecheck`, tests and production `build` pass, and results are recorded.
- [ ] The owner has reviewed the final deployed website and legal/privacy wording.

---

## 19. Legal/privacy notes and research references

This section is implementation guidance, not legal advice. The studio's actual obligations depend on its business structure, customers, data, providers and current law. Have the applicable policies and compliance schedule reviewed by a qualified Indian professional before public launch.

Design the product for data minimization, clear purpose notice, restricted access, retention/deletion, incident response and controlled third-party processing. The Digital Personal Data Protection Act, 2023 and the Digital Personal Data Protection Rules, 2025 are relevant Indian primary materials; the Ministry of Electronics and Information Technology's current official publication page must be rechecked for the latest rules, amendments and commencement/enforcement timetable before launch. Do not assume all provisions commence simultaneously or that a generic privacy page alone establishes compliance.

Use these primary/maintainer sources for implementation patterns. Verify them again at implementation time because frameworks and provider APIs change:

1. **Next.js App Router documentation** — https://nextjs.org/docs/app
2. **Next.js Forms / Server Actions guidance** — https://nextjs.org/docs/app/guides/forms
3. **Next.js data security guidance** — https://nextjs.org/docs/app/guides/data-security
4. **Next.js security headers configuration** — https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
5. **Supabase Next.js quickstart and SSR patterns** — https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
6. **Supabase Storage access control** — https://supabase.com/docs/guides/storage/security/access-control
7. **Supabase production/security configuration** — https://supabase.com/docs/guides/security/product-security
8. **Supabase database backups and restore limitations** — https://supabase.com/docs/guides/platform/backups
9. **PostgreSQL constraints** — https://www.postgresql.org/docs/18/ddl-constraints.html
10. **OWASP File Upload Cheat Sheet** — https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
11. **OWASP Session Management Cheat Sheet** — https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
12. **OWASP Application Security Verification Standard (ASVS) 5.0** — https://owasp.org/www-project-application-security-verification-standard/
13. **W3C Web Content Accessibility Guidelines 2.2** — https://www.w3.org/TR/WCAG22/
14. **MeitY: Digital Personal Data Protection Rules, 2025 publication page** — https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa
15. **MeitY / Government of India data protection publications** — https://www.meity.gov.in/

Research checked for this specification on **12 October 2026**. The listed sources support the architectural patterns; they do not certify that this implementation is secure, compliant, or correctly configured.

---

## 20. Final implementation checklist for the agent

Complete these in order and report progress by stage:

### Stage A — Repository and foundation

- [ ] Inspect repository and summarize existing structure/state.
- [ ] Set up/verify pinned stack and scripts without replacing valid existing work.
- [ ] Add typed site/service configuration and `.env.example`.
- [ ] Implement design tokens, typography, layout primitives and responsive header/footer.
- [ ] Add production configuration preflight and secret-safe logging.

### Stage B — Public website

- [ ] Build homepage sections from Section 5.2.
- [ ] Build enabled service overview and reusable service detail template.
- [ ] Build work/case-study system that supports empty state without fake work.
- [ ] Build Process, Pricing, About, FAQ and Contact routes.
- [ ] Build policy routes using clearly marked draft text pending business/legal approval.
- [ ] Add metadata, Open Graph, robots and sitemap.
- [ ] Run responsive, accessibility and route tests.

### Stage C — Database and enquiry form

- [ ] Add versioned migrations for Phase-1 schema.
- [ ] Enable RLS and explicitly review policies/grants.
- [ ] Implement shared Zod schemas and conditional form UI.
- [ ] Implement Turnstile server verification, Upstash rate limiting, origin checks and honeypot.
- [ ] Implement atomic enquiry/event/outbox creation, generated reference and idempotency.
- [ ] Implement safe success/error states and customer receipt/internal notification adapters.
- [ ] Add unit/integration tests for all validation, duplicate submission and failure cases.

### Stage D — Admin system

- [ ] Implement Supabase Auth sign-in and verified membership enforcement.
- [ ] Implement paginated/searchable enquiry list and detail screen.
- [ ] Implement status machine, assignment, internal notes and audit events.
- [ ] Implement notification state/retry flow.
- [ ] Verify unauthorized access on every API/use case, not only route rendering.
- [ ] Add test admin bootstrap script and operator documentation.

### Stage E — Production hardening

- [ ] Configure CSP/security headers, private caching rules, request IDs and error boundaries.
- [ ] Add `SECURITY.md`, README setup and recovery runbook.
- [ ] Configure CI, migrations check, secret scanning, dependency audit and E2E tests.
- [ ] Run backup/restore test in non-production.
- [ ] Run the entire go/no-go checklist.
- [ ] Produce the implementation report: completed features, changed files, commands and test results, missing credentials, unverified provider setups, known issues, and production blockers.

**Stop condition:** Phase 1 is complete only when the public enquiry can be submitted, persisted, uniquely referenced, seen by an authorized founder, safely triaged, and tested under failure/unauthorized scenarios. A polished homepage alone does not satisfy the project.

**Final product definition:** A restrained, credible digital-services studio website with a secure, reliable lead-intake and internal triage workflow. Start manually where the business decisions are uncertain; automate only the parts whose rules are stable and whose value has been demonstrated.
