/* ---------------------------------------------------------------------------
 * The enquiry's readiness read-out (DESIGN.md §5, §6).
 *
 * /start-project is the one surface where the visitor authors a document the
 * studio actually reads — and the one surface where the site's own promise,
 * "every step produces something you can read", had nothing to show until after
 * the brief had already been sent.
 *
 * This derives that read-out from the live form by the same call the submit
 * handler uses, `new FormData(form)`, so it cannot drift from what is sent.
 *
 * It invents nothing. The six checks below are the six things
 * `src/lib/validation/enquiry.ts` actually rejects a submission for; the minimum
 * lengths mirror that schema exactly. Keep the two in step.
 * ------------------------------------------------------------------------- */

export interface Readiness {
  answered: number;
  total: number;
  ready: boolean;
}

/** Minimum lengths, mirroring the zod rules in `src/lib/validation/enquiry.ts`. */
const TITLE_MIN = 3;
const SUMMARY_MIN = 30;
const NAME_MIN = 2;

/** In the order the fields appear in the form. */
const CHECKS: ((read: (name: string) => string, form: FormData) => boolean)[] = [
  (read) => read("service").length > 0,
  (read) => read("projectTitle").length >= TITLE_MIN,
  (read) => read("projectSummary").length >= SUMMARY_MIN,
  (read) => read("name").length >= NAME_MIN,
  // Presence only. Whether an address is deliverable is the server's business,
  // and the input carries `type="email"` besides — claiming more here would be
  // asserting something this code cannot know.
  (read) => read("email").length > 0,
  (_read, form) => form.get("privacy") === "on",
];

export const READINESS_TOTAL = CHECKS.length;

/**
 * The state before anything is typed. The service select is always pre-filled
 * from the service list, so it is already satisfied on first paint — which keeps
 * the read-out deterministic between the first client render and the mount
 * refresh.
 */
export const INITIAL_READINESS: Readiness = {
  answered: 1,
  total: READINESS_TOTAL,
  ready: false,
};

export function readReadiness(form: FormData): Readiness {
  const read = (name: string) => String(form.get(name) ?? "").trim();
  const answered = CHECKS.reduce((n, satisfied) => n + (satisfied(read, form) ? 1 : 0), 0);
  return { answered, total: READINESS_TOTAL, ready: answered === READINESS_TOTAL };
}

export function sameReadiness(a: Readiness, b: Readiness): boolean {
  return a.answered === b.answered && a.total === b.total && a.ready === b.ready;
}
