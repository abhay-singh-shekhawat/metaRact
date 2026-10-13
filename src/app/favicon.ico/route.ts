const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#151923"/><text x="32" y="43" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="700" fill="#ffffff" text-anchor="middle">Y</text></svg>`;

export function GET() {
  return new Response(SVG, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
