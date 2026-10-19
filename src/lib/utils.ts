/**
 * Class-name joiner for third-party registry source.
 *
 * Registry components (shadcn, React Bits, Aceternity) are written against the
 * shadcn convention `import { cn } from "@/lib/utils"`. This is that helper.
 *
 * It is deliberately dependency-free — no `clsx`, no `tailwind-merge`. Every
 * client byte is earned on this site, and these components use `cn` only to
 * conditionally join a known set of classes, not to resolve conflicts between
 * arbitrary consumer overrides.
 *
 * Known limit: `cn("p-4", "p-2")` yields "p-4 p-2" rather than "p-2". When a
 * component genuinely depends on last-wins conflict resolution, that is the
 * signal to reconsider the dependency — not to add two packages quietly.
 */
export type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | readonly ClassValue[];

export function cn(...values: ClassValue[]): string {
  const out: string[] = [];

  for (const value of values) {
    if (!value) continue;

    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
    } else {
      out.push(String(value));
    }
  }

  return out.join(" ");
}
