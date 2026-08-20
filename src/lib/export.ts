import { jsPDF } from "jspdf";
import type { ResumeContent, ResumeDensity, SectionKey, SpacingConfig } from "@/lib/resume";

type TemplateStyle = {
  font: "helvetica" | "times";
  headerAlign: "left" | "center";
  primaryColor: [number, number, number];
  accentColor: [number, number, number];
  textColor: [number, number, number];
  mutedColor: [number, number, number];
  borderColor: [number, number, number];
  nameSize: number;
  titleSize: number;
  sectionHeaderSize: number;
  bodySize: number;
  smallSize: number;
  lineHeightFactor: number;
  sectionGap: number;
  itemGap: number;
};

const TEMPLATE_STYLES: Record<string, TemplateStyle> = {
  minimal: {
    font: "helvetica",
    headerAlign: "left",
    primaryColor: [15, 23, 42],      // #0f172a
    accentColor: [13, 79, 92],       // #0d4f5c
    textColor: [51, 65, 85],         // #334155
    mutedColor: [71, 85, 105],       // #475569
    borderColor: [203, 213, 225],    // #cbd5e1
    nameSize: 20,
    titleSize: 10.5,
    sectionHeaderSize: 10.5,
    bodySize: 9.5,
    smallSize: 8.5,
    lineHeightFactor: 1.35,
    sectionGap: 14,
    itemGap: 8,
  },
  classic: {
    font: "times",
    headerAlign: "center",
    primaryColor: [17, 24, 39],      // #111827
    accentColor: [17, 24, 39],       // #111827
    textColor: [31, 41, 55],         // #1f2937
    mutedColor: [75, 85, 99],        // #4b5563
    borderColor: [17, 24, 39],       // #111827
    nameSize: 21,
    titleSize: 11,
    sectionHeaderSize: 11,
    bodySize: 10,
    smallSize: 9,
    lineHeightFactor: 1.4,
    sectionGap: 15,
    itemGap: 9,
  },
  "modern-compact": {
    font: "helvetica",
    headerAlign: "left",
    primaryColor: [15, 23, 42],      // #0f172a
    accentColor: [13, 79, 92],       // #0d4f5c
    textColor: [51, 65, 85],         // #334155
    mutedColor: [71, 85, 105],       // #475569
    borderColor: [13, 79, 92],       // #0d4f5c
    nameSize: 19,
    titleSize: 10,
    sectionHeaderSize: 10,
    bodySize: 9,
    smallSize: 8,
    lineHeightFactor: 1.3,
    sectionGap: 11,
    itemGap: 6,
  },
  technical: {
    font: "helvetica",
    nameSize: 19,
    titleSize: 10,
    sectionHeaderSize: 10,
    bodySize: 9,
    smallSize: 8,
    lineHeightFactor: 1.32,
    sectionGap: 12,
    itemGap: 6,
    primaryColor: [15, 23, 42],
    accentColor: [15, 23, 42],
    mutedColor: [71, 85, 105],
    textColor: [51, 65, 85],
    borderColor: [203, 213, 225],
    headerAlign: "left",
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

export type TextToken =
  | { type: "text"; text: string }
  | { type: "link"; text: string; url: string };

export function parseInlineLinks(text: string): TextToken[] {
  if (!text) return [];
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+|mailto:[^\s\)]+|tel:[^\s\)]+)\)|((?:https?:\/\/)[^\s]+)/gi;
  const tokens: TextToken[] = [];
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

  return tokens;
}

/**
 * Generate a 100% vector-text PDF with clickable hyperlinks, selectable text,
 * exact page breaks, and ATS parsing guarantees matching the preview layout.
 */
