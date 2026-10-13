export interface ServiceFaq {
  q: string;
  a: string;
}

export interface ServiceDef {
  slug: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  enabled: boolean;
  formSchemaKey: string;
  deliverables: string[];
  exclusions: string[];
  faq: ServiceFaq[];
  seoTitle: string;
  seoDescription: string;
  relatedWorkSlugs: string[];
  outcomePoints: string[];
}

export const services: ServiceDef[] = [
  {
    slug: "websites-digital-experiences",
    title: "Websites & Digital Experiences",
    shortDescription: "Business websites, landing pages, and storefronts that explain clearly and load fast.",
    longDescription:
      "We design and build public-facing websites — business sites, landing and campaign pages, portfolios, content sites, storefronts, and redesigns. Every engagement starts from the outcome you need (enquiries, sales, bookings, credibility) and ends with tested, responsive pages you can maintain.",
    enabled: true,
    formSchemaKey: "websites-digital-experiences",
    deliverables: [
      "Agreed responsive pages with navigation",
      "Approved enquiry/contact forms",
      "Defined third-party integrations",
      "Browser and device checks on agreed targets",
      "Source-code handover where contracted",
      "Deployment assistance where contracted",
    ],
    exclusions: [
      "Domain registration and hosting fees",
      "Premium themes, plugins, or licensed media",
      "Copywriting unless explicitly included",
      "Third-party API usage charges",
      "Ongoing maintenance beyond agreed scope",
    ],
    faq: [
      { q: "Do you write the website copy?", a: "Only when the quote includes it. Otherwise we design around your draft and flag gaps early." },
      { q: "Who owns the website?", a: "You do, once handed over — source code and content where the quote includes handover." },
      { q: "Do you provide hosting?", a: "We assist with deployment where contracted. Hosting and domain fees remain separate." },
    ],
    seoTitle: "Websites & Digital Experiences — Business sites that convert",
    seoDescription: "Responsive business websites, landing pages, and redesigns with clear scope and human-reviewed quotes.",
    relatedWorkSlugs: [],
    outcomePoints: ["Explain the offer in seconds", "Collect enquiries reliably", "Stay fast on phones and desktops"],
  },
  {
    slug: "software-applications",
    title: "Software & Applications",
    shortDescription: "Custom web apps, dashboards, internal tools, and APIs for repeated workflows.",
    longDescription:
      "For work that lives behind a login: dashboards, internal tools, workflow apps, database-backed systems, and integrations. We define the user flows, build frontend and backend, wire roles and permissions, test the agreed paths, and hand over setup notes.",
    enabled: true,
    formSchemaKey: "software-applications",
    deliverables: [
      "Agreed user flows and screens",
      "Frontend, backend, database, and API components",
      "Role-based permissions",
      "Agreed automated and manual tests",
      "Setup and handover notes",
    ],
    exclusions: [
      "Mobile store listing management unless contracted",
      "Third-party SaaS/API subscription fees",
      "Data migration beyond agreed scope",
    ],
    faq: [
      { q: "Website or web application?", a: "If the value is information, it is a website. If the value is repeated workflows behind logins, it is software. Tell us the outcome and we will classify it." },
      { q: "Do you build mobile apps?", a: "Only when that capability is explicitly enabled. Ask — if we cannot do it well, we will say so." },
    ],
    seoTitle: "Custom Software & Applications — Dashboards, tools, APIs",
    seoDescription: "Custom web applications, dashboards, internal tools, and integrations scoped and quoted by humans.",
    relatedWorkSlugs: [],
    outcomePoints: ["Replace spreadsheets with workflows", "Give teams the right permissions", "Integrate the tools you already use"],
  },
  {
    slug: "product-design-prototyping",
    title: "Product Design & Prototyping",
    shortDescription: "Discovery, wireframes, UI design, and clickable prototypes before you commit to build.",
    longDescription:
      "Discovery, user flows, interface design, design systems, and clickable prototypes. Use this when you need to validate an idea, align stakeholders, or define an MVP before engineering starts.",
    enabled: true,
    formSchemaKey: "product-design-prototyping",
    deliverables: [
      "Agreed user flows",
      "Specified number of designed screens",
      "Clickable prototype",
      "Design files where included",
      "Handoff document with components and specs",
    ],
    exclusions: [
      "Production backend, persistence, or authentication",
      "Security review or deployment",
      "Production-ready source code unless stated",
    ],
    faq: [
      { q: "Is a prototype a working product?", a: "No. The quote states whether output is visual, interactive, functional, or production-oriented." },
      { q: "Can you also build it?", a: "Often yes — tell us upfront so the prototype is engineered for handoff." },
    ],
    seoTitle: "Product Design & Prototyping — Validate before you build",
    seoDescription: "Wireframes, UI design, design systems, and clickable prototypes with a clean engineering handoff.",
    relatedWorkSlugs: [],
    outcomePoints: ["Align on flows early", "Test with real users sooner", "De-risk the build phase"],
  },
  {
    slug: "ai-automation",
    title: "AI & Automation",
    shortDescription: "Practical model integrations, retrieval assistants, and workflow automation — evaluated honestly.",
    longDescription:
      "Defined API and model integrations, retrieval-based assistants where appropriate, workflow automation, and AI proof-of-concept work with evaluation. We assess whether prompting, retrieval, conventional software, a third-party API, or fine-tuning fits — and we do not promise accuracy without an evaluation set and acceptance criteria.",
    enabled: true,
    formSchemaKey: "ai-automation",
    deliverables: [
      "Defined integration or automation scope",
      "Evaluation set and acceptance criteria where applicable",
      "Proof-of-concept with measured results",
      "Deployment assistance where contracted",
    ],
    exclusions: [
      "Accuracy guarantees without evaluation",
      "Compute, API usage, storage, and dataset licensing costs",
      "Training on your confidential data without agreement",
    ],
    faq: [
      { q: "Will you fine-tune a model for us?", a: "Only when evidence supports it. We check prompting, retrieval, and conventional software first." },
      { q: "Do you need our data?", a: "Never send secrets or live personal data in the enquiry form. We discuss data rights during scoping." },
    ],
    seoTitle: "AI & Automation — Practical integrations, honestly evaluated",
    seoDescription: "AI integrations, retrieval assistants, and workflow automation with explicit evaluation criteria.",
    relatedWorkSlugs: [],
    outcomePoints: ["Automate repetitive triage", "Answer from your own docs", "Measure before you trust"],
  },
  {
    slug: "graphic-brand-design",
    title: "Graphic & Brand Design",
    shortDescription: "Social assets, print collateral, campaign graphics, and brand identity pieces.",
    longDescription:
      "Social media assets, posters, flyers, brochures, digital invitations, branding collateral, and campaign graphics. Each quote states dimensions, quantities, exports, revisions, source-file handoff, and asset licences.",
    enabled: true,
    formSchemaKey: "graphic-brand-design",
    deliverables: [
      "Agreed assets in specified dimensions",
      "Agreed export formats",
      "Stated revision rounds",
      "Source files where contracted",
    ],
    exclusions: [
      "Third-party stock/licence fees unless included",
      "Print production and delivery",
      "Unlimited revisions",
    ],
    faq: [
      { q: "Do I get editable source files?", a: "Only when the quote includes them. Otherwise you receive final exports." },
      { q: "Do you handle printing?", a: "We prepare print-ready files; print production itself is separate." },
    ],
    seoTitle: "Graphic & Brand Design — Assets with clear usage rights",
    seoDescription: "Social, print, and brand assets with explicit quantities, formats, and usage rights.",
    relatedWorkSlugs: [],
    outcomePoints: ["Launch campaigns faster", "Stay consistent everywhere", "Know what you own"],
  },
];

export function enabledServices(): ServiceDef[] {
  return services.filter((s) => s.enabled);
}

export function getService(slug: string): ServiceDef | undefined {
  return services.find((s) => s.slug === slug && s.enabled);
}

export function getServiceAny(slug: string): ServiceDef | undefined {
  return services.find((s) => s.slug === slug);
}
