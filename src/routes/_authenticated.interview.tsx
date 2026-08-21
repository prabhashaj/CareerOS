import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Mic,
  Sparkles,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Brain,
  MessageSquare,
  Award,
  ChevronRight,
  Download,
  Copy,
  RotateCcw,
  Target,
  FileText,
  Sliders,
  Send,
  Loader2,
  Building2,
  Briefcase,
  Play,
  Check,
  AlertCircle,
  TrendingUp,
  Zap,
  Wand2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { prepInterview, evaluateMockAnswer } from "@/lib/interview.functions";
import { listJobs, getJob } from "@/lib/jobs.functions";
import { downloadTextAsPdf } from "@/lib/pdf";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type InterviewSearch = {
  jobId?: string | undefined;
};

export const Route = createFileRoute("/_authenticated/interview")({
  head: () => ({ meta: [{ title: "Interview Preparation Studio — CareerOS" }] }),
  validateSearch: (s: Record<string, unknown>): InterviewSearch => ({
    jobId: typeof s["jobId"] === "string" ? s["jobId"] : undefined,
  }),
  component: InterviewStudioPage,
});

type PrepOutput = Awaited<ReturnType<typeof prepInterview>>;
type FeedbackOutput = Awaited<ReturnType<typeof evaluateMockAnswer>>;

function InterviewStudioPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { jobId } = useSearch({ from: "/_authenticated/interview" });

  const prepFn = useServerFn(prepInterview);
  const evalFn = useServerFn(evaluateMockAnswer);
  const getJobFn = useServerFn(getJob);
  const listJobsFn = useServerFn(listJobs);

  // Form state
  const [selectedJobId, setSelectedJobId] = useState<string>(jobId ?? "");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [focus, setFocus] = useState<"mixed" | "behavioral" | "technical">("mixed");

  // Output state
  const [isGenerating, setIsGenerating] = useState(false);
  const [prepData, setPrepData] = useState<PrepOutput | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Mock Practice State
  const [practiceQuestion, setPracticeQuestion] = useState<string>("");
  const [practiceCategory, setPracticeCategory] = useState<string>("");
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<FeedbackOutput | null>(null);

  // Queries
  const { data: savedJobs = [] } = useQuery({
    queryKey: ["saved-jobs", user?.id],
    enabled: !!user,
    queryFn: () => listJobsFn(),
  });

  // Load selected job details
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

  const handleGeneratePrep = async () => {
    if (!jobTitle.trim() && !jobDescription.trim()) {
      toast.error("Please provide a job title or paste the job description.");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("Synthesizing tailored interview questions & STAR stories...");
    try {
      const res = await prepFn({
        data: {
          job_id: selectedJobId || undefined,
          job_title: jobTitle.trim() || undefined,
          company: company.trim() || undefined,
          job_description: jobDescription.trim() || undefined,
          focus,
        },
      });

      setPrepData(res);
      if (res.questions.length > 0 && !practiceQuestion) {
        setPracticeQuestion(res.questions[0]?.q || "");
        setPracticeCategory(res.questions[0]?.category || "");
      }
      toast.success("Interview Prep Pack Ready!", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to generate interview prep", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEvaluatePractice = async () => {
    if (!practiceQuestion.trim()) {
      toast.error("Select or enter an interview question to practice.");
      return;
    }
    if (!userAnswer.trim() || userAnswer.trim().length < 15) {
      toast.error("Please provide a more detailed answer to evaluate.");
      return;
    }

    setIsEvaluating(true);
    const toastId = toast.loading("Analyzing answer clarity, STAR structure, and impact...");
    try {
      const res = await evalFn({
        data: {
          question: practiceQuestion,
          user_answer: userAnswer,
          job_title: jobTitle,
          company: company,
          category: practiceCategory,
        },
      });
      setEvaluation(res);
      toast.success(`Score: ${res.score}/100 — Feedback ready!`, { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Evaluation failed", { id: toastId });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleExportPdf = () => {
    if (!prepData) return;
    let text = `INTERVIEW PREPARATION PACK\nRole: ${jobTitle} at ${company}\nGenerated: ${new Date().toLocaleDateString()}\n\n`;
    
    text += `=== 1. ELEVATOR PITCH & SUMMARY ===\n${prepData.cheat_sheet.elevator_pitch}\n\n`;
    text += `Top Skills to Highlight: ${prepData.cheat_sheet.top_skills_to_highlight.join(", ")}\n`;
    text += `Key Metrics: ${prepData.cheat_sheet.key_metrics.join(" • ")}\n\n`;

    text += `=== 2. TARGETED INTERVIEW QUESTIONS ===\n`;
    prepData.questions.forEach((q, i) => {
      text += `\n[Q${i + 1}] (${q.category.toUpperCase()}) ${q.q}\nWhy asked: ${q.why_asked}\nTalking points: ${q.tips}\n`;
    });

    text += `\n\n=== 3. STAR STORY BANK ===\n`;
    prepData.star_stories.forEach((s, i) => {
      text += `\nStory ${i + 1}: ${s.title}\nSituation: ${s.situation}\nTask: ${s.task}\nAction: ${s.action}\nResult: ${s.result}\nAnswers: ${s.covers_questions.join("; ")}\n`;
    });

    text += `\n\n=== 4. QUESTIONS TO ASK THE INTERVIEWER ===\n`;
    prepData.questions_to_ask.forEach((q, i) => {
      text += `- ${q}\n`;
    });

    downloadTextAsPdf(text, `${(jobTitle || "Role").replace(/[^a-zA-Z0-9_-]/g, "_")}_Interview_Prep.pdf`);
    toast.success("Interview guide exported to PDF!");
  };

  const filteredQuestions = prepData?.questions.filter((q) => {
    if (activeCategory === "all") return true;
    return q.category === activeCategory;
  }) ?? [];

  return (
    <div className="flex h-full flex-col lg:flex-row overflow-hidden bg-background">
      {/* ── LEFT PANE: Target Job & Strategy ── */}
      <div className="w-full lg:w-[420px] shrink-0 border-r border-border bg-card flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="border-b border-border p-5 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Mic className="size-5" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold">Interview Studio</h1>
                <p className="text-xs text-muted-foreground">Targeted drills, STAR stories & mock coach</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Job Settings */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Target Job
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
                  <SelectItem value="custom" className="text-xs cursor-pointer">
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

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="int-title" className="text-[11px] font-semibold text-muted-foreground">
                  Job Title
                </Label>
                <Input
                  id="int-title"
                  placeholder="e.g. Senior Frontend Eng"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="int-comp" className="text-[11px] font-semibold text-muted-foreground">
                  Company Name
                </Label>
                <Input
                  id="int-comp"
                  placeholder="e.g. Stripe, Figma"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="int-jd" className="text-[11px] font-semibold text-muted-foreground">
                Job Description / Core Requirements
              </Label>
              <Textarea
                id="int-jd"
                rows={5}
                placeholder="Paste key responsibilities and requirements..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="text-xs resize-none rounded-xl leading-relaxed bg-secondary/30"
              />
            </div>
          </div>

          {/* Focus */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Interview Focus
            </Label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["mixed", "behavioral", "technical"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFocus(f)}
                  type="button"
                  className={cn(
                    "rounded-xl py-2 text-xs font-semibold border capitalize transition-all",
                    focus === f
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-secondary/40 text-muted-foreground hover:text-foreground border-border",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Footer */}
        <div className="border-t border-border p-4 bg-card shrink-0">
          <Button
            onClick={handleGeneratePrep}
            disabled={isGenerating}
            className="w-full h-10 font-bold text-xs gap-2 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Analyzing Job & Candidate Context...
              </>
            ) : (
              <>
                <Sparkles className="size-4" /> Generate Full Interview Prep Pack
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── RIGHT PANE: Multi-tab Interactive Prep Studio ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-muted/40">
        {/* Top Bar */}
        <div className="border-b border-border bg-card px-6 py-3 shrink-0 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-semibold text-xs">
              {jobTitle || "Role"} {company ? `• ${company}` : ""}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {prepData && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPdf}
                className="h-8 text-xs gap-1.5 rounded-xl font-semibold"
              >
                <Download className="size-3.5" />
                <span>Export PDF Pack</span>
              </Button>
            )}
            {selectedJobId && (
              <Link to="/studio" search={{ jobId: selectedJobId }}>
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-primary">
                  <FileText className="size-3.5" />
                  <span>Resume</span>
                  <ChevronRight className="size-3" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Tabs Container */}
        {prepData ? (
          <Tabs defaultValue="drills" className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b border-border bg-card/60 px-6 py-2 shrink-0">
              <TabsList className="bg-secondary/50 rounded-xl">
                <TabsTrigger value="drills" className="text-xs font-semibold rounded-lg gap-1.5">
                  <Play className="size-3 text-primary" /> Mock Practice & Drills
                </TabsTrigger>
                <TabsTrigger value="questions" className="text-xs font-semibold rounded-lg gap-1.5">
                  <HelpCircle className="size-3" /> Questions Bank ({prepData.questions.length})
                </TabsTrigger>
                <TabsTrigger value="star" className="text-xs font-semibold rounded-lg gap-1.5">
                  <Award className="size-3" /> STAR Story Bank ({prepData.star_stories.length})
                </TabsTrigger>
                <TabsTrigger value="cheatsheet" className="text-xs font-semibold rounded-lg gap-1.5">
                  <Zap className="size-3" /> 10-Min Cheat Sheet
                </TabsTrigger>
                <TabsTrigger value="reverse" className="text-xs font-semibold rounded-lg gap-1.5">
                  <MessageSquare className="size-3" /> Reverse Questions ({prepData.questions_to_ask.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: Mock Practice Simulator */}
            <TabsContent value="drills" className="flex-1 overflow-y-auto p-6 space-y-6 mt-0">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 max-w-7xl mx-auto">
                {/* Practice Left: Question Picker & Answer Input */}
                <div className="xl:col-span-7 space-y-5">
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Target className="size-3.5 text-primary" /> Select Question to Practice
                      </span>
                      {practiceCategory && (
                        <Badge variant="outline" className="capitalize text-[10px]">
                          {practiceCategory.replace("_", " ")}
                        </Badge>
                      )}
                    </div>
                    <Select
                      value={practiceQuestion}
                      onValueChange={(val) => {
                        setPracticeQuestion(val);
                        const match = prepData.questions.find((q) => q.q === val);
                        if (match) setPracticeCategory(match.category);
                      }}
                    >
                      <SelectTrigger className="h-10 text-xs rounded-xl font-semibold bg-secondary/30">
                        <SelectValue placeholder="Select a question to practice..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-72 rounded-xl">
                        {prepData.questions.map((q, i) => (
                          <SelectItem key={i} value={q.q} className="text-xs cursor-pointer">
                            [{q.category.toUpperCase()}] {q.q}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {practiceQuestion && (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-1">
                        <div className="font-semibold text-xs text-foreground">
                          {practiceQuestion}
                        </div>
                        {prepData.questions.find((q) => q.q === practiceQuestion)?.why_asked && (
                          <div className="text-[11px] text-muted-foreground">
                            <span className="font-semibold text-primary">Interviewer Goal:</span>{" "}
                            {prepData.questions.find((q) => q.q === practiceQuestion)?.why_asked}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Answer Input Box */}
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="mock-ans" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Your Practice Answer (Type or record your response)
                      </Label>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {userAnswer.trim().split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>

                    <Textarea
                      id="mock-ans"
                      rows={8}
                      placeholder="Structure your answer using STAR: Describe the Situation & Task, the concrete Actions you took, and the measurable Results..."
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      className="text-xs leading-relaxed rounded-xl resize-none bg-secondary/30"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const sample = prepData.star_stories[0];
                          if (sample) {
                            setUserAnswer(
                              `In my previous project (${sample.title}), ${sample.situation} My task was ${sample.task}. I ${sample.action}, which resulted in ${sample.result}.`,
                            );
                          }
                        }}
                        className="text-[11px] text-muted-foreground hover:text-foreground h-8"
                      >
                        Load sample STAR answer
                      </Button>

                      <Button
                        onClick={handleEvaluatePractice}
                        disabled={isEvaluating}
                        className="font-bold text-xs h-9 px-4 gap-1.5 rounded-xl shadow-sm"
                      >
                        {isEvaluating ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" /> Scoring...
                          </>
                        ) : (
                          <>
                            <Sparkles className="size-3.5" /> Evaluate My Answer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Practice Right: Real-time AI Evaluation */}
                <div className="xl:col-span-5 space-y-5">
                  {evaluation ? (
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-border/70 pb-4">
                        <div>
                          <h3 className="font-display text-base font-bold text-foreground">AI Coach Evaluation</h3>
                          <p className="text-xs text-muted-foreground">{evaluation.summary_verdict}</p>
                        </div>
                        <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary font-display text-xl font-bold">
                          {evaluation.score}
                        </div>
                      </div>

                      {/* Score Metrics */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl border border-border bg-secondary/40 p-2.5">
                          <div className="text-[10px] text-muted-foreground uppercase font-bold">Clarity</div>
                          <div className="font-display text-base font-bold text-foreground mt-0.5">{evaluation.clarity_score}%</div>
                        </div>
                        <div className="rounded-xl border border-border bg-secondary/40 p-2.5">
                          <div className="text-[10px] text-muted-foreground uppercase font-bold">STAR Structure</div>
                          <div className="font-display text-base font-bold text-foreground mt-0.5">{evaluation.structure_score}%</div>
                        </div>
                        <div className="rounded-xl border border-border bg-secondary/40 p-2.5">
                          <div className="text-[10px] text-muted-foreground uppercase font-bold">Impact</div>
                          <div className="font-display text-base font-bold text-foreground mt-0.5">{evaluation.impact_score}%</div>
                        </div>
                      </div>

                      {/* Strengths & Weaknesses */}
                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="font-bold text-success flex items-center gap-1 mb-1">
                            <CheckCircle2 className="size-3.5" /> Strengths
                          </span>
                          <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                            {evaluation.strengths.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <span className="font-bold text-destructive flex items-center gap-1 mb-1">
                            <AlertCircle className="size-3.5" /> Areas for Improvement
                          </span>
                          <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                            {evaluation.weaknesses.map((w, i) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Model Improved Answer */}
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1.5">
                        <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                          <Wand2 className="size-3.5" /> Improved Model Answer:
                        </span>
                        <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                          {evaluation.improved_model_answer}
                        </p>
                      </div>

                      {/* Follow-up Question */}
                      {evaluation.follow_up_question && (
                        <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-1">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">
                            Potential Follow-Up Question:
                          </span>
                          <p className="text-xs font-semibold text-foreground">
                            "{evaluation.follow_up_question}"
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center space-y-3">
                      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary text-primary">
                        <Brain className="size-6" />
                      </div>
                      <div className="space-y-1 max-w-xs mx-auto">
                        <h4 className="font-display text-sm font-bold">Answer Evaluation Standby</h4>
                        <p className="text-xs text-muted-foreground">
                          Type your answer on the left and click "Evaluate My Answer" to get instant AI scoring, STAR analysis, and an authoritative model answer.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Full Questions Bank */}
            <TabsContent value="questions" className="flex-1 overflow-y-auto p-6 space-y-4 mt-0">
              <div className="max-w-5xl mx-auto space-y-4">
                {/* Filter categories */}
                <div className="flex flex-wrap items-center gap-2">
                  {["all", "technical", "behavioral", "role_specific", "company_fit", "system_design"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold border capitalize transition-all",
                        activeCategory === cat
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground hover:text-foreground border-border",
                      )}
                    >
                      {cat.replace("_", " ")}
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredQuestions.map((q, idx) => (
                    <div key={idx} className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="secondary" className="capitalize text-[10px]">
                          {q.category.replace("_", " ")}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPracticeQuestion(q.q);
                            setPracticeCategory(q.category);
                            toast.success("Loaded into Mock Practice tab!");
                          }}
                          className="h-6 text-[10px] text-primary gap-1 px-2"
                        >
                          <Play className="size-2.5" /> Practice
                        </Button>
                      </div>
                      <h4 className="font-semibold text-xs leading-snug text-foreground">{q.q}</h4>
                      <div className="space-y-1 text-[11px] text-muted-foreground border-t border-border/60 pt-2">
                        <div>
                          <span className="font-semibold text-foreground">Why they ask:</span> {q.why_asked}
                        </div>
                        <div>
                          <span className="font-semibold text-primary">Key points to hit:</span> {q.tips}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: STAR Story Bank */}
            <TabsContent value="star" className="flex-1 overflow-y-auto p-6 space-y-4 mt-0">
              <div className="max-w-5xl mx-auto space-y-4">
                <div className="space-y-1">
                  <h3 className="font-display text-base font-bold">STAR Story Bank</h3>
                  <p className="text-xs text-muted-foreground">
                    Real candidate experiences mapped directly into Situation, Task, Action, and Result format to answer multiple interview questions.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {prepData.star_stories.map((s, idx) => (
                    <div key={idx} className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <h4 className="font-display text-sm font-bold text-primary">{s.title}</h4>
                        <Badge variant="outline" className="text-[10px]">
                          Story #{idx + 1}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="rounded-lg bg-secondary/30 p-2">
                          <span className="font-bold text-foreground">Situation:</span>{" "}
                          <span className="text-muted-foreground">{s.situation}</span>
                        </div>
                        <div className="rounded-lg bg-secondary/30 p-2">
                          <span className="font-bold text-foreground">Task:</span>{" "}
                          <span className="text-muted-foreground">{s.task}</span>
                        </div>
                        <div className="rounded-lg bg-secondary/30 p-2">
                          <span className="font-bold text-foreground">Action:</span>{" "}
                          <span className="text-muted-foreground">{s.action}</span>
                        </div>
                        <div className="rounded-lg bg-primary/5 border border-primary/20 p-2">
                          <span className="font-bold text-primary">Result:</span>{" "}
                          <span className="text-foreground">{s.result}</span>
                        </div>
                      </div>

                      {s.covers_questions.length > 0 && (
                        <div className="border-t border-border/60 pt-2 text-[10px] text-muted-foreground">
                          <span className="font-semibold">Covers questions:</span> {s.covers_questions.join(" • ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: Cheat Sheet */}
            <TabsContent value="cheatsheet" className="flex-1 overflow-y-auto p-6 space-y-6 mt-0">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-2 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Zap className="size-3.5" /> 60-Second Elevator Pitch
                  </span>
                  <p className="text-sm leading-relaxed font-medium text-foreground">
                    "{prepData.cheat_sheet.elevator_pitch}"
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                    <h4 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Key Metrics to Quote
                    </h4>
                    <ul className="space-y-1.5 text-xs text-foreground">
                      {prepData.cheat_sheet.key_metrics.map((m, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary font-bold">✓</span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                    <h4 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Top Skills & Buzzwords to Highlight
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {prepData.cheat_sheet.top_skills_to_highlight.map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-semibold">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                  <h4 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Company Talking Points & Strategic Alignment
                  </h4>
                  <ul className="space-y-1.5 text-xs text-foreground">
                    {prepData.cheat_sheet.company_talking_points.map((tp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-accent font-bold">★</span>
                        <span>{tp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>

            {/* TAB 5: Reverse Questions */}
            <TabsContent value="reverse" className="flex-1 overflow-y-auto p-6 space-y-4 mt-0">
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="space-y-1">
                  <h3 className="font-display text-base font-bold">High-Signal Questions to Ask the Interviewer</h3>
                  <p className="text-xs text-muted-foreground">
                    Demonstrate senior business acumen, deep curiosity, and leadership thinking.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {prepData.questions_to_ask.map((q, idx) => (
                    <div key={idx} className="rounded-xl border border-border bg-card p-4 flex items-start gap-3 shadow-xs">
                      <span className="grid size-6 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-xs shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-xs font-semibold text-foreground pt-0.5">{q}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="grid size-14 place-items-center rounded-3xl bg-primary/10 text-primary shadow-inner">
              <Mic className="size-7" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="font-display text-lg font-bold">Ready to Prepare for Your Interview</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Select a target role on the left and click "Generate Full Interview Prep Pack" to build personalized question banks, STAR stories, elevator pitch, and live mock drills.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
