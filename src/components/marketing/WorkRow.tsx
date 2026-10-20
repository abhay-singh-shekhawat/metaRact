import Link from "next/link";
import type { WorkItem } from "@/config/work";
import { Chip, Tick } from "@/components/ui/primitives";
import { CompositionPlate } from "@/components/marketing/CompositionPlate";

/* ---------------------------------------------------------------------------
 * One work item as a ledger row.
 *
 * The left column carries the item's own generated plate — an inline SVG drawn
 * from the item's metadata (see plateArt.ts), never a fake screenshot — plus
 * its index, provenance chip, and stack. The right column carries the title
 * (which opens the live project directly when one is recorded), summary, and
 * outcomes. Shared by the home teaser and the /work index so the two treatments
 * cannot drift apart.
 *
 * Only real `WorkItem` fields are rendered. Nothing here is invented.
 * ------------------------------------------------------------------------- */

export function WorkRow({
  item,
  index,
  isConcept,
}: {
  item: WorkItem;
  index: number;
  isConcept: boolean;
}) {
  const caseStudyHref = `/work/${item.slug}`;
  return (
    <div className="group grid gap-x-8 gap-y-5 py-8 transition-colors hover:bg-[var(--surface-2)] md:grid-cols-[200px_1fr]">
      <div>
        <Link href={caseStudyHref} className="block" aria-label={`Read the ${item.title} case study`}>
          <CompositionPlate item={item} index={index} variant="compact" />
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <span className="meta">{String(index + 1).padStart(2, "0")}</span>
          {isConcept ? (
            <Chip>Concept · self-initiated</Chip>
          ) : (
            <Chip className="!border-[var(--ok)] !text-[var(--ok)]">Client work</Chip>
          )}
        </div>
        <ul className="mt-4 space-y-1.5">
          {item.stack.map((t) => (
            <li key={t} className="flex items-start gap-2 text-[13px] text-[var(--ink-3)]">
              <Tick tone="muted" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="display-h3 text-[19px]">
          {item.liveUrl ? (
            <a
              href={item.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-[var(--accent)]"
            >
              {item.title}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <Link href={caseStudyHref} className="transition-colors hover:text-[var(--accent)]">
              {item.title}
            </Link>
          )}
        </h3>
        <p className="mt-2 max-w-[68ch] text-[14.5px] leading-relaxed text-[var(--ink-2)]">{item.summary}</p>
        {item.outcome.length > 0 && (
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {item.outcome.map((o) => (
              <li key={o} className="flex items-start gap-2 text-[13.5px] leading-relaxed text-[var(--ink-2)]">
                <Tick />
                {o}
              </li>
            ))}
          </ul>
        )}
        <Link
          href={caseStudyHref}
          className="mt-5 inline-flex items-center gap-2 text-[13.5px] font-semibold text-[var(--accent)]"
        >
          Read case study
          <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
