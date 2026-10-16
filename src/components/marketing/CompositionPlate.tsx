import { platePlan } from "@/components/marketing/plateArt";
import type { WorkItem } from "@/config/work";

/* ---------------------------------------------------------------------------
 * The composition plate (DESIGN.md §5). Server-rendered inline SVG: no client
 * JS, no runtime asset, so the CSP holds and a case study's visual costs nothing
 * on the wire. The geometry comes from plateArt.ts and is stable for a given
 * slug, which is why the list thumbnail and the case-study plate agree.
 *
 * Two variants: `full` is the specimen sheet (frame, folio, legend, and the
 * "generated" note printed on its face); `compact` is the same plan without
 * chrome, for list rows where any label would be illegible.
 * ------------------------------------------------------------------------- */

type PlateVariant = "full" | "compact";

const LAYOUT = {
  full: {
    w: 760,
    h: 560,
    pad: 22,
    plot: { x: 22, y: 88, w: 650, h: 320 },
    railX: 700,
    headerY: 52,
    headerRuleY: 66,
    footerRuleY: 436,
    legendY: 462,
    noteY: 500,
    chrome: true,
  },
  compact: {
    w: 420,
    h: 300,
    pad: 16,
    plot: { x: 16, y: 16, w: 388, h: 268 },
    railX: 0,
    headerY: 0,
    headerRuleY: 0,
    footerRuleY: 0,
    legendY: 0,
    noteY: 0,
    chrome: false,
  },
} as const satisfies Record<PlateVariant, {
  w: number;
  h: number;
  pad: number;
  plot: { x: number; y: number; w: number; h: number };
  railX: number;
  headerY: number;
  headerRuleY: number;
  footerRuleY: number;
  legendY: number;
  noteY: number;
  chrome: boolean;
}>;

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Corner registration marks, the way a drawing is trimmed. */
function cornerTicks(pad: number, w: number, h: number) {
  const long = 7;
  const gap = 4;
  const a = pad - gap - long;
  const b = pad - gap;
  const c = w - pad + gap;
  const e = h - pad + gap;
  const f = h - pad + gap + long;
  return [
    `M${a} ${b} h${long}`,
    `M${b} ${a} v${long}`,
    `M${c} ${b} h${long}`,
    `M${c} ${a} v${long}`,
    `M${a} ${e} h${long}`,
    `M${b} ${f} v${-long}`,
    `M${c} ${e} h${long}`,
    `M${c} ${f} v${-long}`,
  ].join(" ");
}

export function CompositionPlate({
  item,
  index,
  variant = "full",
}: {
  item: Pick<WorkItem, "slug" | "title" | "stack" | "publishedAt">;
  index: number;
  variant?: PlateVariant;
}) {
  const L = LAYOUT[variant];
  const { bands } = platePlan(item.slug);
  const { plot } = L;
  // The compact plate is a miniature with no text of its own, and in list rows
  // it sits inside a link — so it is hidden from assistive tech in both cases.
  // The full plate is the one that carries a label.
  const decorative = variant === "compact";

  // Integer pixel edges: every hairline lands on exactly one device pixel.
  const rows = bands.map((band) => ({
    ...band,
    top: Math.round(plot.y + band.y * plot.h),
    bottom: Math.round(plot.y + (band.y + band.h) * plot.h),
  }));
  const px = (fraction: number) => Math.round(plot.x + fraction * plot.w);

  const legend = item.stack.length > 0 ? item.stack.join(" · ").toUpperCase() : "—";

  return (
    <svg
      viewBox={`0 0 ${L.w} ${L.h}`}
      {...(decorative
        ? { "aria-hidden": true as const }
        : {
            role: "img" as const,
            "aria-label": `Generated composition plate for ${item.title}: a section-rhythm drawing produced from this project's own metadata. A drawing, not a screenshot.`,
          })}
      className="plate"
    >
      <rect width={L.w} height={L.h} fill="var(--surface)" />

      <g shapeRendering="crispEdges">
        <rect
          x={L.pad}
          y={L.pad}
          width={L.w - L.pad * 2}
          height={L.h - L.pad * 2}
          fill="none"
          stroke="var(--line)"
        />
        <path d={cornerTicks(L.pad, L.w, L.h)} stroke="var(--line-2)" fill="none" />
      </g>

      {L.chrome && (
        <>
          <rect x={L.pad} y={45} width={6} height={6} fill="var(--accent)" />
          <text x={L.pad + 14} y={L.headerY}>
            PLATE {pad2(index + 1)}
          </text>
          <text x={L.w - L.pad} y={L.headerY} textAnchor="end">
            {item.slug.toUpperCase()}
          </text>
          <line
            x1={L.pad}
            y1={L.headerRuleY}
            x2={L.w - L.pad}
            y2={L.headerRuleY}
            stroke="var(--line)"
          />
        </>
      )}

      {/* The plan: one band per section, subdivided into the columns it uses. */}
      <g shapeRendering="crispEdges">
        {rows.map((row, i) => {
          const height = row.bottom - row.top;
          return (
            <g key={i}>
              <rect
                x={plot.x}
                y={row.top}
                width={plot.w}
                height={height}
                fill={
                  row.enquiry
                    ? "var(--accent-soft)"
                    : i % 2 === 1
                      ? "var(--surface-2)"
                      : "var(--surface)"
                }
                stroke="var(--line)"
              />
              {row.cols.slice(1, -1).map((fraction) => (
                <line
                  key={fraction}
                  x1={px(fraction)}
                  y1={row.top}
                  x2={px(fraction)}
                  y2={row.bottom}
                  stroke="var(--line)"
                />
              ))}
              {row.enquiry && <rect x={plot.x} y={row.top} width={3} height={height} fill="var(--accent)" />}
            </g>
          );
        })}
      </g>

      {L.chrome && (
        <>
          {/* Section rhythm, dimensioned off the plan's right edge. */}
          <g shapeRendering="crispEdges" stroke="var(--line-2)">
            <line x1={L.railX} y1={plot.y} x2={L.railX} y2={plot.y + plot.h} />
            {rows.map((row) => (
              <line key={row.top} x1={L.railX - 5} y1={row.top} x2={L.railX + 5} y2={row.top} />
            ))}
          </g>
          <text
            transform={`translate(${L.railX + 26} ${plot.y + plot.h / 2}) rotate(-90)`}
            textAnchor="middle"
            className="plate-note"
          >
            SECTION RHYTHM
          </text>

          <text
            x={plot.x + 14}
            y={rows[rows.length - 1].top + 20}
            className="plate-enquiry"
          >
            ENQUIRY
          </text>

          <line
            x1={L.pad}
            y1={L.footerRuleY}
            x2={L.w - L.pad}
            y2={L.footerRuleY}
            stroke="var(--line)"
          />
          <text x={L.pad} y={L.legendY} className="plate-legend">
            {legend}
          </text>
          <text x={L.w - L.pad} y={L.legendY} textAnchor="end" className="plate-legend">
            {item.publishedAt ?? "—"}
          </text>
          <text x={L.w / 2} y={L.noteY} textAnchor="middle" className="plate-note">
            GENERATED PLATE · A DRAWING, NOT A SCREENSHOT
          </text>
        </>
      )}
    </svg>
  );
}
