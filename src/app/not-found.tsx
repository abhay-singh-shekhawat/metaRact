import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function NotFound() {
  return (
    <section className="container-studio max-w-xl pt-20 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
      <p className="mt-3 text-[var(--ink-2)]">
        The page you&apos;re looking for doesn&apos;t exist or was moved.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="btn-primary">Home</Link>
        <Link href="/start-project" className="btn-secondary">{siteConfig.primaryCta}</Link>
      </div>
    </section>
  );
}
