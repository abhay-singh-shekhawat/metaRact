import { SCOPE_STEPS, SAMPLE_REF, SHEET_NOTE } from "@/components/marketing/scopeStack";

/* ---------------------------------------------------------------------------
 * Paints one sheet face onto a 2D canvas.
 *
 * The hero object is pure geometry — no model files, no image files, nothing
 * fetched at runtime (the CSP is `default-src 'self'`). Text is therefore
 * drawn here with the browser's own copy of the studio's fonts, which
 * next/font already self-hosts. The result is a crisp, real spec sheet that
 * costs one canvas and zero network requests.
 *
 * Type is sized for the sheet's on-screen scale, not for a full-size canvas:
 * the front sheet lands around 350 px wide in the hero, so a 40 px line here
 * reads as ~13 px there.
 * ------------------------------------------------------------------------- */

export type SheetMode = "paper" | "blueprint";

/** Canvas pixels. The ratio matches the sheet mesh (2.36 : 1.84). */
const W_PX = 1024;
const H_PX = 798;

const PAD = 84;
/** Corner radius in canvas px — the same absolute radius as the mesh. */
const RADIUS = 26;

function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function rule(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) return lines;
    } else {
      line = next;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

export function paintSheet(index: number, mode: SheetMode): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = W_PX;
  canvas.height = H_PX;

  const ctx = canvas.getContext("2d");
  const step = SCOPE_STEPS[index] ?? SCOPE_STEPS[0];
  if (!ctx) return canvas;

  const paper = mode === "paper";
  const display = cssVar("--font-bricolage", "Helvetica, Arial, sans-serif");
  const sans = cssVar("--font-geist", "Helvetica, Arial, sans-serif");
  const mono = cssVar("--font-mono", "monospace");

  const ink = paper ? "#0b0f17" : "#e8eeff";
  const soft = paper ? "#3d465a" : "rgba(206,219,255,0.8)";
  const ruleColor = paper ? "#dde2eb" : "rgba(122,146,255,0.34)";
  const accent = paper ? "#2a3cf0" : "#8b98ff";

  ctx.clearRect(0, 0, W_PX, H_PX);

  if (paper) {
    // Opaque sheet face: this plane is the visible front of the paper slab.
    roundedRect(ctx, 1, 1, W_PX - 2, H_PX - 2, RADIUS);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#e2e7ef";
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    // Blueprint face: no fill. Cobalt construction only — the dark slab body
    // shows through, so the toggle reads as the same document, redrawn.
    ctx.save();
    roundedRect(ctx, 1, 1, W_PX - 2, H_PX - 2, RADIUS);
    ctx.clip();
    ctx.strokeStyle = "rgba(122,146,255,0.14)";
    ctx.lineWidth = 1;
    for (let x = 47; x < W_PX; x += 47) rule(ctx, x, 0, x, H_PX);
    for (let y = 47; y < H_PX; y += 47) rule(ctx, 0, y, W_PX, y);
    ctx.restore();

    roundedRect(ctx, 1, 1, W_PX - 2, H_PX - 2, RADIUS);
    ctx.strokeStyle = "rgba(139,152,255,0.55)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Registration ticks, the way a drawing sheet is trimmed.
    ctx.strokeStyle = "rgba(139,152,255,0.8)";
    ctx.lineWidth = 2;
    const tick = 18;
    const midX = W_PX / 2;
    const midY = H_PX / 2;
    rule(ctx, midX, 0, midX, tick);
    rule(ctx, midX, H_PX - tick, midX, H_PX);
    rule(ctx, 0, midY, tick, midY);
    rule(ctx, W_PX - tick, midY, W_PX, midY);
  }

  const left = PAD;
  const right = W_PX - PAD;

  /* Header ----------------------------------------------------------------- */
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.font = `500 34px ${mono}`;

  if (paper) {
    ctx.fillStyle = accent;
    ctx.fillRect(left, PAD + 4, 17, 17);
  } else {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(left, PAD + 4, 17, 17);
  }

  ctx.fillStyle = accent;
  ctx.fillText(`${step.n} / ${step.label.toUpperCase()}`, left + 34, PAD + 27);

  ctx.textAlign = "right";
  ctx.fillStyle = soft;
  ctx.fillText(index === 0 ? SAMPLE_REF : `SHEET ${step.n} OF 04`, right, PAD + 27);
  ctx.textAlign = "left";

  /* Rule + heading ---------------------------------------------------------- */
  const ruleY = PAD + 96;
  ctx.strokeStyle = ruleColor;
  ctx.lineWidth = 2;
  rule(ctx, left, ruleY, right, ruleY);

  ctx.fillStyle = ink;
  ctx.font = `600 92px ${display}`;
  ctx.fillText(step.k, left, ruleY + 152);

  /* Body -------------------------------------------------------------------- */
  ctx.fillStyle = soft;
  ctx.font = `400 40px ${sans}`;
  const lines = wrap(ctx, step.v, right - left, 3);
  const bodyTop = ruleY + 152 + 96;
  lines.forEach((line, i) => {
    ctx.fillText(line, left, bodyTop + i * 58);
  });

  /* Blueprint detail: a dimension line under the copy ----------------------- */
  if (!paper) {
    const dimY = bodyTop + (lines.length - 1) * 58 + 56;
    ctx.strokeStyle = "rgba(139,152,255,0.6)";
    ctx.lineWidth = 2;
    rule(ctx, left, dimY, right, dimY);
    ctx.beginPath();
    ctx.moveTo(left, dimY - 10);
    ctx.lineTo(left, dimY + 10);
    ctx.moveTo(right, dimY - 10);
    ctx.lineTo(right, dimY + 10);
    ctx.stroke();
    ctx.font = `500 26px ${mono}`;
    ctx.fillStyle = "rgba(139,152,255,0.85)";
    ctx.textAlign = "center";
    ctx.fillText("REVIEWED BY A PERSON", (left + right) / 2, dimY - 20);
    ctx.textAlign = "left";
  }

  /* Footer ------------------------------------------------------------------ */
  const footY = H_PX - PAD;
  ctx.strokeStyle = ruleColor;
  ctx.lineWidth = 2;
  rule(ctx, left, footY - 52, right, footY - 52);

  ctx.font = `500 28px ${mono}`;
  ctx.fillStyle = soft;
  ctx.fillText(SHEET_NOTE, left, footY);

  // Sheet position is already stated in the header ("SHEET 0N OF 04"), so the
  // footer stays a single left-aligned line — which also keeps the bottom-right
  // corner clear for the stage's view control.
  return canvas;
}
