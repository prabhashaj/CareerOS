import type { ResumeContent, ResumeDensity, TemplateId, SectionKey, SpacingConfig } from "@/lib/resume";
import { Mail, Phone, MapPin, Globe, Linkedin, Github } from "lucide-react";

type Props = {
  content: ResumeContent;
  template: TemplateId | string;
  density?: ResumeDensity | undefined;
  spacing?: SpacingConfig | undefined;
  scale?: number | undefined;
};

const DENSITY_CONFIG: Record<
  ResumeDensity,
  {
    gap: string;
    itemGap: string;
    line: string;
    fontSize: string;
    nameSize: string;
    titleSize: string;
    sectionHeaderSize: string;
    bulletMargin: string;
  }
> = {
  compact: {
    gap: "10px",
    itemGap: "6px",
    line: "1.32",
    fontSize: "9.5pt",
    nameSize: "18pt",
    titleSize: "10.5pt",
    sectionHeaderSize: "10.5pt",
    bulletMargin: "2px",
  },
  normal: {
    gap: "14px",
    itemGap: "8px",
    line: "1.42",
    fontSize: "10pt",
    nameSize: "21pt",
    titleSize: "11pt",
    sectionHeaderSize: "11pt",
    bulletMargin: "3px",
  },
  relaxed: {
    gap: "18px",
    itemGap: "11px",
    line: "1.55",
    fontSize: "10.5pt",
    nameSize: "24pt",
    titleSize: "12pt",
    sectionHeaderSize: "11.5pt",
    bulletMargin: "4px",
  },
};

export function formatUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function renderFormattedText(text: string) {
  if (!text) return null;
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+|mailto:[^\s\)]+|tel:[^\s\)]+)\)|((?:https?:\/\/)[^\s]+)/gi;
  const tokens: Array<{ type: "text" | "link"; text: string; url?: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", text: text.slice(lastIndex, match.index) });
    }

    if (match[1] && match[2]) {
      tokens.push({
        type: "link",
        text: match[1],
        url: formatUrl(match[2]),
      });
    } else if (match[3]) {
      const cleanUrlStr = match[3].replace(/[.,;:!?]+$/, "");
      tokens.push({
        type: "link",
        text: cleanUrlStr,
        url: formatUrl(cleanUrlStr),
      });
      if (cleanUrlStr.length < match[3].length) {
        pattern.lastIndex = match.index + cleanUrlStr.length;
      }
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: "text", text: text.slice(lastIndex) });
  }

  if (tokens.length === 0) return text;
  if (tokens.length === 1 && tokens[0]?.type === "text") return text;

  return tokens.map((t, i) => {
    if (t.type === "link" && t.url) {
      return (
        <a
          key={i}
          href={t.url}
          target="_blank"
          rel="noreferrer"
          style={{
            textDecoration: "underline",
            color: "inherit",
            textUnderlineOffset: "2px",
          }}
        >
          {t.text}
        </a>
      );
    }
    return <span key={i}>{t.text}</span>;
  });
}

