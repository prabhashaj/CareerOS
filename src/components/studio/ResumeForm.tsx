import {
  Plus,
  Trash2,
  Briefcase,
  GraduationCap,
  Award,
  Wrench,
  User,
  FileText,
  ArrowUp,
  ArrowDown,
  Split,
  FolderGit2,
} from "lucide-react";
import type { ResumeContent, SectionKey, PageBreaks } from "@/lib/resume";
import { uid } from "@/lib/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  value: ResumeContent;
  onChange: (next: ResumeContent) => void;
};

export function ResumeForm({ value, onChange }: Props) {
  const patch = (p: Partial<ResumeContent>) => onChange({ ...value, ...p });

  const toggleSectionBreak = (key: keyof PageBreaks) => {
    patch({
      pageBreaks: {
        ...value.pageBreaks,
        [key]: !value.pageBreaks?.[key],
      },
    });
  };

  const moveSection = (key: SectionKey, dir: "up" | "down") => {
    const currentOrder =
      value.sectionOrder && value.sectionOrder.length > 0
        ? [...value.sectionOrder]
        : (["summary", "experience", "skills", "projects", "education", "certifications"] as SectionKey[]);
    const idx = currentOrder.indexOf(key);
    if (idx === -1) return;
    const targetIdx = dir === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentOrder.length) return;
    const item = currentOrder[idx];
    if (!item) return;
    currentOrder.splice(idx, 1);
    currentOrder.splice(targetIdx, 0, item);
    patch({ sectionOrder: currentOrder });
  };

  const SectionControls = ({
    sectionKey,
    hasPageBreak,
  }: {
    sectionKey: SectionKey;
    hasPageBreak?: boolean;
  }) => (
    <div className="flex items-center gap-1 shrink-0 mr-2" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => moveSection(sectionKey, "up")}
        className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        title="Move section up"
      >
        <ArrowUp className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => moveSection(sectionKey, "down")}
        className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        title="Move section down"
      >
        <ArrowDown className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => toggleSectionBreak(sectionKey)}
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium border transition-colors",
          hasPageBreak
            ? "bg-primary text-primary-foreground border-primary font-semibold"
            : "bg-secondary text-muted-foreground hover:text-foreground border-border",
        )}
        title="Force section to start on a new page"
      >
        <Split className="size-3" />
        <span>{hasPageBreak ? "Break: ON" : "New Page"}</span>
      </button>
    </div>
  );

  return (
    <div className="space-y-3">
      <Accordion
        type="multiple"
        defaultValue={["contact", "summary", "experience", "skills", "projects", "education"]}
        className="space-y-3"
      >
        {/* Contact Information */}
        <AccordionItem value="contact" className="rounded-2xl border border-border bg-card shadow-xs px-4">
          <AccordionTrigger className="text-sm font-bold hover:no-underline py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                <User className="size-4" />
              </div>
              <span className="font-semibold text-foreground">Contact Information</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3.5 pb-4 pt-1">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">Full Name</Label>
                <Input
                  className="h-8.5 text-xs font-semibold"
                  placeholder="e.g. Alex Mercer"
                  value={value.contact.name}
                  onChange={(e) => patch({ contact: { ...value.contact, name: e.target.value } })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">Headline / Target Title</Label>
                <Input
                  className="h-8.5 text-xs"
                  placeholder="e.g. Senior Full-Stack Engineer"
                  value={value.contact.title}
                  onChange={(e) => patch({ contact: { ...value.contact, title: e.target.value } })}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">Email</Label>
                <Input
                  className="h-8.5 text-xs"
                  type="email"
                  placeholder="alex.mercer@example.com"
                  value={value.contact.email}
                  onChange={(e) => patch({ contact: { ...value.contact, email: e.target.value } })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">Phone</Label>
                <Input
                  className="h-8.5 text-xs"
                  placeholder="+1 (555) 0134"
                  value={value.contact.phone}
                  onChange={(e) => patch({ contact: { ...value.contact, phone: e.target.value } })}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">Location</Label>
                <Input
                  className="h-8.5 text-xs"
                  placeholder="San Francisco, CA (or Remote)"
                  value={value.contact.location}
                  onChange={(e) => patch({ contact: { ...value.contact, location: e.target.value } })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">Portfolio / Website</Label>
                <Input
                  className="h-8.5 text-xs"
                  placeholder="alexmercer.dev"
                  value={value.contact.website}
                  onChange={(e) => patch({ contact: { ...value.contact, website: e.target.value } })}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">LinkedIn</Label>
                <Input
                  className="h-8.5 text-xs"
                  placeholder="linkedin.com/in/alexmercer"
                  value={value.contact.linkedin}
                  onChange={(e) => patch({ contact: { ...value.contact, linkedin: e.target.value } })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">GitHub / Code</Label>
                <Input
                  className="h-8.5 text-xs"
                  placeholder="github.com/alexmercer"
                  value={value.contact.github}
                  onChange={(e) => patch({ contact: { ...value.contact, github: e.target.value } })}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Summary Section */}
        <AccordionItem value="summary" className="rounded-2xl border border-border bg-card shadow-xs px-4">
          <div className="flex items-center justify-between py-3">
            <AccordionTrigger className="text-sm font-bold hover:no-underline py-0 flex-1 pr-2">
              <div className="flex items-center gap-2.5">
                <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-4" />
                </div>
                <span className="font-semibold text-foreground">Professional Summary</span>
              </div>
            </AccordionTrigger>
            <SectionControls sectionKey="summary" hasPageBreak={!!value.pageBreaks?.summary} />
          </div>
          <AccordionContent className="pb-4 pt-1">
            <Textarea
              rows={4}
              className="text-xs leading-relaxed resize-y rounded-xl border-border"
              value={value.summary}
              onChange={(e) => patch({ summary: e.target.value })}
              placeholder="High-impact 2–4 lines outlining your core expertise, career highlights, and measurable accomplishments."
            />
          </AccordionContent>
        </AccordionItem>

        {/* Experience Section */}
        <AccordionItem value="experience" className="rounded-2xl border border-border bg-card shadow-xs px-4">
          <div className="flex items-center justify-between py-3">
            <AccordionTrigger className="text-sm font-bold hover:no-underline py-0 flex-1 pr-2">
              <div className="flex items-center gap-2.5">
                <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Briefcase className="size-4" />
                </div>
                <span className="font-semibold text-foreground">Work Experience</span>
                <Badge variant="secondary" className="px-2 py-0 text-[10px] font-bold h-4">
                  {value.experience.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <SectionControls sectionKey="experience" hasPageBreak={!!value.pageBreaks?.experience} />
          </div>
          <AccordionContent className="space-y-3.5 pb-4 pt-1">
            {value.experience.map((exp, i) => (
              <div
                key={exp.id}
                className={cn(
                  "space-y-3 rounded-xl border bg-secondary/30 p-3.5 transition-colors",
                  exp.pageBreakBefore ? "border-primary/60 ring-1 ring-primary/20" : "border-border/80 hover:border-border",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    {exp.role || `Role #${i + 1}`} {exp.company ? `· ${exp.company}` : ""}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...value.experience];
                        next[i] = { ...exp, pageBreakBefore: !exp.pageBreakBefore };
                        patch({ experience: next });
                      }}
                      className={cn(
                        "flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors border",
                        exp.pageBreakBefore
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground hover:text-foreground border-border",
                      )}
                      title="Start this role on a new page"
                    >
                      <Split className="size-2.5" />
                      {exp.pageBreakBefore ? "Break (Active)" : "Split Page"}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-lg"
                      onClick={() => patch({ experience: value.experience.filter((x) => x.id !== exp.id) })}
                      title="Remove this role"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Job Title / Role</Label>
                    <Input
                      className="h-8 text-xs font-semibold"
                      placeholder="e.g. Senior Software Engineer"
                      value={exp.role}
                      onChange={(e) => {
                        const next = [...value.experience];
                        next[i] = { ...exp, role: e.target.value };
                        patch({ experience: next });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Company</Label>
                    <Input
                      className="h-8 text-xs"
                      placeholder="e.g. Northwind Labs"
                      value={exp.company}
                      onChange={(e) => {
                        const next = [...value.experience];
                        next[i] = { ...exp, company: e.target.value };
                        patch({ experience: next });
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Location</Label>
                    <Input
                      className="h-8 text-xs"
                      placeholder="e.g. San Francisco, CA"
                      value={exp.location}
                      onChange={(e) => {
                        const next = [...value.experience];
                        next[i] = { ...exp, location: e.target.value };
                        patch({ experience: next });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Start Date</Label>
                    <Input
                      className="h-8 text-xs"
                      placeholder="2022"
                      value={exp.start}
                      onChange={(e) => {
                        const next = [...value.experience];
                        next[i] = { ...exp, start: e.target.value };
                        patch({ experience: next });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">End Date</Label>
                    <Input
                      className="h-8 text-xs"
                      placeholder="Present"
                      value={exp.end}
                      onChange={(e) => {
                        const next = [...value.experience];
                        next[i] = { ...exp, end: e.target.value };
                        patch({ experience: next });
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Accomplishments & Bullet Points (One per line)
                  </Label>
                  <Textarea
                    rows={4}
                    className="text-xs leading-relaxed rounded-xl border-border"
                    placeholder="• Led rewrite of the billing service in Go, reducing latency by 42%&#10;• Designed an event-driven ingestion pipeline handling 12M events/day"
                    value={exp.bullets.join("\n")}
                    onChange={(e) => {
                      const next = [...value.experience];
                      next[i] = { ...exp, bullets: e.target.value.split("\n") };
                      patch({ experience: next });
                    }}
                  />
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              className="w-full h-8.5 text-xs gap-1.5 rounded-xl border-dashed border-border hover:border-primary/50 hover:bg-primary/5 font-semibold transition-all"
              onClick={() =>
                patch({
                  experience: [
                    ...value.experience,
                    {
                      id: uid(),
                      company: "",
                      role: "",
                      location: "",
                      start: "",
                      end: "",
                      bullets: [],
                    },
                  ],
                })
              }
            >
              <Plus className="size-3.5" /> Add Work Experience
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Skills Section */}
        <AccordionItem value="skills" className="rounded-2xl border border-border bg-card shadow-xs px-4">
          <div className="flex items-center justify-between py-3">
            <AccordionTrigger className="text-sm font-bold hover:no-underline py-0 flex-1 pr-2">
              <div className="flex items-center gap-2.5">
                <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Wrench className="size-4" />
                </div>
                <span className="font-semibold text-foreground">Skills & Technologies</span>
                <Badge variant="secondary" className="px-2 py-0 text-[10px] font-bold h-4">
                  {value.skills.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <SectionControls sectionKey="skills" hasPageBreak={!!value.pageBreaks?.skills} />
          </div>
          <AccordionContent className="space-y-3 pb-4 pt-1">
            {value.skills.map((group, i) => (
              <div key={group.id} className="space-y-2 rounded-xl border border-border/80 bg-secondary/30 p-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-1/3">
                    <Label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Category</Label>
                    <Input
                      className="h-8 text-xs font-semibold"
                      placeholder="e.g. Languages / Cloud"
                      value={group.category}
                      onChange={(e) => {
                        const next = [...value.skills];
                        next[i] = { ...group, category: e.target.value };
                        patch({ skills: next });
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Skills (Comma separated)</Label>
                    <Input
                      className="h-8 text-xs"
                      placeholder="TypeScript, Go, Python, React, PostgreSQL"
                      value={group.items.join(", ")}
                      onChange={(e) => {
                        const next = [...value.skills];
                        next[i] = { ...group, items: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) };
                        patch({ skills: next });
                      }}
                    />
                  </div>
                  <div className="pt-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
                      onClick={() => patch({ skills: value.skills.filter((x) => x.id !== group.id) })}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              className="w-full h-8.5 text-xs gap-1.5 rounded-xl border-dashed border-border hover:border-primary/50 hover:bg-primary/5 font-semibold transition-all"
              onClick={() =>
                patch({ skills: [...value.skills, { id: uid(), category: "", items: [] }] })
              }
            >
              <Plus className="size-3.5" /> Add Skill Category
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Projects Section */}
        <AccordionItem value="projects" className="rounded-2xl border border-border bg-card shadow-xs px-4">
          <div className="flex items-center justify-between py-3">
            <AccordionTrigger className="text-sm font-bold hover:no-underline py-0 flex-1 pr-2">
              <div className="flex items-center gap-2.5">
                <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FolderGit2 className="size-4" />
                </div>
                <span className="font-semibold text-foreground">Projects</span>
                <Badge variant="secondary" className="px-2 py-0 text-[10px] font-bold h-4">
                  {value.projects.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <SectionControls sectionKey="projects" hasPageBreak={!!value.pageBreaks?.projects} />
          </div>
          <AccordionContent className="space-y-3.5 pb-4 pt-1">
            {value.projects.map((p, i) => (
              <div
                key={p.id}
                className={cn(
                  "space-y-2.5 rounded-xl border bg-secondary/30 p-3.5 transition-colors",
                  p.pageBreakBefore ? "border-primary/60 ring-1 ring-primary/20" : "border-border/80 hover:border-border",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    {p.name || `Project #${i + 1}`}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...value.projects];
                        next[i] = { ...p, pageBreakBefore: !p.pageBreakBefore };
                        patch({ projects: next });
                      }}
                      className={cn(
                        "flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors border",
                        p.pageBreakBefore
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground hover:text-foreground border-border",
                      )}
                      title="Start this project on a new page"
                    >
                      <Split className="size-2.5" />
                      {p.pageBreakBefore ? "Break (Active)" : "Split Page"}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-lg"
                      onClick={() => patch({ projects: value.projects.filter((x) => x.id !== p.id) })}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Project Name</Label>
                    <Input
                      className="h-8 text-xs font-semibold"
                      placeholder="e.g. AI Orchestration Engine"
                      value={p.name}
                      onChange={(e) => {
                        const next = [...value.projects];
                        next[i] = { ...p, name: e.target.value };
                        patch({ projects: next });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Link / Repository</Label>
                    <Input
                      className="h-8 text-xs"
                      placeholder="e.g. github.com/username/project"
                      value={p.link}
                      onChange={(e) => {
                        const next = [...value.projects];
                        next[i] = { ...p, link: e.target.value };
                        patch({ projects: next });
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Short Overview</Label>
                  <Input
                    className="h-8 text-xs"
                    placeholder="High-performance workflow orchestrator with real-time streaming."
                    value={p.description}
                    onChange={(e) => {
                      const next = [...value.projects];
                      next[i] = { ...p, description: e.target.value };
                      patch({ projects: next });
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Key Technical Bullets (One per line)</Label>
                  <Textarea
                    rows={3}
                    className="text-xs leading-relaxed rounded-xl border-border"
                    placeholder="• Built distributed queues processing 50K events/minute&#10;• Reduced memory footprint by 38% using zero-copy serialization"
                    value={p.bullets.join("\n")}
                    onChange={(e) => {
                      const next = [...value.projects];
                      next[i] = { ...p, bullets: e.target.value.split("\n") };
                      patch({ projects: next });
                    }}
                  />
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              className="w-full h-8.5 text-xs gap-1.5 rounded-xl border-dashed border-border hover:border-primary/50 hover:bg-primary/5 font-semibold transition-all"
              onClick={() =>
                patch({
                  projects: [
                    ...value.projects,
                    { id: uid(), name: "", link: "", description: "", bullets: [] },
                  ],
                })
              }
            >
              <Plus className="size-3.5" /> Add Project
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Education Section */}
        <AccordionItem value="education" className="rounded-2xl border border-border bg-card shadow-xs px-4">
          <div className="flex items-center justify-between py-3">
            <AccordionTrigger className="text-sm font-bold hover:no-underline py-0 flex-1 pr-2">
              <div className="flex items-center gap-2.5">
                <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                  <GraduationCap className="size-4" />
                </div>
                <span className="font-semibold text-foreground">Education</span>
                <Badge variant="secondary" className="px-2 py-0 text-[10px] font-bold h-4">
                  {value.education.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <SectionControls sectionKey="education" hasPageBreak={!!value.pageBreaks?.education} />
          </div>
          <AccordionContent className="space-y-3.5 pb-4 pt-1">
            {value.education.map((ed, i) => (
              <div
                key={ed.id}
                className={cn(
                  "space-y-2.5 rounded-xl border bg-secondary/30 p-3.5 transition-colors",
                  ed.pageBreakBefore ? "border-primary/60 ring-1 ring-primary/20" : "border-border/80 hover:border-border",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-foreground truncate">
                      {ed.degree || `Education #${i + 1}`}
                    </div>
                    {ed.school && (
                      <div className="text-[11px] font-medium text-muted-foreground truncate">
                        {ed.school}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...value.education];
                        next[i] = { ...ed, pageBreakBefore: !ed.pageBreakBefore };
                        patch({ education: next });
                      }}
                      className={cn(
                        "flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors border",
                        ed.pageBreakBefore
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground hover:text-foreground border-border",
                      )}
                      title="Start this degree on a new page"
                    >
                      <Split className="size-2.5" />
                      {ed.pageBreakBefore ? "Break (Active)" : "Split Page"}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-lg"
                      onClick={() => patch({ education: value.education.filter((x) => x.id !== ed.id) })}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Degree & Major</Label>
                    <Input
                      className="h-8 text-xs font-semibold"
                      placeholder="B.S. in Computer Science"
                      value={ed.degree}
                      onChange={(e) => {
                        const next = [...value.education];
                        next[i] = { ...ed, degree: e.target.value };
                        patch({ education: next });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">School / University</Label>
                    <Input
                      className="h-8 text-xs"
                      placeholder="University of California, Berkeley"
                      value={ed.school}
                      onChange={(e) => {
                        const next = [...value.education];
                        next[i] = { ...ed, school: e.target.value };
                        patch({ education: next });
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Start Year</Label>
                    <Input
                      className="h-8 text-xs"
                      placeholder="2016"
                      value={ed.start}
                      onChange={(e) => {
                        const next = [...value.education];
                        next[i] = { ...ed, start: e.target.value };
                        patch({ education: next });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Graduation Year</Label>
                    <Input
                      className="h-8 text-xs"
                      placeholder="2020"
                      value={ed.end}
                      onChange={(e) => {
                        const next = [...value.education];
                        next[i] = { ...ed, end: e.target.value };
                        patch({ education: next });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Details / GPA / Honors</Label>
                    <Input
                      className="h-8 text-xs"
                      placeholder="GPA: 3.85 / 4.0, Magna Cum Laude"
                      value={ed.details}
                      onChange={(e) => {
                        const next = [...value.education];
                        next[i] = { ...ed, details: e.target.value };
                        patch({ education: next });
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              className="w-full h-8.5 text-xs gap-1.5 rounded-xl border-dashed border-border hover:border-primary/50 hover:bg-primary/5 font-semibold transition-all"
              onClick={() =>
                patch({
                  education: [
                    ...value.education,
                    { id: uid(), school: "", degree: "", start: "", end: "", details: "" },
                  ],
                })
              }
            >
              <Plus className="size-3.5" /> Add Education
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Certifications Section */}
        <AccordionItem value="certifications" className="rounded-2xl border border-border bg-card shadow-xs px-4">
          <div className="flex items-center justify-between py-3">
            <AccordionTrigger className="text-sm font-bold hover:no-underline py-0 flex-1 pr-2">
              <div className="flex items-center gap-2.5">
                <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Award className="size-4" />
                </div>
                <span className="font-semibold text-foreground">Certifications & Licenses</span>
                <Badge variant="secondary" className="px-2 py-0 text-[10px] font-bold h-4">
                  {value.certifications.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <SectionControls sectionKey="certifications" hasPageBreak={!!value.pageBreaks?.certifications} />
          </div>
          <AccordionContent className="space-y-3 pb-4 pt-1">
            {value.certifications.map((c, i) => (
              <div key={c.id} className="space-y-2 rounded-xl border border-border/80 bg-secondary/30 p-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Certification Title</Label>
                    <Input
                      className="h-8 text-xs font-semibold"
                      placeholder="AWS Certified Solutions Architect"
                      value={c.name}
                      onChange={(e) => {
                        const next = [...value.certifications];
                        next[i] = { ...c, name: e.target.value };
                        patch({ certifications: next });
                      }}
                    />
                  </div>
                  <div className="w-1/3">
                    <Label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Issuer</Label>
                    <Input
                      className="h-8 text-xs"
                      placeholder="Amazon Web Services"
                      value={c.issuer}
                      onChange={(e) => {
                        const next = [...value.certifications];
                        next[i] = { ...c, issuer: e.target.value };
                        patch({ certifications: next });
                      }}
                    />
                  </div>
                  <div className="w-20">
                    <Label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Year</Label>
                    <Input
                      className="h-8 text-xs"
                      placeholder="2023"
                      value={c.year}
                      onChange={(e) => {
                        const next = [...value.certifications];
                        next[i] = { ...c, year: e.target.value };
                        patch({ certifications: next });
                      }}
                    />
                  </div>
                  <div className="pt-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
                      onClick={() => patch({ certifications: value.certifications.filter((x) => x.id !== c.id) })}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              className="w-full h-8.5 text-xs gap-1.5 rounded-xl border-dashed border-border hover:border-primary/50 hover:bg-primary/5 font-semibold transition-all"
              onClick={() =>
                patch({
                  certifications: [
                    ...value.certifications,
                    { id: uid(), name: "", issuer: "", year: "" },
                  ],
                })
              }
            >
              <Plus className="size-3.5" /> Add Certification
            </Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
