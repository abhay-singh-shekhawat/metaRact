import type { Metadata } from "next";
import { PageHero, Card } from "@/components/ui/primitives";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "About", description: "A small three-founder digital-services studio. Details appear once approved." };

export default function AboutPage() {
  return (
    <>
      <PageHero
        title={`About ${siteConfig.studioName}`}
        lead="A small digital-services studio: websites, custom software, product design, brand assets, and practical AI integrations — each scoped in writing and quoted by a human."
      />
      <div className="container-studio grid gap-5 py-12 lg:grid-cols-2">
        <Card>
          <h2 className="text-[17px] font-semibold">How we work</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-[#596273]">
            We are a three-person team. You talk to the people doing the work. We take on a small number of scoped projects at a time, confirm everything in writing, and hand over cleanly.
          </p>
        </Card>
        <Card>
          <h2 className="text-[17px] font-semibold">Founders</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-[#596273]">
            Founder names, roles, and profiles will appear here once approved for publication. We don&apos;t invent team bios.
          </p>
        </Card>
      </div>
    </>
  );
}
