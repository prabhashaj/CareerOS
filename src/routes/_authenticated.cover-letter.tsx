import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Mail,
  Sparkles,
  Download,
  Copy,
  Check,
  RotateCcw,
  Wand2,
  Building2,
  FileText,
  Briefcase,
  History,
  Sliders,
  Send,
  Loader2,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  BookOpen,
  Mic,
  PenTool,
  Save,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { generateCoverLetter, polishCoverLetter } from "@/lib/tailoring.functions";
import { listJobs, getJob } from "@/lib/jobs.functions";
import { downloadTextAsPdf } from "@/lib/pdf";
import { exportDocx } from "@/lib/export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type CoverLetterSearch = {
  jobId?: string | undefined;
};

export const Route = createFileRoute("/_authenticated/cover-letter")({
  head: () => ({ meta: [{ title: "Cover Letter Maker — CareerOS" }] }),
  validateSearch: (s: Record<string, unknown>): CoverLetterSearch => ({
    jobId: typeof s["jobId"] === "string" ? s["jobId"] : undefined,
  }),
  component: CoverLetterPage,
});

type Tone = "confident" | "warm" | "formal" | "concise" | "executive";

const TONES: Array<{ id: Tone; label: string; desc: string; badge: string }> = [
  {
    id: "confident",
    label: "Confident & High-Impact",
    desc: "Action-oriented, metrics-driven, directly states value proposition.",
    badge: "Most Popular",
  },
  {
    id: "warm",
    label: "Warm & Storytelling",
    desc: "Engaging narrative, connects passion to company mission.",
    badge: "Culture Fit",
  },
  {
    id: "formal",
    label: "Executive & Formal",
    desc: "Traditional, polished corporate tone for enterprise and finance.",
    badge: "Enterprise",
  },
  {
    id: "concise",
    label: "Concise & Crisp",
    desc: "Under 200 words. Straight to the point, respecting hiring manager time.",
    badge: "Fast Read",
  },
  {
    id: "executive",
    label: "Strategic & Leadership",
    desc: "Focuses on ROI, scaling teams, architectural vision and outcomes.",
    badge: "Senior / Lead",
  },
];

function CoverLetterPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { jobId } = useSearch({ from: "/_authenticated/cover-letter" });

  const generateFn = useServerFn(generateCoverLetter);
  const polishFn = useServerFn(polishCoverLetter);
  const getJobFn = useServerFn(getJob);
  const listJobsFn = useServerFn(listJobs);

  // Form State
  const [selectedJobId, setSelectedJobId] = useState<string>(jobId ?? "");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState<Tone>("confident");
  const [focus, setFocus] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");

  // Editor State
  const [coverLetterText, setCoverLetterText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [customPolishPrompt, setCustomPolishPrompt] = useState("");

  // Queries
  const { data: savedJobs = [] } = useQuery({
    queryKey: ["saved-jobs", user?.id],
    enabled: !!user,
    queryFn: () => listJobsFn(),
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  // Load job details if jobId changes or selected
  useEffect(() => {
    if (selectedJobId) {
      void (async () => {
        try {
          const j = await getJobFn({ data: { id: selectedJobId } });
          if (j) {
            setJobTitle(j.title);
            setCompany(j.company);
            setJobDescription(j.description || "");
          }
        } catch {
          // ignore
        }
      })();
    }
  }, [selectedJobId, getJobFn]);

  // Load existing application cover letter if available
  useEffect(() => {
    if (selectedJobId && user) {
      void (async () => {
        const { data } = await supabase
          .from("job_applications")
          .select("cover_letter")
          .eq("user_id", user.id)
          .eq("job_id", selectedJobId)
          .maybeSingle();
        if (data?.cover_letter && !coverLetterText) {
          setCoverLetterText(data.cover_letter);
        }
      })();
    }
  }, [selectedJobId, user, coverLetterText]);

  const handleGenerate = async () => {
    if (!jobTitle.trim() && !jobDescription.trim()) {
      toast.error("Please enter a job title or paste the job description.");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("Crafting tailored cover letter with AI...");
    try {
      const res = await generateFn({
        data: {
          job_id: selectedJobId || undefined,
          job_title: jobTitle.trim() || undefined,
          company: company.trim() || undefined,
          job_description: jobDescription.trim() || undefined,
          tone,
          focus: focus.trim() || undefined,
          custom_instructions: customInstructions.trim() || undefined,
        },
      });

      setCoverLetterText(res.cover_letter);
      toast.success("Cover letter generated!", { id: toastId });
      if (selectedJobId) {
        void qc.invalidateQueries({ queryKey: ["app-for-job", selectedJobId] });
      }
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to generate cover letter", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePolish = async (instruction: string) => {
    if (!coverLetterText.trim()) {
      toast.error("Generate or write a cover letter first.");
      return;
    }

    setIsPolishing(true);
    const toastId = toast.loading(`Refining: ${instruction}...`);
    try {
      const res = await polishFn({
        data: {
          current_text: coverLetterText,
          instruction,
          job_title: jobTitle,
          company: company,
        },
      });
      setCoverLetterText(res.cover_letter);
      toast.success("Cover letter updated!", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to refine cover letter", { id: toastId });
    } finally {
      setIsPolishing(false);
    }
  };

  const handleCopy = () => {
    if (!coverLetterText) return;
    navigator.clipboard.writeText(coverLetterText);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    if (!coverLetterText) return;
    const title = `${(profile?.full_name || "Applicant").replace(/[^a-zA-Z0-9_-]/g, "_")}_Cover_Letter_${(company || "Company").replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    const header = `${profile?.full_name ?? ""}\n${profile?.headline ?? ""}\n${profile?.location ?? ""}${profile?.email ? ` • ${profile.email}` : ""}${profile?.phone ? ` • ${profile.phone}` : ""}\n\n${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}\n\nHiring Team\n${company || "The Team"}\n\n`;
    downloadTextAsPdf(header + coverLetterText, `${title}.pdf`);
    toast.success("PDF downloaded!");
  };

  const wordCount = coverLetterText.trim() ? coverLetterText.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="flex h-full flex-col lg:flex-row overflow-hidden bg-background">
      {/* ── LEFT PANE: Target Job & Customizer ── */}
      <div className="w-full lg:w-[480px] shrink-0 border-r border-border bg-card flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="border-b border-border p-5 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Mail className="size-5" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold">Cover Letter Maker</h1>
                <p className="text-xs text-muted-foreground">Bespoke letters grounded in your real profile</p>
              </div>
            </div>
            {selectedJobId && (
              <Badge variant="secondary" className="text-xs">
                Linked to JD
              </Badge>
            )}
          </div>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Target Role Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. Target Opportunity
            </Label>
            {savedJobs.length > 0 && (
              <Select
                value={selectedJobId}
                onValueChange={(val) => {
                  setSelectedJobId(val);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-secondary/40 rounded-xl">
                  <SelectValue placeholder="Select from saved target roles..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="manual" className="text-xs cursor-pointer">
                    + Custom / Paste new job description
                  </SelectItem>
                  {savedJobs.map((j) => (
                    <SelectItem key={j.id} value={j.id} className="text-xs cursor-pointer">
                      {j.title} at {j.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="job-title" className="text-[11px] font-semibold text-muted-foreground">
                  Job Title
                </Label>
                <Input
                  id="job-title"
                  placeholder="e.g. Lead AI Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="company-name" className="text-[11px] font-semibold text-muted-foreground">
                  Company Name
                </Label>
                <Input
                  id="company-name"
                  placeholder="e.g. Anthropic, Stripe"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="jd-text" className="text-[11px] font-semibold text-muted-foreground">
                Job Description / Requirements
              </Label>
              <Textarea
                id="jd-text"
                rows={4}
                placeholder="Paste the job description or key requirements here to optimize hooks and skills..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="text-xs resize-none rounded-xl leading-relaxed bg-secondary/30"
              />
            </div>
          </div>

          {/* Tone Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              2. Tone & Voice
            </Label>
            <div className="grid grid-cols-1 gap-1.5">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  type="button"
                  className={cn(
                    "flex items-start justify-between p-2.5 rounded-xl border text-left transition-all",
                    tone === t.id
                      ? "border-primary bg-primary/5 shadow-xs"
                      : "border-border/70 hover:border-primary/40 bg-secondary/20",
                  )}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs font-bold", tone === t.id ? "text-primary" : "text-foreground")}>
                        {t.label}
                      </span>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                        {t.badge}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">{t.desc}</p>
                  </div>
                  {tone === t.id && <Check className="size-4 text-primary shrink-0 mt-0.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Highlights & Custom Focus */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              3. Specific Experience to Highlight
            </Label>
            <Input
              placeholder="e.g. Lead my team's migration to Kubernetes, built LLM retrieval pipeline"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="h-8.5 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Generate Button Footer */}
        <div className="border-t border-border p-4 bg-card shrink-0">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full h-10 font-bold text-xs gap-2 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Crafting Cover Letter...
              </>
            ) : (
              <>
                <Sparkles className="size-4" /> Generate Tailored Cover Letter
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── RIGHT PANE: Live Document Editor & Polish Tools ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-muted/40">
        {/* Top Control Bar */}
        <div className="border-b border-border bg-card px-6 py-3 shrink-0 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">Document Preview</span>
              <Badge variant="secondary" className="text-[10px] font-mono">
                {wordCount} words · ~{readTime} min read
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!coverLetterText}
              className="h-8 text-xs gap-1.5 rounded-xl font-semibold"
            >
              {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
              <span>{copied ? "Copied" : "Copy Text"}</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={!coverLetterText}
              className="h-8 text-xs gap-1.5 rounded-xl font-semibold shadow-sm"
            >
              <Download className="size-3.5" />
              <span>Download PDF</span>
            </Button>
            {selectedJobId && (
              <Link to="/studio" search={{ jobId: selectedJobId }}>
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-primary">
                  <FileText className="size-3.5" />
                  <span>Resume Studio</span>
                  <ChevronRight className="size-3" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* AI Quick Polish Toolbar */}
        {coverLetterText && (
          <div className="bg-card/80 border-b border-border/80 px-6 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
            <span className="text-[11px] font-bold text-primary flex items-center gap-1 shrink-0">
              <Wand2 className="size-3" /> AI Polish:
            </span>
            <button
              onClick={() => handlePolish("Make the letter punchier, more direct, and maximize impact.")}
              disabled={isPolishing}
              className="rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors shrink-0"
            >
              ⚡ Make Punchier
            </button>
            <button
              onClick={() => handlePolish("Shorten the letter to be very crisp, under 200 words, high signal.")}
              disabled={isPolishing}
              className="rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors shrink-0"
            >
              📏 Shorten
            </button>
            <button
              onClick={() => handlePolish("Strengthen the opening hook with deep enthusiasm for the company and mission.")}
              disabled={isPolishing}
              className="rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors shrink-0"
            >
              🎣 Stronger Hook
            </button>
            <button
              onClick={() => handlePolish("Emphasize leadership, technical ownership, and architectural decision-making.")}
              disabled={isPolishing}
              className="rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors shrink-0"
            >
              👑 Emphasize Leadership
            </button>
          </div>
        )}

        {/* Live Document Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex justify-center">
          <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-8 sm:p-12 shadow-lift space-y-6">
            {/* Formal Header */}
            <div className="border-b border-border/70 pb-6 space-y-1">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                {profile?.full_name || user?.email?.split("@")[0] || "Your Name"}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-medium">
                {profile?.headline && <span>{profile.headline}</span>}
                {profile?.location && <span>• {profile.location}</span>}
                {user?.email && <span>• {user.email}</span>}
                {profile?.phone && <span>• {profile.phone}</span>}
              </div>
            </div>

            {/* Date & Recipient */}
            <div className="space-y-1 text-xs text-muted-foreground font-medium">
              <div>
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <div className="pt-2 font-semibold text-foreground">
                Hiring Team & Leadership
              </div>
              <div>{company || "Target Company"}</div>
            </div>

            {/* Editable Letter Body */}
            {coverLetterText ? (
              <div className="space-y-4">
                <Textarea
                  value={coverLetterText}
                  onChange={(e) => setCoverLetterText(e.target.value)}
                  className="min-h-[420px] w-full resize-none border-none p-0 text-sm leading-relaxed text-foreground focus-visible:ring-0 shadow-none font-sans"
                  placeholder="Your generated cover letter will appear here..."
                />
              </div>
            ) : (
              <div className="py-20 text-center space-y-4 border border-dashed border-border rounded-xl bg-secondary/10">
                <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Mail className="size-6" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="font-display text-base font-bold">Ready to craft your letter</h3>
                  <p className="text-xs text-muted-foreground">
                    Select a target job on the left, choose your tone, and click "Generate" to create a bespoke, ATS-ready cover letter.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
