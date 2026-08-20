export type ResumeContact = {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
};

export type PageBreaks = {
  summary?: boolean;
  experience?: boolean;
  skills?: boolean;
  projects?: boolean;
  education?: boolean;
  certifications?: boolean;
};

export type SectionKey = "summary" | "experience" | "skills" | "projects" | "education" | "certifications";

export type ExperienceEntry = {
  id: string;
  company: string;
  role: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
  pageBreakBefore?: boolean;
};

export type EducationEntry = {
  id: string;
  school: string;
  degree: string;
  start: string;
  end: string;
  details: string;
  pageBreakBefore?: boolean;
};

export type ProjectEntry = {
  id: string;
  name: string;
  link: string;
  description: string;
  bullets: string[];
  pageBreakBefore?: boolean;
};

export type CertificationEntry = {
  id: string;
  name: string;
  issuer: string;
  year: string;
  pageBreakBefore?: boolean;
};

export type SkillGroup = {
  id: string;
  category: string;
  items: string[];
  pageBreakBefore?: boolean;
};

export type SpacingConfig = {
  sectionGap?: number | undefined; // px, e.g. 4 to 32 (default: 14)
  itemGap?: number | undefined; // px, e.g. 2 to 20 (default: 8)
  lineHeight?: number | undefined; // ratio, e.g. 1.20 to 1.80 (default: 1.42)
  fontSize?: number | undefined; // pt, e.g. 8.5 to 12 (default: 10)
  pageMargin?: number | undefined; // px, e.g. 24 to 60 (default: 44)
};