export function ResumeDocument({
  content,
  template = "minimal",
  density = "normal",
  spacing: propSpacing,
  scale = 1,
}: Props) {
  const d = DENSITY_CONFIG[density] || DENSITY_CONFIG.normal;
  const isClassic = template === "classic";
  const isModern = template === "modern-compact";
  const isTechnical = template === "technical";

  const userSpacing = content.spacing || propSpacing;

  const sectionGap = userSpacing?.sectionGap !== undefined ? `${userSpacing.sectionGap}px` : d.gap;
  const itemGap = userSpacing?.itemGap !== undefined ? `${userSpacing.itemGap}px` : d.itemGap;
  const lineHeight = userSpacing?.lineHeight !== undefined ? `${userSpacing.lineHeight}` : d.line;
  const baseFontSize = userSpacing?.fontSize !== undefined ? `${userSpacing.fontSize}pt` : d.fontSize;
  const pagePadding =
    userSpacing?.pageMargin !== undefined
      ? `${userSpacing.pageMargin}px ${Math.round(userSpacing.pageMargin * 1.08)}px`
      : isModern
      ? "36px 42px"
      : "44px 48px";

  const sheetStyle: React.CSSProperties = {
    fontSize: `calc(${baseFontSize} * ${scale})`,
    lineHeight,
    padding: pagePadding,
    fontFamily: isClassic
      ? "Georgia, 'Times New Roman', Times, serif"
      : "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    color: "#1e293b",
    backgroundColor: "#ffffff",
    boxSizing: "border-box",
    width: "210mm",
    minHeight: "297mm",
    position: "relative",
  };

  const Section = ({
    title,
    isFirstOnPage = false,
    children,
  }: {
    title: string;
    isFirstOnPage?: boolean | undefined;
    children: React.ReactNode;
  }) => {
    let headerColor = "#0f172a";
    let borderBottom = "1px solid #cbd5e1";

    if (isModern) {
      headerColor = "#0d4f5c";
      borderBottom = "1.5px solid #0d4f5c";
    } else if (isClassic) {
      headerColor = "#111827";
      borderBottom = "1px solid #111827";
    }

    return (
      <section
        className="resume-section"
        style={{
          marginTop: isFirstOnPage ? "0px" : sectionGap,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isClassic ? "center" : "flex-start",
            borderBottom,
            paddingBottom: "3px",
            marginBottom: "8px",
          }}
        >
          <h2
            style={{
              fontSize: d.sectionHeaderSize,
              textTransform: "uppercase",
              letterSpacing: isClassic ? "0.08em" : "0.06em",
              fontWeight: 700,
              color: headerColor,
              margin: 0,
              padding: 0,
            }}
          >
            {title}
          </h2>
        </div>
        <div className="resume-section-body">{children}</div>
      </section>
    );
  };

  const Bullets = ({ items }: { items: string[] }) =>
    items && items.length > 0 ? (
      <ul
        style={{
          margin: "4px 0 0 0",
          paddingLeft: "18px",
          listStyleType: "disc",
        }}
      >
        {items.map((b, i) => (
          <li
            key={i}
            style={{
              marginBottom: d.bulletMargin,
              lineHeight,
              color: "#334155",
              textAlign: "left",
            }}
          >
            {renderFormattedText(b)}
          </li>
        ))}
      </ul>
    ) : null;

  const Header = () => {
    const contact = content.contact;
    const items = [
      contact.email && { key: "email", val: contact.email, href: formatUrl(`mailto:${contact.email}`), icon: Mail },
      contact.phone && { key: "phone", val: contact.phone, href: `tel:${contact.phone.replace(/[^0-9+]/g, "")}`, icon: Phone },
      contact.location && { key: "location", val: contact.location, icon: MapPin },
      contact.website && {
        key: "website",
        val: contact.website.replace(/^https?:\/\//, ""),
        href: formatUrl(contact.website),
        icon: Globe,
      },
      contact.linkedin && {
        key: "linkedin",
        val: contact.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "in/").replace(/\/$/, ""),
        href: formatUrl(contact.linkedin.startsWith("http") || contact.linkedin.includes("linkedin.com") ? contact.linkedin : `https://linkedin.com/in/${contact.linkedin}`),
        icon: Linkedin,
      },
      contact.github && {
        key: "github",
        val: contact.github.replace(/^https?:\/\/(www\.)?github\.com\//, "github.com/").replace(/\/$/, ""),
        href: formatUrl(contact.github.startsWith("http") || contact.github.includes("github.com") ? contact.github : `https://github.com/${contact.github}`),
        icon: Github,
      },
    ].filter(Boolean) as Array<{
      key: string;
      val: string;
      href?: string;
      icon: React.ComponentType<{ className?: string }>;
    }>;

    return (
      <header
        style={{
          textAlign: isClassic ? "center" : "left",
          marginBottom: isClassic ? "12px" : "8px",
          borderBottom: isClassic ? "1.5px solid #111827" : "none",
          paddingBottom: isClassic ? "10px" : "0",
        }}
      >
        <h1
          style={{
            fontSize: d.nameSize,
            fontWeight: 800,
            letterSpacing: isClassic ? "0.02em" : "-0.02em",
            color: "#0f172a",
            margin: "0 0 2px 0",
            lineHeight: 1.15,
          }}
        >
          {contact.name || "Alex Mercer"}
        </h1>

        {contact.title && (
          <div
            style={{
              fontSize: d.titleSize,
              fontWeight: 600,
              color: isModern ? "#0d4f5c" : "#475569",
              marginTop: "2px",
              marginBottom: "6px",
              letterSpacing: isClassic ? "0.04em" : "0.01em",
            }}
          >
            {contact.title}
          </div>
        )}

        {items.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: isClassic ? "center" : "flex-start",
              gap: "4px 12px",
              color: "#475569",
              fontSize: "0.92em",
              marginTop: "4px",
            }}
          >
            {items.map((item, idx) => (
              <span
                key={item.key}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {idx > 0 && isClassic && <span style={{ opacity: 0.5, margin: "0 2px" }}>•</span>}
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: "#475569",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                  >
                    {item.val}
                  </a>
                ) : (
                  <span>{item.val}</span>
                )}
              </span>
            ))}
          </div>
        )}

        {isModern && (
          <div
            style={{
              height: "3px",
              background: "#0d4f5c",
              marginTop: "10px",
              width: "48px",
              borderRadius: "2px",
            }}
          />
        )}
      </header>
    );
  };

  const SummarySection = ({ isFirstOnPage }: { isFirstOnPage?: boolean | undefined }) =>
    content.summary ? (
      <Section title="Professional Summary" isFirstOnPage={isFirstOnPage}>
        <p
          style={{
            margin: 0,
            color: "#334155",
            textAlign: "justify",
            lineHeight,
          }}
        >
          {renderFormattedText(content.summary)}
        </p>
      </Section>
    ) : null;

  const ExperienceItemView = ({ exp }: { exp: (typeof content.experience)[0] }) => {
    const dateStr = [exp.start, exp.end].filter(Boolean).join(" – ");
    return (
      <div
        key={exp.id}
        className="resume-item"
        style={{
          marginBottom: itemGap,
          breakInside: "avoid",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: "12px",
            width: "100%",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ color: "#0f172a", fontWeight: 700 }}>{exp.role}</strong>
            {exp.company && (
              <span style={{ color: isModern ? "#0d4f5c" : "#334155", fontWeight: 600 }}> · {exp.company}</span>
            )}
          </div>
          {dateStr && (
            <span
              style={{
                flexShrink: 0,
                whiteSpace: "nowrap",
                color: "#64748b",
                fontSize: "0.92em",
                fontWeight: 500,
                textAlign: "right",
              }}
            >
              {dateStr}
            </span>
          )}
        </div>

        {exp.location && (
          <div
            style={{
              color: "#64748b",
              fontSize: "0.9em",
              marginTop: "1px",
              fontStyle: isClassic ? "italic" : "normal",
            }}
          >
            {exp.location}
          </div>
        )}

        <Bullets items={exp.bullets || []} />
      </div>
    );
  };

  const ExperienceSection = ({
    items,
    isFirstOnPage,
    isContinuation = false,
  }: {
    items: typeof content.experience;
    isFirstOnPage?: boolean | undefined;
    isContinuation?: boolean | undefined;
  }) => {
    if (!items || items.length === 0) return null;
    return (
      <Section title={isContinuation ? "Work Experience (Cont.)" : "Work Experience"} isFirstOnPage={isFirstOnPage}>
        {items.map((exp) => (
          <ExperienceItemView key={exp.id} exp={exp} />
        ))}
      </Section>
    );
  };

  const EducationItemView = ({ edu }: { edu: (typeof content.education)[0] }) => {
    const dateStr = [edu.start, edu.end].filter(Boolean).join(" – ");
    return (
      <div
        key={edu.id}
        className="resume-item"
        style={{
          marginBottom: itemGap,
          breakInside: "avoid",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: "12px",
            width: "100%",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ color: "#0f172a", fontWeight: 700 }}>{edu.degree || "Degree"}</strong>
          </div>
          {dateStr && (
            <span
              style={{
                flexShrink: 0,
                whiteSpace: "nowrap",
                color: "#64748b",
                fontSize: "0.92em",
                fontWeight: 500,
                textAlign: "right",
              }}
            >
              {dateStr}
            </span>
          )}
        </div>

        {edu.school && (
          <div
            style={{
              color: isModern ? "#0d4f5c" : "#334155",
              fontWeight: 600,
              fontSize: "0.95em",
              marginTop: "1px",
            }}
          >
            {edu.school}
          </div>
        )}

        {edu.details && (
          <div
            style={{
              color: "#64748b",
              fontSize: "0.9em",
              marginTop: "1px",
              fontStyle: isClassic ? "italic" : "normal",
              lineHeight,
            }}
          >
            {renderFormattedText(edu.details)}
          </div>
        )}
      </div>
    );
  };

  const EducationSection = ({
    items,
    isFirstOnPage,
    isContinuation = false,
  }: {
    items: typeof content.education;
    isFirstOnPage?: boolean | undefined;
    isContinuation?: boolean | undefined;
  }) => {
    if (!items || items.length === 0) return null;
    return (
      <Section title={isContinuation ? "Education (Cont.)" : "Education"} isFirstOnPage={isFirstOnPage}>
        {items.map((edu) => (
          <EducationItemView key={edu.id} edu={edu} />
        ))}
      </Section>
    );
  };

  const SkillsSection = ({
    items,
    isFirstOnPage,
    isContinuation = false,
  }: {
    items: typeof content.skills;
    isFirstOnPage?: boolean | undefined;
    isContinuation?: boolean | undefined;
  }) => {
    if (!items || items.length === 0) return null;
    return (
      <Section title={isContinuation ? "Technical Skills (Cont.)" : "Technical Skills"} isFirstOnPage={isFirstOnPage}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {items.map((s) => (
            <div
              key={s.id}
              className="resume-item"
              style={{
                lineHeight,
                breakInside: "avoid",
              }}
            >
              <strong style={{ color: "#0f172a", fontWeight: 700 }}>{s.category}:</strong>{" "}
              <span style={{ color: "#334155" }}>{(s.items || []).join(", ")}</span>
            </div>
          ))}
        </div>
      </Section>
    );
  };

  const ProjectItemView = ({ p }: { p: (typeof content.projects)[0] }) => (
    <div
      key={p.id}
      className="resume-item"
      style={{
        marginBottom: itemGap,
        breakInside: "avoid",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "12px",
          width: "100%",
        }}
      >
        <strong style={{ color: "#0f172a", fontWeight: 700 }}>{p.name}</strong>
        {p.link && (
          <a
            href={formatUrl(p.link)}
            target="_blank"
            rel="noreferrer"
            style={{
              color: "#64748b",
              fontSize: "0.9em",
              flexShrink: 0,
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            {p.link.replace(/^https?:\/\//, "")}
          </a>
        )}
      </div>

      {p.description && (
        <div style={{ color: "#334155", marginTop: "1px", lineHeight }}>
          {renderFormattedText(p.description)}
        </div>
      )}

      <Bullets items={p.bullets || []} />
    </div>
  );

  const ProjectsSection = ({
    items,
    isFirstOnPage,
    isContinuation = false,
  }: {
    items: typeof content.projects;
    isFirstOnPage?: boolean | undefined;
    isContinuation?: boolean | undefined;
  }) => {
    if (!items || items.length === 0) return null;
    return (
      <Section title={isContinuation ? "Key Projects (Cont.)" : "Key Projects"} isFirstOnPage={isFirstOnPage}>
        {items.map((p) => (
          <ProjectItemView key={p.id} p={p} />
        ))}
      </Section>
    );
  };

  const CertificationsSection = ({
    items,
    isFirstOnPage,
    isContinuation = false,
  }: {
    items: typeof content.certifications;
    isFirstOnPage?: boolean | undefined;
    isContinuation?: boolean | undefined;
  }) => {
    if (!items || items.length === 0) return null;
    return (
      <Section title={isContinuation ? "Certifications (Cont.)" : "Certifications"} isFirstOnPage={isFirstOnPage}>
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          {items.map((c) => (
            <div
              key={c.id}
              className="resume-item"
              style={{
                color: "#334155",
                lineHeight,
                breakInside: "avoid",
              }}
            >
              <strong style={{ color: "#0f172a", fontWeight: 600 }}>{c.name}</strong>
              {c.issuer ? <span style={{ color: "#64748b" }}> — {c.issuer}</span> : null}
              {c.year ? <span style={{ color: "#64748b" }}> ({c.year})</span> : null}
            </div>
          ))}
        </div>
      </Section>
    );
  };

  // Technical layout (2 columns)
  if (isTechnical) {
    const hasBreaks =
      content.pageBreaks?.projects ||
      content.pageBreaks?.education ||
      content.pageBreaks?.experience ||
      content.pageBreaks?.skills ||
      content.projects?.some((p) => p.pageBreakBefore);

    if (!hasBreaks) {
      return (
        <div className="resume-document-wrapper flex flex-col gap-6 print:gap-0 items-center w-full">
          <div
            className="resume-page resume-page-sheet bg-white text-[#1e293b] shadow-2xl rounded-md ring-1 ring-slate-900/10 relative print:shadow-none print:ring-0 print:rounded-none print:m-0"
            style={sheetStyle}
          >
            <Header />
            <div style={{ display: "flex", gap: "24px", marginTop: sectionGap }}>
              <div style={{ width: "32%", flexShrink: 0 }}>
                <SkillsSection items={content.skills} />
                <EducationSection items={content.education} />
                <CertificationsSection items={content.certifications} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <SummarySection />
                <ExperienceSection items={content.experience} />
                <ProjectsSection items={content.projects} />
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Multi-page document construction based on section order & pageBreaks
  const defaultOrder: SectionKey[] = ["summary", "experience", "skills", "projects", "education", "certifications"];
  const order = content.sectionOrder && content.sectionOrder.length > 0 ? content.sectionOrder : defaultOrder;

  const pages: React.ReactNode[][] = [];
  let currentPage: React.ReactNode[] = [];

  // Page 1 begins with Header
  currentPage.push(<Header key="header" />);

  for (const sectionKey of order) {
    if (sectionKey === "summary" && content.summary) {
      if (content.pageBreaks?.summary && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
      }
      currentPage.push(<SummarySection key="summary" isFirstOnPage={currentPage.length === 0} />);
    }

    if (sectionKey === "experience" && content.experience && content.experience.length > 0) {
      if (content.pageBreaks?.experience && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
      }

      const hasItemBreaks = content.experience.some((e) => e.pageBreakBefore);
      if (!hasItemBreaks) {
        currentPage.push(
          <ExperienceSection
            key="experience"
            items={content.experience}
            isFirstOnPage={currentPage.length === 0}
          />,
        );
      } else {
        let chunk: typeof content.experience = [];
        let isCont = false;
        content.experience.forEach((exp, idx) => {
          if (exp.pageBreakBefore && (currentPage.length > 0 || chunk.length > 0)) {
            if (chunk.length > 0) {
              currentPage.push(
                <ExperienceSection
                  key={`exp-chunk-${idx}`}
                  items={chunk}
                  isContinuation={isCont}
                  isFirstOnPage={currentPage.length === 0}
                />,
              );
              chunk = [];
            }
            pages.push(currentPage);
            currentPage = [];
            isCont = true;
          }
          chunk.push(exp);
        });
        if (chunk.length > 0) {
          currentPage.push(
            <ExperienceSection
              key="exp-chunk-final"
              items={chunk}
              isContinuation={isCont}
              isFirstOnPage={currentPage.length === 0}
            />,
          );
        }
      }
    }

    if (sectionKey === "skills" && content.skills && content.skills.length > 0) {
      if (content.pageBreaks?.skills && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
      }

      const hasItemBreaks = content.skills.some((s) => s.pageBreakBefore);
      if (!hasItemBreaks) {
        currentPage.push(
          <SkillsSection
            key="skills"
            items={content.skills}
            isFirstOnPage={currentPage.length === 0}
          />,
        );
      } else {
        let chunk: typeof content.skills = [];
        let isCont = false;
        content.skills.forEach((s, idx) => {
          if (s.pageBreakBefore && (currentPage.length > 0 || chunk.length > 0)) {
            if (chunk.length > 0) {
              currentPage.push(
                <SkillsSection
                  key={`skills-chunk-${idx}`}
                  items={chunk}
                  isContinuation={isCont}
                  isFirstOnPage={currentPage.length === 0}
                />,
              );
              chunk = [];
              isCont = true;
            }
            pages.push(currentPage);
            currentPage = [];
          }
          chunk.push(s);
        });
        if (chunk.length > 0) {
          currentPage.push(
            <SkillsSection
              key="skills-chunk-final"
              items={chunk}
              isContinuation={isCont}
              isFirstOnPage={currentPage.length === 0}
            />,
          );
        }
      }
    }

    if (sectionKey === "projects" && content.projects && content.projects.length > 0) {
      if (content.pageBreaks?.projects && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
      }

      const hasItemBreaks = content.projects.some((p) => p.pageBreakBefore);
      if (!hasItemBreaks) {
        currentPage.push(
          <ProjectsSection
            key="projects"
            items={content.projects}
            isFirstOnPage={currentPage.length === 0}
          />,
        );
      } else {
        let chunk: typeof content.projects = [];
        let isCont = false;
        content.projects.forEach((p, idx) => {
          if (p.pageBreakBefore && (currentPage.length > 0 || chunk.length > 0)) {
            if (chunk.length > 0) {
              currentPage.push(
                <ProjectsSection
                  key={`proj-chunk-${idx}`}
                  items={chunk}
                  isContinuation={isCont}
                  isFirstOnPage={currentPage.length === 0}
                />,
              );
              chunk = [];
              isCont = true;
            }
            pages.push(currentPage);
            currentPage = [];
          }
          chunk.push(p);
        });
        if (chunk.length > 0) {
          currentPage.push(
            <ProjectsSection
              key="proj-chunk-final"
              items={chunk}
              isContinuation={isCont}
              isFirstOnPage={currentPage.length === 0}
            />,
          );
        }
      }
    }

    if (sectionKey === "education" && content.education && content.education.length > 0) {
      if (content.pageBreaks?.education && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
      }

      const hasItemBreaks = content.education.some((e) => e.pageBreakBefore);
      if (!hasItemBreaks) {
        currentPage.push(
          <EducationSection
            key="education"
            items={content.education}
            isFirstOnPage={currentPage.length === 0}
          />,
        );
      } else {
        let chunk: typeof content.education = [];
        let isCont = false;
        content.education.forEach((e, idx) => {
          if (e.pageBreakBefore && (currentPage.length > 0 || chunk.length > 0)) {
            if (chunk.length > 0) {
              currentPage.push(
                <EducationSection
                  key={`edu-chunk-${idx}`}
                  items={chunk}
                  isContinuation={isCont}
                  isFirstOnPage={currentPage.length === 0}
                />,
              );
              chunk = [];
              isCont = true;
            }
            pages.push(currentPage);
            currentPage = [];
          }
          chunk.push(e);
        });
        if (chunk.length > 0) {
          currentPage.push(
            <EducationSection
              key="edu-chunk-final"
              items={chunk}
              isContinuation={isCont}
              isFirstOnPage={currentPage.length === 0}
            />,
          );
        }
      }
    }

    if (sectionKey === "certifications" && content.certifications && content.certifications.length > 0) {
      if (content.pageBreaks?.certifications && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
      }

      const hasItemBreaks = content.certifications.some((c) => c.pageBreakBefore);
      if (!hasItemBreaks) {
        currentPage.push(
          <CertificationsSection
            key="certifications"
            items={content.certifications}
            isFirstOnPage={currentPage.length === 0}
          />,
        );
      } else {
        let chunk: typeof content.certifications = [];
        let isCont = false;
        content.certifications.forEach((c, idx) => {
          if (c.pageBreakBefore && (currentPage.length > 0 || chunk.length > 0)) {
            if (chunk.length > 0) {
              currentPage.push(
                <CertificationsSection
                  key={`cert-chunk-${idx}`}
                  items={chunk}
                  isContinuation={isCont}
                  isFirstOnPage={currentPage.length === 0}
                />,
              );
              chunk = [];
              isCont = true;
            }
            pages.push(currentPage);
            currentPage = [];
          }
          chunk.push(c);
        });
        if (chunk.length > 0) {
          currentPage.push(
            <CertificationsSection
              key="cert-chunk-final"
              items={chunk}
              isContinuation={isCont}
              isFirstOnPage={currentPage.length === 0}
            />,
          );
        }
      }
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  if (pages.length === 0) {
    pages.push([<Header key="header" />]);
  }

  return (
    <div className="resume-document-wrapper flex flex-col gap-6 print:gap-0 items-center w-full">
      {pages.map((pageElements, pageIndex) => (
        <div
          key={`resume-page-${pageIndex + 1}`}
          className="resume-page resume-page-sheet bg-white text-[#1e293b] shadow-2xl rounded-md ring-1 ring-slate-900/10 relative print:shadow-none print:ring-0 print:rounded-none print:m-0"
          style={{
            ...sheetStyle,
            pageBreakAfter: pageIndex < pages.length - 1 ? "always" : "auto",
            breakAfter: pageIndex < pages.length - 1 ? "page" : "auto",
          }}
        >
          {pageElements}

          {/* Page Indicator on screen */}
          {pages.length > 1 && (
            <div className="absolute bottom-3 right-4 select-none print:hidden pointer-events-none">
              <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-100/90 border border-slate-200/80 px-2 py-0.5 rounded-full shadow-xs">
                Page {pageIndex + 1} of {pages.length}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
