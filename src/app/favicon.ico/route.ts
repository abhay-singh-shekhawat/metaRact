/**
 * The real icon is the agency mark, generated from the logo at src/app/icon.png.
 * Browsers and tools still request /favicon.ico directly, so point them at the
 * same file rather than serving a separate placeholder.
 */
export function GET(request: Request) {
  return Response.redirect(new URL("/icon.png", request.url), 308);
}
