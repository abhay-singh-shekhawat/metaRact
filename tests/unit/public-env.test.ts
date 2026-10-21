import { afterEach, describe, expect, it } from "vitest";
import { getTurnstileSiteKey } from "@/lib/public-env";

function setSiteKey(value: string | undefined) {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  else env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = value;
}

afterEach(() => setSiteKey(undefined));

describe("getTurnstileSiteKey", () => {
  it("returns the configured public site key without surrounding whitespace", () => {
    setSiteKey("  1x00000000000000000000AA  ");
    expect(getTurnstileSiteKey()).toBe("1x00000000000000000000AA");
  });

  it("returns an empty string when the key is not configured", () => {
    setSiteKey(undefined);
    expect(getTurnstileSiteKey()).toBe("");
  });
});
