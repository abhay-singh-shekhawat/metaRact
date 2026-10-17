import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import "../styles/globals.css";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { siteConfig } from "@/config/site";

// Typography is part of the design contract (DESIGN.md §4.2): Bricolage Grotesque
// for display, Geist for body/UI. next/font self-hosts both at build time.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: `${siteConfig.studioName} — Websites, Software, Design & AI`,
    template: `%s · ${siteConfig.studioName}`,
  },
  description:
    "A small digital-services studio for websites, custom software, product design, brand design, and practical AI integrations. Human-scoped, honestly quoted.",
  openGraph: {
    type: "website",
    siteName: siteConfig.studioName,
    // No title/description here on purpose. Setting them made every route share
    // the homepage's, because the root's explicit openGraph values win over the
    // page's own resolved metadata — so /pricing was shared as the homepage.
    // Left unset, Next resolves each route's own title and description.
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${display.variable} ${sans.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[var(--surface)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="min-h-[60vh] scroll-mt-[72px]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