export type ResumeContent = {
  contact: ResumeContact;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillGroup[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  pageBreaks?: PageBreaks | undefined;
  sectionOrder?: SectionKey[] | undefined;
  spacing?: SpacingConfig | undefined;
};

export type ResumeDensity = "compact" | "normal" | "relaxed";

export const SPACING_PRESETS: Record<ResumeDensity, Required<SpacingConfig>> = {
  compact: {
    sectionGap: 10,
    itemGap: 6,
    lineHeight: 1.32,
    fontSize: 9.5,
    pageMargin: 36,
  },
  normal: {
    sectionGap: 14,
    itemGap: 8,
    lineHeight: 1.42,
    fontSize: 10,
    pageMargin: 44,
  },
  relaxed: {
    sectionGap: 16,
    itemGap: 10,
    lineHeight: 1.48,
    fontSize: 10.2,
    pageMargin: 46,
  },
};

export const TEMPLATES = [
  {
    id: "minimal",
    name: "Minimal",
    blurb: "Single column, generous whitespace. Safest ATS parse.",
    atsSafe: true,
  },
  {
    id: "classic",
    name: "Classic",
    blurb: "Serif headings, centred header. Traditional and reliable.",
    atsSafe: true,
  },
  {
    id: "modern-compact",
    name: "Modern Compact",
    blurb: "Tight leading, accent rules. Fits more into one page.",
    atsSafe: true,
  },
  {
    id: "technical",
    name: "Two-Column Technical",
    blurb: "Skills sidebar. Some ATS parsers mis-order columns.",
    atsSafe: false,
  },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];

export const uid = () => Math.random().toString(36).slice(2, 10);

export const emptyResume = (): ResumeContent => ({
  contact: {
    name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
    github: "",
  },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
});

export const starterResume = (): ResumeContent => ({
  contact: {
    name: "Alex Mercer",
    title: "Senior Full-Stack Engineer",
    email: "alex.mercer@example.com",
    phone: "+1 (415) 555-0134",
    location: "San Francisco, CA",
    website: "alexmercer.dev",
    linkedin: "linkedin.com/in/alexmercer",
    github: "github.com/alexmercer",
  },
  summary:
    "Full-stack engineer with 7 years building high-traffic web platforms in TypeScript and Go. Led migrations that cut p95 latency by 42% and shipped payment infrastructure processing $40M/year.",
  experience: [
    {
      id: uid(),
      company: "Northwind Labs",
      role: "Senior Software Engineer",
      location: "San Francisco, CA",
      start: "2022",
      end: "Present",
      bullets: [
        "Led the rewrite of the billing service in Go, reducing p95 checkout latency from 820ms to 470ms.",
        "Designed an event-driven ingestion pipeline handling 12M events/day on Kafka and Postgres.",
        "Mentored 4 engineers and introduced trunk-based delivery, raising deploy frequency 6x.",
      ],
    },
    {
      id: uid(),
      company: "Cobalt Systems",
      role: "Software Engineer",
      location: "Remote",
      start: "2019",
      end: "2022",
      bullets: [
        "Built a React + TypeScript design system adopted by 9 product teams.",
        "Cut CI runtime 55% by parallelising test shards and caching build artefacts.",
      ],
    },
  ],
  education: [
    {
      id: uid(),
      school: "University of Washington",
      degree: "B.S. Computer Science",
      start: "2015",
      end: "2019",
      details: "Focus: distributed systems, compilers.",
    },
  ],
  skills: [
    {
      id: uid(),
      category: "Languages",
      items: ["TypeScript", "Go", "Python", "SQL"],
    },
    {
      id: uid(),
      category: "Frameworks",
      items: ["React", "Node.js", "Next.js", "Postgres", "Kafka"],
    },
    {
      id: uid(),
      category: "Cloud & Tooling",
      items: ["AWS", "Docker", "Terraform", "GitHub Actions"],
    },
  ],
  projects: [
    {
      id: uid(),
      name: "Driftwood",
      link: "github.com/alexmercer/driftwood",
      description: "Open-source schema migration runner for Postgres.",
      bullets: ["1.2k GitHub stars; used in production by 30+ teams."],
    },
  ],
  certifications: [
    { id: uid(), name: "AWS Solutions Architect – Associate", issuer: "AWS", year: "2023" },
  ],
});

export function normalizeResume(input: unknown): ResumeContent {
  const base = emptyResume();
  if (!input || typeof input !== "object") return base;
  const raw = input as Partial<ResumeContent>;
  return {
    contact: { ...base.contact, ...(raw.contact ?? {}) },
    summary: typeof raw.summary === "string" ? raw.summary : "",
    experience: (raw.experience ?? []).map((e) => ({
      id: e?.id ?? uid(),
      company: e?.company ?? "",
      role: e?.role ?? "",
      location: e?.location ?? "",
      start: e?.start ?? "",
      end: e?.end ?? "",
      bullets: Array.isArray(e?.bullets) ? e.bullets.filter(Boolean) : [],
      pageBreakBefore: !!e?.pageBreakBefore,
    })),
    education: (raw.education ?? []).map((e) => ({
      id: e?.id ?? uid(),
      school: e?.school ?? "",
      degree: e?.degree ?? "",
      start: e?.start ?? "",
      end: e?.end ?? "",
      details: e?.details ?? "",
      pageBreakBefore: !!e?.pageBreakBefore,
    })),
    skills: (raw.skills ?? []).map((s) => ({
      id: s?.id ?? uid(),
      category: s?.category ?? "",
      items: Array.isArray(s?.items) ? s.items.filter(Boolean) : [],
      pageBreakBefore: !!s?.pageBreakBefore,
    })),
    projects: (raw.projects ?? []).map((p) => ({
      id: p?.id ?? uid(),
      name: p?.name ?? "",
      link: p?.link ?? "",
      description: p?.description ?? "",
      bullets: Array.isArray(p?.bullets) ? p.bullets.filter(Boolean) : [],
      pageBreakBefore: !!p?.pageBreakBefore,
    })),
    certifications: (raw.certifications ?? []).map((c) => ({
      id: c?.id ?? uid(),
      name: c?.name ?? "",
      issuer: c?.issuer ?? "",
      year: c?.year ?? "",
      pageBreakBefore: !!c?.pageBreakBefore,
    })),
    pageBreaks: raw.pageBreaks ?? {},
    sectionOrder: Array.isArray(raw.sectionOrder) ? raw.sectionOrder : undefined,
    spacing: raw.spacing && typeof raw.spacing === "object" ? raw.spacing : undefined,
  };
}

const STOP = new Set([
  "and","the","for","with","you","our","are","this","that","will","have","from","your","their","who","all","can","not","but","has","was","were","they","them","its","into","out","per","use","using","work","team","teams","role","job","about","across","help","also","more","most","than","then","when","what","while","within","we","us","a","an","to","of","in","on","at","as","is","be","by","or","it","if","do",
]);

export function extractKeywords(text: string, limit = 40): string[] {
  const counts = new Map<string, number>();
  for (const token of text.toLowerCase().match(/[a-z][a-z0-9+#.\-]{2,}/g) ?? []) {
    const word = token.replace(/[.\-]+$/, "");
    if (STOP.has(word) || word.length < 3) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

export function resumeToText(resume: ResumeContent): string {
  return [
    Object.values(resume.contact).join(" "),
    resume.summary,
    ...resume.experience.flatMap((e) => [e.role, e.company, ...e.bullets]),
    ...resume.education.map((e) => `${e.degree} ${e.school} ${e.details}`),
    ...resume.skills.flatMap((s) => [s.category, ...s.items]),
    ...resume.projects.flatMap((p) => [p.name, p.description, ...p.bullets]),
    ...resume.certifications.map((c) => `${c.name} ${c.issuer}`),
  ]
    .join(" ")
    .toLowerCase();
}

export type AtsReport = {
  score: number;
  matched: string[];
  missing: string[];
};

export function atsKeywordMatch(resume: ResumeContent, jobDescription: string): AtsReport {
  const keywords = extractKeywords(jobDescription, 30);
  if (keywords.length === 0) return { score: 0, matched: [], missing: [] };
  const text = resumeToText(resume);
  const matched = keywords.filter((k) => text.includes(k));
  const missing = keywords.filter((k) => !text.includes(k));
  return {
    score: Math.round((matched.length / keywords.length) * 100),
    matched,
    missing,
  };
}
