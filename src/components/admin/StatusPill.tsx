const TONES: Record<string, { bg: string; fg: string; label: string }> = {
  new: { bg: "var(--accent-soft)", fg: "var(--accent-2)", label: "New" },
  reviewing: { bg: "var(--warn-soft)", fg: "var(--warn)", label: "Reviewing" },
  awaiting_customer: { bg: "var(--warn-soft)", fg: "var(--warn)", label: "Awaiting customer" },
  qualified: { bg: "var(--ok-soft)", fg: "var(--ok)", label: "Qualified" },
  converted: { bg: "var(--ok-soft)", fg: "var(--ok)", label: "Converted" },
  declined: { bg: "var(--danger-soft)", fg: "var(--danger)", label: "Declined" },
  archived: { bg: "var(--canvas-2)", fg: "var(--ink-2)", label: "Archived" },
};

/**
 * Status is never colour-only (DESIGN.md §8): the pill always carries the label
 * text next to the tone.
 */
export function StatusPill({ status }: { status: string }) {
  const tone = TONES[status] ?? { bg: "var(--canvas-2)", fg: "var(--ink-2)", label: status };
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-transparent px-2.5 py-1 text-[11.5px] font-semibold"
      style={{ background: tone.bg, color: tone.fg }}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor", opacity: 0.75 }} />
      {tone.label}
    </span>
  );
}
