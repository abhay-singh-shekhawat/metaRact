export interface WorkItem {
  slug: string;
  title: string;
  summary: string;
  serviceSlugs: string[];
  isConcept: boolean;
  isApproved: boolean;
  clientPermissionConfirmed: boolean;
  publishedAt: string | null;
  outcome: string[];
  stack: string[];
}

export const workItems: WorkItem[] = [
  {
    slug: "concept-studio-starter",
    title: "Studio starter site — self-initiated demo",
    summary:
      "A self-initiated concept demonstrating our homepage composition, service taxonomy, and enquiry flow. Built to validate this platform's own design system.",
    serviceSlugs: ["websites-digital-experiences"],
    isConcept: true,
    isApproved: true,
    clientPermissionConfirmed: true,
    publishedAt: "2026-10-01",
    outcome: ["Demonstrates section rhythm and enquiry entry points", "Validates responsive and accessible form patterns"],
    stack: ["Next.js", "TypeScript", "Tailwind CSS"],
  },
];

export function approvedWork(): WorkItem[] {
  return workItems.filter((w) => w.isApproved);
}

export function getWork(slug: string): WorkItem | undefined {
  return workItems.find((w) => w.slug === slug && w.isApproved);
}
