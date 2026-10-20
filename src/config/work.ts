export interface WorkItem {
  slug: string;
  title: string;
  summary: string;
  serviceSlugs: string[];
  isConcept: boolean;
  isApproved: boolean;
  clientPermissionConfirmed: boolean;
  publishedAt: string | null;
  /** Public URL of the live project, when it is safe to link (client work). */
  liveUrl?: string | null;
  outcome: string[];
  stack: string[];
}

export const workItems: WorkItem[] = [
  {
    slug: "git-jaipur-codefiesta-5",
    title: "Codefiesta 5.0 — GIT Jaipur hackathon site",
    summary:
      "The flagship hackathon site for Global Institute of Technology (GIT), Jaipur — a single-page event experience covering the event timeline, prize pool, internships, and a photo gallery, wrapped in a terminal-inspired visual identity.",
    serviceSlugs: ["websites-digital-experiences"],
    isConcept: false,
    isApproved: true,
    clientPermissionConfirmed: true,
    publishedAt: null,
    liveUrl: "https://hackathon.gitjaipur.com/",
    outcome: [
      "Single-page event experience with a terminal/arcade visual identity",
      "Event timeline, prize pool, and internship sections",
      "Photo gallery and organiser showcase",
      "Event Pass entry point for participants",
    ],
    stack: ["React", "Vite", "Three.js", "Tailwind CSS"],
  },
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