export function generateAtsPdf(
  resume: ResumeContent,
  templateId: string = "minimal",
  density: ResumeDensity = "normal",
  spacing?: SpacingConfig | undefined,
): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const style = TEMPLATE_STYLES[templateId] || TEMPLATE_STYLES["minimal"]!;
  const densityMultiplier = density === "compact" ? 0.85 : density === "relaxed" ? 1.15 : 1.0;
  const isModern = templateId === "modern-compact";

  const userSpacing = resume.spacing || spacing;
  const sectionGap = userSpacing?.sectionGap !== undefined ? userSpacing.sectionGap : style.sectionGap * densityMultiplier;
  const itemGap = userSpacing?.itemGap !== undefined ? userSpacing.itemGap : style.itemGap * densityMultiplier;
  const lineHeightFactor = userSpacing?.lineHeight !== undefined ? userSpacing.lineHeight : style.lineHeightFactor;
  const bodySize = userSpacing?.fontSize !== undefined ? userSpacing.fontSize : style.bodySize;

  const pageWidth = doc.internal.pageSize.getWidth();   // 595.28 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 841.89 pt
  const margin = userSpacing?.pageMargin !== undefined
    ? userSpacing.pageMargin
    : templateId === "modern-compact" || density === "compact"
    ? 36
    : 44;
  const contentWidth = pageWidth - margin * 2;
  const bottomThreshold = pageHeight - margin - 15; // Clean margin buffer

  let currentY = margin;

  function ensureSpace(neededHeight: number, forceBreak: boolean = false): void {
    if (forceBreak) {
      if (currentY > margin + 15) {
        doc.addPage();
        currentY = margin;
      }
    } else if (currentY + neededHeight > bottomThreshold) {
      doc.addPage();
      currentY = margin;
    }
  }

  function setDocColor(color: [number, number, number]) {
    doc.setTextColor(color[0], color[1], color[2]);
  }

  function setDrawColor(color: [number, number, number]) {
    doc.setDrawColor(color[0], color[1], color[2]);
  }

  function renderFormattedBlock(
    text: string,
    startX: number,
    maxWidth: number,
    fontSize: number,
    fontColor: [number, number, number],
    linkColor: [number, number, number],
  ): number {
    doc.setFontSize(fontSize);
    const lineHeight = fontSize * lineHeightFactor;
    const tokens = parseInlineLinks(text);

    const hasLinks = tokens.some((t) => t.type === "link");
    if (!hasLinks) {
      setDocColor(fontColor);
      const lines = doc.splitTextToSize(text, maxWidth);
      const neededH = lines.length * lineHeight;
      ensureSpace(neededH);
      doc.text(lines, startX, currentY + fontSize * 0.8);
      return neededH;
    }

    let curX = startX;
    let blockY = currentY;
    let linesDrawn = 1;

    for (const token of tokens) {
      const isLink = token.type === "link";
      const words = token.text.split(/(\s+)/);

      for (const word of words) {
        if (!word) continue;
        const wordWidth = doc.getTextWidth(word);

        if (word.trim() && curX + wordWidth > startX + maxWidth && curX > startX) {
          curX = startX;
          blockY += lineHeight;
          linesDrawn++;
        }

        if (isLink) {
          setDocColor(linkColor);
        } else {
          setDocColor(fontColor);
        }

        doc.text(word, curX, blockY + fontSize * 0.8);

        if (isLink && word.trim() && token.url) {
          doc.link(curX, blockY, wordWidth, fontSize * 1.1, { url: token.url });
        }

        curX += wordWidth;
      }
    }

    return linesDrawn * lineHeight;
  }

  // ==================== 1. HEADER (Contact & Title) ====================
  const contact = resume.contact;
  const isCentered = style.headerAlign === "center";

  // Name
  doc.setFont(style.font, "bold");
  doc.setFontSize(style.nameSize);
  setDocColor(style.primaryColor);

  const nameText = contact.name || "Resume";
  if (isCentered) {
    doc.text(nameText, pageWidth / 2, currentY + style.nameSize * 0.8, { align: "center" });
  } else {
    doc.text(nameText, margin, currentY + style.nameSize * 0.8);
  }
  currentY += style.nameSize + 4;

  // Title / Headline
  if (contact.title) {
    doc.setFont(style.font, "normal");
    doc.setFontSize(style.titleSize);
    setDocColor(style.mutedColor);

    if (isCentered) {
      doc.text(contact.title, pageWidth / 2, currentY + style.titleSize * 0.75, { align: "center" });
    } else {
      doc.text(contact.title, margin, currentY + style.titleSize * 0.75);
    }
    currentY += style.titleSize + 4;
  }

  // Contact line items with clickable links
  const contactItems: Array<{ text: string; url?: string }> = [];
  if (contact.email) contactItems.push({ text: contact.email.trim(), url: `mailto:${contact.email.trim()}` });
  if (contact.phone) contactItems.push({ text: contact.phone.trim(), url: `tel:${contact.phone.replace(/[^0-9+]/g, "")}` });
  if (contact.location) contactItems.push({ text: contact.location.trim() });
  if (contact.website) {
    const raw = formatUrl(contact.website);
    contactItems.push({ text: contact.website.trim().replace(/^https?:\/\//, ""), url: raw });
  }
  if (contact.linkedin) {
    const raw = formatUrl(contact.linkedin.startsWith("http") || contact.linkedin.includes("linkedin.com") ? contact.linkedin : `https://linkedin.com/in/${contact.linkedin}`);
    contactItems.push({ text: contact.linkedin.trim().replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "linkedin.com/in/"), url: raw });
  }
  if (contact.github) {
    const raw = formatUrl(contact.github.startsWith("http") || contact.github.includes("github.com") ? contact.github : `https://github.com/${contact.github}`);
    contactItems.push({ text: contact.github.trim().replace(/^https?:\/\/(www\.)?github\.com\//, "github.com/"), url: raw });
  }

  if (contactItems.length > 0) {
    doc.setFont(style.font, "normal");
    doc.setFontSize(style.smallSize);

    const sep = "  •  ";
    const sepWidth = doc.getTextWidth(sep);

    // Group items into lines that fit within contentWidth
    const lines: Array<Array<{ text: string; url?: string; width: number }>> = [];
    let currentLine: Array<{ text: string; url?: string; width: number }> = [];
    let currentLineWidth = 0;

    for (const item of contactItems) {
      const itemWidth = doc.getTextWidth(item.text);
      const addedWidth = currentLine.length > 0 ? sepWidth + itemWidth : itemWidth;

      if (currentLine.length > 0 && currentLineWidth + addedWidth > contentWidth) {
        lines.push(currentLine);
        currentLine = [{ ...item, width: itemWidth }];
        currentLineWidth = itemWidth;
      } else {
        currentLine.push({ ...item, width: itemWidth });
        currentLineWidth += addedWidth;
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    const lineSpacing = style.smallSize * 1.35;

    for (const line of lines) {
      const totalLineWidth = line.reduce((acc, it, idx) => acc + it.width + (idx > 0 ? sepWidth : 0), 0);
      let x = isCentered ? (pageWidth - totalLineWidth) / 2 : margin;

      for (let i = 0; i < line.length; i++) {
        const it = line[i]!;
        setDocColor(style.mutedColor);
        doc.text(it.text, x, currentY + style.smallSize * 0.75);

        if (it.url) {
          doc.link(x, currentY, it.width, style.smallSize * 1.1, { url: it.url });
        }

        x += it.width;

        if (i < line.length - 1) {
          setDocColor(style.borderColor);
          doc.text(sep, x, currentY + style.smallSize * 0.75);
          x += sepWidth;
        }
      }

      currentY += lineSpacing;
    }
  }

  currentY += sectionGap * 0.6;

  // ==================== SECTION RENDERER ====================
  function renderSectionHeader(title: string, forcePageBreak: boolean = false) {
    ensureSpace(30, forcePageBreak);

    doc.setFont(style.font, "bold");
    doc.setFontSize(style.sectionHeaderSize);
    setDocColor(style.accentColor);

    doc.text(title.toUpperCase(), margin, currentY + style.sectionHeaderSize * 0.8);
    currentY += style.sectionHeaderSize + 3;

    // Horizontal rule
    setDrawColor(style.borderColor);
    doc.setLineWidth(0.75);
    doc.line(margin, currentY, margin + contentWidth, currentY);
    currentY += 6 * densityMultiplier;
  }

  const defaultSectionOrder: SectionKey[] = [
    "summary",
    "experience",
    "skills",
    "projects",
    "education",
    "certifications",
  ];
  const sectionOrder = resume.sectionOrder && resume.sectionOrder.length > 0
    ? resume.sectionOrder
    : defaultSectionOrder;

  for (const sectionKey of sectionOrder) {
    const isSectionBreak = !!resume.pageBreaks?.[sectionKey];

    // --- SUMMARY ---
    if (sectionKey === "summary" && resume.summary && resume.summary.trim()) {
      renderSectionHeader("Professional Summary", isSectionBreak);

      doc.setFont(style.font, "normal");
      doc.setFontSize(bodySize);

      const summaryH = renderFormattedBlock(
        resume.summary.trim(),
        margin,
        contentWidth,
        bodySize,
        style.textColor,
        style.accentColor,
      );

      currentY += summaryH + sectionGap * 0.7;
    }

    // --- EXPERIENCE ---
    if (sectionKey === "experience" && resume.experience && resume.experience.length > 0) {
      resume.experience.forEach((exp, idx) => {
        const itemBreak = !!exp.pageBreakBefore;

        if (idx === 0) {
          if ((isSectionBreak || itemBreak) && currentY > margin + 50) {
            doc.addPage();
            currentY = margin;
          }
          renderSectionHeader("Work Experience");
        } else if (itemBreak && currentY > margin + 50) {
          doc.addPage();
          currentY = margin;
          renderSectionHeader("Work Experience (Cont.)");
        }

        ensureSpace(35);

        // Role & Company (Left) + Dates (Right)
        doc.setFont(style.font, "bold");
        doc.setFontSize(bodySize);
        setDocColor(style.primaryColor);

        const roleText = exp.role + (exp.company ? `  ·  ${exp.company}` : "");
        const dateText = [exp.start, exp.end].filter(Boolean).join(" – ");

        doc.text(roleText, margin, currentY + bodySize * 0.8);
        if (dateText) {
          doc.setFont(style.font, "normal");
          setDocColor(style.mutedColor);
          doc.text(dateText, margin + contentWidth, currentY + bodySize * 0.8, { align: "right" });
        }
        currentY += bodySize + 2;

        // Location
        if (exp.location) {
          doc.setFont(style.font, "normal");
          doc.setFontSize(style.smallSize);
          setDocColor(style.mutedColor);
          doc.text(exp.location, margin, currentY + style.smallSize * 0.75);
          currentY += style.smallSize + 2;
        }

        // Bullets
        if (exp.bullets && exp.bullets.length > 0) {
          doc.setFont(style.font, "normal");
          doc.setFontSize(bodySize);

          exp.bullets.forEach((bullet) => {
            if (!bullet.trim()) return;
            const bulletH = renderFormattedBlock(
              bullet.trim(),
              margin + 14,
              contentWidth - 14,
              bodySize,
              style.textColor,
              style.accentColor,
            );

            doc.setFont(style.font, "normal");
            setDocColor(style.textColor);
            doc.text("•", margin + 3, currentY + bodySize * 0.8);

            currentY += bulletH + 1;
          });
        }

        currentY += itemGap * 0.8;
      });

      currentY += Math.max(0, sectionGap * 0.7 - itemGap * 0.8);
    }

    // --- EDUCATION ---
    if (sectionKey === "education" && resume.education && resume.education.length > 0) {
      resume.education.forEach((edu, idx) => {
        const itemBreak = !!edu.pageBreakBefore;

        if (idx === 0) {
          if ((isSectionBreak || itemBreak) && currentY > margin + 50) {
            doc.addPage();
            currentY = margin;
          }
          renderSectionHeader("Education");
        } else if (itemBreak && currentY > margin + 50) {
          doc.addPage();
          currentY = margin;
          renderSectionHeader("Education (Cont.)");
        }

        ensureSpace(35);

        // Line 1: Degree (Left) + Dates (Right)
        doc.setFont(style.font, "bold");
        doc.setFontSize(bodySize);
        setDocColor(style.primaryColor);

        const dateText = [edu.start, edu.end].filter(Boolean).join(" – ");
        const dateWidth = dateText ? doc.getTextWidth(dateText) + 12 : 0;
        const degreeLines = doc.splitTextToSize(edu.degree || "Degree", contentWidth - dateWidth);
        const degreeH = degreeLines.length * (bodySize * lineHeightFactor);

        ensureSpace(degreeH + 20);

        doc.text(degreeLines, margin, currentY + bodySize * 0.8);

        if (dateText) {
          doc.setFont(style.font, "normal");
          setDocColor(style.mutedColor);
          doc.text(dateText, margin + contentWidth, currentY + bodySize * 0.8, { align: "right" });
        }
        currentY += degreeH + 2;

        // Line 2: School / University on its own distinct line
        if (edu.school) {
          doc.setFont(style.font, isModern ? "bold" : "normal");
          doc.setFontSize(bodySize * 0.95);
          setDocColor(isModern ? style.accentColor : style.textColor);

          const schoolLines = doc.splitTextToSize(edu.school, contentWidth);
          const schoolH = schoolLines.length * (bodySize * 0.95 * lineHeightFactor);
          ensureSpace(schoolH + 10);

          doc.text(schoolLines, margin, currentY + (bodySize * 0.95) * 0.8);
          currentY += schoolH + 2;
        }

        // Line 3: Details (GPA, honors, coursework)
        if (edu.details) {
          doc.setFont(style.font, style.font === "times" ? "italic" : "normal");
          doc.setFontSize(style.smallSize);

          const detH = renderFormattedBlock(
            edu.details,
            margin,
            contentWidth,
            style.smallSize,
            style.mutedColor,
            style.accentColor,
          );
          currentY += detH + 2;
        }

        currentY += itemGap * 0.8;
      });

      currentY += Math.max(0, sectionGap * 0.7 - itemGap * 0.8);
    }

    // --- SKILLS ---
    if (sectionKey === "skills" && resume.skills && resume.skills.length > 0) {
      resume.skills.forEach((skillGroup, idx) => {
        if (!skillGroup.category && (!skillGroup.items || skillGroup.items.length === 0)) return;
        const itemBreak = !!skillGroup.pageBreakBefore;

        if (idx === 0) {
          if ((isSectionBreak || itemBreak) && currentY > margin + 50) {
            doc.addPage();
            currentY = margin;
          }
          renderSectionHeader("Technical Skills");
        } else if (itemBreak && currentY > margin + 50) {
          doc.addPage();
          currentY = margin;
          renderSectionHeader("Technical Skills (Cont.)");
        }

        const catLabel = skillGroup.category ? `${skillGroup.category}: ` : "";
        const itemsStr = (skillGroup.items || []).join(", ");

        doc.setFont(style.font, "bold");
        doc.setFontSize(bodySize);
        const catWidth = doc.getTextWidth(catLabel);

        doc.setFont(style.font, "normal");
        const wrapped = doc.splitTextToSize(itemsStr, contentWidth - catWidth);
        const groupH = Math.max(1, wrapped.length) * (bodySize * lineHeightFactor) + 2;

        ensureSpace(groupH);

        doc.setFont(style.font, "bold");
        setDocColor(style.primaryColor);
        doc.text(catLabel, margin, currentY + bodySize * 0.8);

        doc.setFont(style.font, "normal");
        setDocColor(style.textColor);

        if (wrapped.length > 0) {
          doc.text(wrapped[0], margin + catWidth, currentY + bodySize * 0.8);
          currentY += bodySize * lineHeightFactor;

          for (let i = 1; i < wrapped.length; i++) {
            doc.text(wrapped[i], margin + catWidth, currentY + bodySize * 0.8);
            currentY += bodySize * lineHeightFactor;
          }
        } else {
          currentY += bodySize * lineHeightFactor;
        }

        currentY += 3;
      });

      currentY += sectionGap * 0.7;
    }

    // --- PROJECTS ---
    if (sectionKey === "projects" && resume.projects && resume.projects.length > 0) {
      resume.projects.forEach((proj, idx) => {
        const itemBreak = !!proj.pageBreakBefore;

        if (idx === 0) {
          if ((isSectionBreak || itemBreak) && currentY > margin + 50) {
            doc.addPage();
            currentY = margin;
          }
          renderSectionHeader("Key Projects");
        } else if (itemBreak && currentY > margin + 50) {
          doc.addPage();
          currentY = margin;
          renderSectionHeader("Key Projects (Cont.)");
        }

        ensureSpace(35);

        // Project Title (Left) + Link / Live Demo (Right)
        doc.setFont(style.font, "bold");
        doc.setFontSize(bodySize);
        setDocColor(style.primaryColor);

        doc.text(proj.name, margin, currentY + bodySize * 0.8);

        if (proj.link) {
          doc.setFont(style.font, "normal");
          doc.setFontSize(style.smallSize);
          setDocColor(style.mutedColor);

          const linkDisplay = proj.link.trim().replace(/^https?:\/\//, "");
          const linkWidth = doc.getTextWidth(linkDisplay);
          const linkX = margin + contentWidth;

          doc.text(linkDisplay, linkX, currentY + bodySize * 0.8, { align: "right" });

          const rawUrl = formatUrl(proj.link);
          doc.link(linkX - linkWidth, currentY, linkWidth, bodySize * 1.1, { url: rawUrl });
        }

        currentY += bodySize + 2;

        if (proj.description) {
          doc.setFont(style.font, "normal");
          const descH = renderFormattedBlock(
            proj.description,
            margin,
            contentWidth,
            bodySize,
            style.textColor,
            style.accentColor,
          );
          currentY += descH + 2;
        }

        if (proj.bullets && proj.bullets.length > 0) {
          doc.setFont(style.font, "normal");
          doc.setFontSize(bodySize);

          proj.bullets.forEach((bullet) => {
            if (!bullet.trim()) return;
            const bulletH = renderFormattedBlock(
              bullet.trim(),
              margin + 14,
              contentWidth - 14,
              bodySize,
              style.textColor,
              style.accentColor,
            );

            doc.setFont(style.font, "normal");
            setDocColor(style.textColor);
            doc.text("•", margin + 3, currentY + bodySize * 0.8);

            currentY += bulletH + 1;
          });
        }

        currentY += itemGap * 0.8;
      });

      currentY += Math.max(0, sectionGap * 0.7 - itemGap * 0.8);
    }

    // --- CERTIFICATIONS ---
    if (sectionKey === "certifications" && resume.certifications && resume.certifications.length > 0) {
      renderSectionHeader("Certifications", isSectionBreak);

      resume.certifications.forEach((cert) => {
        const itemBreak = !!cert.pageBreakBefore;
        ensureSpace(20, itemBreak);

        doc.setFont(style.font, "bold");
        doc.setFontSize(bodySize);
        setDocColor(style.primaryColor);

        const certTitle = cert.name + (cert.issuer ? `  ·  ${cert.issuer}` : "");
        doc.text(certTitle, margin, currentY + bodySize * 0.8);

        if (cert.year) {
          doc.setFont(style.font, "normal");
          setDocColor(style.mutedColor);
          doc.text(cert.year, margin + contentWidth, currentY + bodySize * 0.8, { align: "right" });
        }
        currentY += bodySize + itemGap * 0.6;
      });

      currentY += Math.max(0, sectionGap * 0.7 - itemGap * 0.6);
    }
  }

  return doc;
}

/**
 * Main export function for downloading an ATS-compliant, 100% vector-text PDF resume directly.
 * Guarantees 100% selectable, copyable text, active clickable links, and exact page breaks.
 */
export async function exportPdf(
  elementOrId?: HTMLElement | string | null,
  filename?: string,
  resumeContent?: ResumeContent,
  template: string = "minimal",
  density: ResumeDensity = "normal",
  spacing?: SpacingConfig | undefined,
): Promise<void> {
  const safeFilename = (filename || "Resume.pdf").endsWith(".pdf")
    ? (filename || "Resume.pdf")
    : `${filename || "Resume"}.pdf`;

  // Determine target resume data
  let foundContent: ResumeContent | null = resumeContent || null;

  if (!foundContent && typeof window !== "undefined") {
    foundContent = (window as unknown as { __CURRENT_RESUME_CONTENT__?: ResumeContent }).__CURRENT_RESUME_CONTENT__ || null;
  }

  if (!foundContent) {
    let element: HTMLElement | null = null;
    if (typeof elementOrId === "string") {
      element = document.getElementById(elementOrId);
    } else if (elementOrId instanceof HTMLElement) {
      element = elementOrId;
    }
    if (!element) {
      element = document.getElementById("resume-preview-document");
    }

    if (element && (element as unknown as { __resumeContent?: ResumeContent }).__resumeContent) {
      foundContent = (element as unknown as { __resumeContent?: ResumeContent }).__resumeContent || null;
    }
  }

  if (foundContent) {
    const doc = generateAtsPdf(foundContent, template, density, spacing || foundContent.spacing);
    doc.save(safeFilename);
    return;
  }

  window.print();
}

export function printResume(): void {
  window.print();
}

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Word-compatible HTML document — opens natively in Word / Google Docs with full ATS compatibility. */
export function exportDocx(resume: ResumeContent, filename = "resume.doc") {
  const c = resume.contact;
  const parts: string[] = [];
  parts.push(`<h1 style="margin:0;font-size:20pt">${esc(c.name || "Resume")}</h1>`);
  if (c.title) parts.push(`<p style="margin:2pt 0;font-size:11pt">${esc(c.title)}</p>`);
  const line = [c.email, c.phone, c.location, c.website, c.linkedin, c.github]
    .filter(Boolean)
    .map(esc)
    .join(" &middot; ");
  if (line) parts.push(`<p style="margin:2pt 0;font-size:9pt;color:#444">${line}</p>`);

  if (resume.summary) {
    parts.push(`<h2 style="font-size:11pt;margin:14pt 0 4pt">Summary</h2>`);
    parts.push(`<p style="margin:0;font-size:10pt">${esc(resume.summary)}</p>`);
  }

  if (resume.experience.length) {
    parts.push(`<h2 style="font-size:11pt;margin:14pt 0 4pt">Experience</h2>`);
    for (const e of resume.experience) {
      parts.push(
        `<p style="margin:6pt 0 0;font-size:10pt"><b>${esc(e.role)}</b>, ${esc(e.company)}${
          e.location ? ` — ${esc(e.location)}` : ""
        } <i>(${esc(e.start)}–${esc(e.end)})</i></p>`,
      );
      if (e.bullets.length)
        parts.push(
          `<ul style="margin:2pt 0 0 16pt;font-size:10pt">${e.bullets
            .map((b) => `<li>${esc(b)}</li>`)
            .join("")}</ul>`,
        );
    }
  }

  if (resume.skills.length) {
    parts.push(`<h2 style="font-size:11pt;margin:14pt 0 4pt">Skills</h2>`);
    for (const s of resume.skills)
      parts.push(
        `<p style="margin:2pt 0;font-size:10pt"><b>${esc(s.category)}:</b> ${esc(
          s.items.join(", "),
        )}</p>`,
      );
  }

  if (resume.projects.length) {
    parts.push(`<h2 style="font-size:11pt;margin:14pt 0 4pt">Projects</h2>`);
    for (const p of resume.projects) {
      parts.push(
        `<p style="margin:6pt 0 0;font-size:10pt"><b>${esc(p.name)}</b>${
          p.link ? ` — ${esc(p.link)}` : ""
        }</p>`,
      );
      if (p.description)
        parts.push(`<p style="margin:0;font-size:10pt">${esc(p.description)}</p>`);
      if (p.bullets.length)
        parts.push(
          `<ul style="margin:2pt 0 0 16pt;font-size:10pt">${p.bullets
            .map((b) => `<li>${esc(b)}</li>`)
            .join("")}</ul>`,
        );
    }
  }

  if (resume.education.length) {
    parts.push(`<h2 style="font-size:11pt;margin:14pt 0 4pt">Education</h2>`);
    for (const e of resume.education)
      parts.push(
        `<p style="margin:5pt 0 0;font-size:10pt"><b>${esc(e.degree || "Degree")}</b>${
          e.start || e.end ? ` <i>(${esc([e.start, e.end].filter(Boolean).join("–"))})</i>` : ""
        }</p>${
          e.school ? `<p style="margin:1pt 0 0;font-size:10pt;color:#334155">${esc(e.school)}</p>` : ""
        }${e.details ? `<p style="margin:1pt 0 0;font-size:9pt;color:#666">${esc(e.details)}</p>` : ""}`,
      );
  }

  if (resume.certifications.length) {
    parts.push(`<h2 style="font-size:11pt;margin:14pt 0 4pt">Certifications</h2>`);
    for (const cert of resume.certifications)
      parts.push(
        `<p style="margin:2pt 0;font-size:10pt">${esc(cert.name)}${
          cert.issuer ? ` — ${esc(cert.issuer)}` : ""
        }${cert.year ? ` (${esc(cert.year)})` : ""}</p>`,
      );
  }

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${esc(
    c.name || "Resume",
  )}</title></head><body style="font-family:Calibri,Arial,sans-serif">${parts.join(
    "",
  )}</body></html>`;

  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
