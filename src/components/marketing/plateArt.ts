/* ---------------------------------------------------------------------------
 * Composition plate — the drawing a work item gets instead of a screenshot.
 *
 * A studio that publishes nothing without written client permission has, by
 * definition, no screenshots it may show. Rather than fake one, every work item
 * is given a plate that is *drawn* from its own metadata: a section-rhythm
 * study, generated deterministically from the item's slug so the same project
 * always draws the same plate. It is computed at build time, pulls no runtime
 * asset, and needs no library.
 *
 * It is a drawing, and it says so on its face. Nothing on the sheet depicts a
 * client, a metric, a result, or an interface — so nothing on it can be read as
 * a claim (DESIGN.md §2.1, §5).
 * ------------------------------------------------------------------------- */

export type PlateBand = {
  /** Top edge as a fraction of the plot height. */
  y: number;
  /** Height as a fraction of the plot height. */
  h: number;
  /** Column boundaries as fractions of the plot width; always ends at 1. */
  cols: number[];
  /** The closing band — where the composition's enquiry entry point sits. */
  enquiry: boolean;
};

export type PlatePlan = {
  bands: PlateBand[];
};

const SECTIONS_MIN = 5;
const SECTIONS_MAX = 7;
/** No column narrower than this share of the sheet — a subdivision must read. */
const COL_MIN = 0.2;
const COL_MAX = 4;

/** FNV-1a. Small, stable, and the same in every runtime. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Equal columns, so a three-column section is exactly thirds and bounds line up
 * between sections the way a real layout grid's do. The variation in the plan
 * comes from how many columns each section takes, not from wobble — and never
 * from proportional widths, which would read as a bar chart, i.e. as invented
 * data.
 */
function columnBounds(count: number): number[] {
  const bounds = [0];
  for (let i = 1; i <= count; i++) bounds.push(i / count);
  return bounds;
}

/**
 * The plan, in normalised coordinates so one sheet can be drawn at any size —
 * the list thumbnail is a true miniature of the case-study plate, not a redraw.
 */
export function platePlan(seed: string): PlatePlan {
  const rand = mulberry32(hash(seed));
  const count = SECTIONS_MIN + Math.floor(rand() * (SECTIONS_MAX - SECTIONS_MIN + 1));

  const weights = Array.from({ length: count }, () => 0.6 + rand() * 1.5);
  // The closing band carries the enquiry entry point, so it is given room to be
  // read rather than being the thinnest slice on the sheet. It is also the one
  // band left whole, so its marker is never ambiguous.
  weights[count - 1] = 1.15 + rand() * 0.45;

  const total = weights.reduce((a, b) => a + b, 0);
  const maxCols = Math.max(1, Math.min(COL_MAX, Math.floor(1 / COL_MIN)));

  const bands: PlateBand[] = [];
  let y = 0;
  for (let i = 0; i < count; i++) {
    const h = weights[i] / total;
    const enquiry = i === count - 1;
    const cols = enquiry ? 1 : 1 + Math.floor(rand() * maxCols);
    bands.push({ y, h, cols: columnBounds(cols), enquiry });
    y += h;
  }

  return { bands };
}
