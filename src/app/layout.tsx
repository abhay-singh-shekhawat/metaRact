import type { Metadata } from "next";
import "../styles/globals.css";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { siteConfig } from "@/config/site";

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
    title: `${siteConfig.studioName} — Websites, Software, Design & AI`,
    description: "Tell us about your project. A human reviews every brief and replies from your contact details.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="min-h-[60vh]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
