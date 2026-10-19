import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { Eyebrow, PageHero } from "@/components/ui/primitives";
import { legalConfig } from "@/config/legal";
import { otherLegalDocs } from "@/content/legal";
import { splitCrossLinks, splitInline } from "@/content/legal/inline";
import type { LegalBlock, LegalDoc } from "@/content/legal/types";

/* ---------------------------------------------------------------------------
 * Policy pages — DESIGN.md §5.
 *
 * The text is rendered exactly as it is published in `docs/legal/*.md`, in the
 * order it was supplied. Two presentational liberties only: `**bold**` becomes
 * emphasis, and a mention of another policy's full title becomes a link. No
 * sentence is added, removed, split or reworded here — the fidelity of the text is
 * proven by tests/unit/legal-content.test.ts, so a change to the wording has to be
 * made in the markdown and re-imported.
 * ------------------------------------------------------------------------- */

const SECTION = /^(\d+)\.\s+(.*)$/;
const CROSS_LINK_STYLE =
  "font-medium text-[var(--accent)] underline decoration-[color-mix(in_srgb,var(--accent)_35%,transparent)] underline-offset-[3px] transition-colors hover:decoration-[var(--accent)]";

/** `**bold**` → emphasis; another policy's title → a link. No character is altered. */
function inline(text: string, related: LegalDoc[], keyPrefix: string): ReactNode {
  const targets = related.map((doc) => ({ title: doc.title, href: doc.href }));

  return splitInline(text).map((segment, index) => {
    const content = splitCrossLinks(segment.text, targets).map((part, partIndex) =>
      part.href ? (
        <Link key={`${keyPrefix}-${index}-${partIndex}`} href={part.href} className={CROSS_LINK_STYLE}>
          {part.text}
        </Link>
      ) : (
        <Fragment key={`${keyPrefix}-${index}-${partIndex}`}>{part.text}</Fragment>
      ),
    );

    return segment.bold ? (
      <strong key={`${keyPrefix}-b${index}`} className="font-semibold text-[var(--ink)]">
        {content}
      </strong>
    ) : (
      <Fragment key={`${keyPrefix}-t${index}`}>{content}</Fragment>
    );
  });
}

function Blocks({
  blocks,
  related,
  sectionId,
}: {
  blocks: LegalBlock[];
  related: LegalDoc[];
  sectionId: string;
}) {
  return blocks.map((block, index) => {
    const key = `${sectionId}-${index}`;
    if (block.kind === "bullets") {
      return (
        <ul key={key} className="mt-4 space-y-2.5">
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex gap-3">
              <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ink-3)]" />
              <span>{inline(item, related, `${key}-${itemIndex}`)}</span>
            </li>
          ))}
        </ul>
      );
    }
    if (block.kind === "steps") {
      return (
        <ol key={key} className="mt-4 space-y-2.5">
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex gap-3">
              <span aria-hidden className="mt-[2px] w-5 shrink-0 font-mono text-[13px] tabular-nums text-[var(--ink-3)]">
                {itemIndex + 1}.
              </span>
              <span>{inline(item, related, `${key}-${itemIndex}`)}</span>
            </li>
          ))}
        </ol>
      );
    }
    if (block.kind === "lines") {
      // A paragraph held together by markdown hard breaks — the source's signature line.
      return (
        <p key={key} className="mt-4">
          {block.lines.map((line, lineIndex) => (
            <Fragment key={lineIndex}>
              {lineIndex > 0 ? <br /> : null}
              {inline(line, related, `${key}-${lineIndex}`)}
            </Fragment>
          ))}
        </p>
      );
    }
    return (
      <p key={key} className="mt-4">
        {inline(block.text, related, key)}
      </p>
    );
  });
}

function SectionList({ sections, className = "" }: { sections: LegalDoc["sections"]; className?: string }) {
  return (
    <ol className={`space-y-1.5 text-[13.5px] leading-snug ${className}`}>
      {sections.map((section) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            className="block rounded-[4px] py-0.5 text-[var(--ink-2)] transition-colors hover:text-[var(--accent)]"
          >
            {section.heading}
          </a>
        </li>
      ))}
    </ol>
  );
}

export function LegalPage({ doc, lead }: { doc: LegalDoc; lead: string }) {
  const related = otherLegalDocs(doc);

  return (
    <>
      <PageHero
        eyebrow={<Eyebrow>Legal</Eyebrow>}
        title={doc.title}
        lead={lead}
        meta={[
          { k: "Effective", v: legalConfig.updatedLabel },
          { k: "Version", v: legalConfig.version },
          { k: "Sections", v: String(doc.sections.length) },
        ]}
      />

      <section className="py-14 md:py-20">
        <div className="container-studio">
          <div className="lg:grid lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-16">
            <aside className="legal-toc hidden lg:block">
              <nav aria-label="On this page" data-lenis-prevent className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pb-6">
                <p className="meta border-b border-[var(--line)] pb-3">On this page</p>
                <SectionList sections={doc.sections} className="mt-4" />
              </nav>
            </aside>

            <article className="legal-article min-w-0 max-w-[74ch] text-[15.5px] leading-relaxed text-[var(--ink-2)]">
              <p
                role="note"
                className="flex items-start gap-3 border-t border-[var(--line)] pt-4 text-[13.5px] leading-relaxed text-[var(--ink-2)]"
              >
                <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                <span>
                  <span className="font-semibold text-[var(--ink)]">A general policy.</span> Where a project has
                  an accepted quote or a written project agreement, that document controls for that project.
                </span>
              </p>

              <details className="legal-toc card mt-8 p-4 lg:hidden">
                <summary className="cursor-pointer text-[14px] font-semibold text-[var(--ink)]">
                  Contents — {doc.sections.length} sections
                </summary>
                <SectionList sections={doc.sections} className="mt-4" />
              </details>

              {doc.sections.map((section) => {
                const heading = SECTION.exec(section.heading);
                return (
                  <section key={section.id} id={section.id} className="mt-10 scroll-mt-24 md:mt-12">
                    <h2 className="display-h3 border-t border-[var(--line)] pt-5 text-[var(--ink)]">
                      {heading ? (
                        <>
                          <span className="mr-1.5 font-mono text-[13px] align-[2px] tabular-nums text-[var(--ink-3)]">
                            {heading[1]}.
                          </span>{" "}
                          {heading[2]}
                        </>
                      ) : (
                        section.heading
                      )}
                    </h2>
                    <Blocks blocks={section.blocks} related={related} sectionId={section.id} />
                  </section>
                );
              })}

              <footer className="mt-12 border-t border-[var(--line)] pt-5">
                <p className="text-[13px] text-[var(--ink-3)]">
                  {doc.title} · version {legalConfig.version} · last updated{" "}
                  <time dateTime={legalConfig.updated}>{legalConfig.updatedLabel}</time>
                </p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--ink-2)]">
                  Questions, corrections or a request under this policy?{" "}
                  <Link href="/contact" className={CROSS_LINK_STYLE}>
                    Contact us
                  </Link>
                  , or reply through the channel used for your enquiry.
                </p>

                <nav aria-label="Other policies" className="no-print mt-6">
                  <p className="meta">Related policies</p>
                  <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
                    {related.map((other) => (
                      <li key={other.href}>
                        <Link
                          href={other.href}
                          className="text-[var(--ink-2)] transition-colors hover:text-[var(--accent)]"
                        >
                          {other.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </footer>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
