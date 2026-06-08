import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Sparkles, Wand2, FileText, MessageSquare, Send, Download, Save, ShieldCheck, GraduationCap, Mic, Brain, RefreshCw } from "lucide-react";
import { getJob } from "@/lib/jobs.functions";
import { rankJob } from "@/lib/ranking.functions";
import { tailorResume, generateCoverLetter, generateAnswer } from "@/lib/tailoring.functions";
import { runApplyPipeline } from "@/lib/orchestration.functions";
import { getApplicationForJob, updateApplicationStatus, updateApplicationContent, type ApplicationStatus } from "@/lib/applications.functions";
import { reviewApplicationDraft, type ReviewResult } from "@/lib/reviewer.functions";
import { upskillPlan } from "@/lib/upskill.functions";
import { prepInterview } from "@/lib/interview.functions";
import { behavioralDrills } from "@/lib/behavioral.functions";

import { refineDraft } from "@/lib/refine.functions";
import { downloadTextAsPdf } from "@/lib/pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export const Route = createFileRoute("/_authenticated/jobs/$jobId")({
  head: () => ({ meta: [{ title: "Job — CareerOS" }] }),
  component: JobDetail,
});


function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <Badge variant="outline">Not scored</Badge>;
  const pct = Math.round(score * 100);
  const variant = pct >= 75 ? "default" : pct >= 50 ? "secondary" : "outline";
  return <Badge variant={variant}>{pct}% match</Badge>;
}

function JobDetail() {
  const { jobId } = Route.useParams();
  const qc = useQueryClient();
  const getJobFn = useServerFn(getJob);
  const getAppFn = useServerFn(getApplicationForJob);
  const rank = useServerFn(rankJob);
  const tailor = useServerFn(tailorResume);
  const cover = useServerFn(generateCoverLetter);
  const answerFn = useServerFn(generateAnswer);
  const pipeline = useServerFn(runApplyPipeline);
  const setStatus = useServerFn(updateApplicationStatus);
  const saveContent = useServerFn(updateApplicationContent);
  const reviewFn = useServerFn(reviewApplicationDraft);
  const upskillFn = useServerFn(upskillPlan);
  const interviewFn = useServerFn(prepInterview);
  const behavioralFn = useServerFn(behavioralDrills);
  const refineFn = useServerFn(refineDraft);

  const job = useQuery({ queryKey: ["job", jobId], queryFn: () => getJobFn({ data: { id: jobId } }) });
  const app = useQuery({ queryKey: ["app-for-job", jobId], queryFn: () => getAppFn({ data: { job_id: jobId } }) });

  const [busy, setBusy] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [resumeDraft, setResumeDraft] = useState("");
  const [coverDraft, setCoverDraft] = useState("");
  const [resumeRefine, setResumeRefine] = useState("");
  const [coverRefine, setCoverRefine] = useState("");
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [upskill, setUpskill] = useState<Awaited<ReturnType<typeof upskillPlan>> | null>(null);
  const [interview, setInterview] = useState<Awaited<ReturnType<typeof prepInterview>> | null>(null);
  const [behavioral, setBehavioral] = useState<Awaited<ReturnType<typeof behavioralDrills>> | null>(null);

  const validTabs = ["overview","resume","cover","answers","review","upskill","interview","behavioral"];
  const [tab, setTab] = useState<string>(() => {
    if (typeof window === "undefined") return "overview";
    const h = window.location.hash.replace("#", "");
    return validTabs.includes(h) ? h : "overview";
  });
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace("#", "");
      if (validTabs.includes(h)) setTab(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Sync drafts when the application data changes.
  useEffect(() => {
    setResumeDraft(app.data?.tailored_resume ?? "");
    setCoverDraft(app.data?.cover_letter ?? "");
  }, [app.data?.id, app.data?.tailored_resume, app.data?.cover_letter]);


  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["app-for-job", jobId] });
    qc.invalidateQueries({ queryKey: ["applications"] });
  };


  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    try { await fn(); toast.success(ok); invalidate(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(null); }
  };

  if (job.isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  if (!job.data) return <div className="p-8">Not found.</div>;
  const j = job.data;
  const a = app.data;
  const breakdown = (a?.match_breakdown ?? null) as null | {
    skills: number; semantic: number; location: number; eligibility: number;
    reasoning: string; matched_skills: string[]; missing_skills: string[];
  };

  return (
    <div className="p-8">
      <Link to="/jobs" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to jobs
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{j.title}</h1>
          <p className="mt-1 text-muted-foreground">
            {j.company}{j.location ? ` · ${j.location}` : ""}{j.remote ? " · Remote" : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ScoreBadge score={a?.match_score ?? null} />
            {a?.status && <Badge variant="secondary">{a.status}</Badge>}
            {j.source_url && (
              <a href={j.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                Source <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={!!busy} onClick={() => run("rank", () => rank({ data: { job_id: jobId, persist: true } }), "Ranked")}>
            <Sparkles className="mr-2 h-4 w-4" /> {busy === "rank" ? "Ranking…" : "Rank"}
          </Button>
          <Button disabled={!!busy} onClick={() => run("pipeline", () => pipeline({ data: { job_id: jobId } }), "Application drafted")}>
            <Wand2 className="mr-2 h-4 w-4" /> {busy === "pipeline" ? "Working…" : "Draft full application"}
          </Button>
        </div>
      </div>

      {breakdown && (
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {(["skills", "semantic", "location", "eligibility"] as const).map((k) => (
            <div key={k} className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs uppercase text-muted-foreground">{k}</div>
              <div className="mt-1 text-2xl font-semibold">{Math.round(breakdown[k] * 100)}%</div>
            </div>
          ))}
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => { setTab(v); if (typeof window !== "undefined") history.replaceState(null, "", `#${v}`); }} className="mt-8">
        <TabsList className="flex w-full flex-wrap gap-1 h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resume"><FileText className="mr-1 h-3 w-3" /> Resume</TabsTrigger>
          <TabsTrigger value="cover"><FileText className="mr-1 h-3 w-3" /> Cover letter</TabsTrigger>
          <TabsTrigger value="answers"><MessageSquare className="mr-1 h-3 w-3" /> Answers</TabsTrigger>
          <TabsTrigger value="review"><ShieldCheck className="mr-1 h-3 w-3" /> Review</TabsTrigger>
          <TabsTrigger value="upskill"><GraduationCap className="mr-1 h-3 w-3" /> Upskill</TabsTrigger>
          <TabsTrigger value="interview"><Mic className="mr-1 h-3 w-3" /> Interview</TabsTrigger>
          <TabsTrigger value="behavioral"><Brain className="mr-1 h-3 w-3" /> Behavioral</TabsTrigger>
          
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {breakdown && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-medium">AI reasoning</h3>
              <p className="mt-2 text-sm text-muted-foreground">{breakdown.reasoning}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Matched skills</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {breakdown.matched_skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Missing skills</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {breakdown.missing_skills.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-medium">Description</h3>
            <pre className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{j.description ?? "—"}</pre>
          </div>
        </TabsContent>

        <TabsContent value="resume" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-medium">Tailored resume</h3>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run("resume", () => tailor({ data: { job_id: jobId } }), "Resume tailored")}>
                  <Sparkles className="mr-2 h-4 w-4" /> {busy === "resume" ? "Generating…" : a?.tailored_resume ? "Regenerate" : "Generate"}
                </Button>
                <Button size="sm" variant="outline" disabled={!a || !resumeDraft.trim() || resumeDraft === (a?.tailored_resume ?? "")}
                  onClick={() => a && run("save-resume", () => saveContent({ data: { id: a.id, tailored_resume: resumeDraft } }), "Resume saved")}>
                  <Save className="mr-2 h-4 w-4" /> {busy === "save-resume" ? "Saving…" : "Save"}
                </Button>
                <Button size="sm" disabled={!resumeDraft.trim()}
                  onClick={() => downloadTextAsPdf({ filename: `resume-${j.company}-${j.title}.pdf`.replace(/\s+/g, "_"), body: resumeDraft })}>
                  <Download className="mr-2 h-4 w-4" /> PDF
                </Button>
              </div>
            </div>
            {a?.tailored_resume || resumeDraft ? (
              <Textarea
                className="mt-4 min-h-[60vh] font-mono text-sm"
                value={resumeDraft}
                onChange={(e) => setResumeDraft(e.target.value)}
                placeholder="Your tailored resume will appear here. Edit freely before saving or exporting."
              />
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Generate an ATS-friendly resume grounded in your profile and KB, then edit and export.</p>
            )}
            {a?.tailored_resume && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Input
                  className="flex-1 min-w-[240px]"
                  placeholder="Refine instruction — e.g. shorten to one page, emphasize React leadership"
                  value={resumeRefine}
                  onChange={(e) => setResumeRefine(e.target.value)}
                />
                <Button size="sm" variant="outline" disabled={!!busy || !a || resumeRefine.trim().length < 3}
                  onClick={() => a && run("refine-resume", async () => {
                    const r = await refineFn({ data: { application_id: a.id, target: "resume", instruction: resumeRefine.trim() } });
                    setResumeDraft(r.text);
                    setResumeRefine("");
                  }, "Resume refined")}>
                  <RefreshCw className="mr-2 h-4 w-4" /> {busy === "refine-resume" ? "Refining…" : "Refine"}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="cover" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-medium">Cover letter</h3>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run("cover", () => cover({ data: { job_id: jobId, tone: "confident" } }), "Cover letter ready")}>
                  <Sparkles className="mr-2 h-4 w-4" /> {busy === "cover" ? "Generating…" : a?.cover_letter ? "Regenerate" : "Generate"}
                </Button>
                <Button size="sm" variant="outline" disabled={!a || !coverDraft.trim() || coverDraft === (a?.cover_letter ?? "")}
                  onClick={() => a && run("save-cover", () => saveContent({ data: { id: a.id, cover_letter: coverDraft } }), "Cover letter saved")}>
                  <Save className="mr-2 h-4 w-4" /> {busy === "save-cover" ? "Saving…" : "Save"}
                </Button>
                <Button size="sm" disabled={!coverDraft.trim()}
                  onClick={() => downloadTextAsPdf({ filename: `cover-${j.company}-${j.title}.pdf`.replace(/\s+/g, "_"), title: `Cover Letter — ${j.title} at ${j.company}`, body: coverDraft })}>
                  <Download className="mr-2 h-4 w-4" /> PDF
                </Button>
              </div>
            </div>
            {a?.cover_letter || coverDraft ? (
              <Textarea
                className="mt-4 min-h-[50vh] font-mono text-sm"
                value={coverDraft}
                onChange={(e) => setCoverDraft(e.target.value)}
                placeholder="Your cover letter will appear here. Edit freely before saving or exporting."
              />
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">A concise, grounded letter tailored to this job — fully editable before export.</p>
            )}
            {a?.cover_letter && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Input
                  className="flex-1 min-w-[240px]"
                  placeholder="Refine instruction — e.g. warmer opener, drop the third paragraph"
                  value={coverRefine}
                  onChange={(e) => setCoverRefine(e.target.value)}
                />
                <Button size="sm" variant="outline" disabled={!!busy || !a || coverRefine.trim().length < 3}
                  onClick={() => a && run("refine-cover", async () => {
                    const r = await refineFn({ data: { application_id: a.id, target: "cover_letter", instruction: coverRefine.trim() } });
                    setCoverDraft(r.text);
                    setCoverRefine("");
                  }, "Cover letter refined")}>
                  <RefreshCw className="mr-2 h-4 w-4" /> {busy === "refine-cover" ? "Refining…" : "Refine"}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>


        <TabsContent value="answers" className="mt-4 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <Label htmlFor="q">Application question</Label>
            <Textarea id="q" rows={3} className="mt-1" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. Why are you interested in this role?" />
            <Button
              className="mt-3"
              disabled={!!busy || question.trim().length < 3}
              onClick={() => run("answer", () => answerFn({ data: { job_id: jobId, question: question.trim() } }), "Answer generated").then(() => setQuestion(""))}
            >
              <Sparkles className="mr-2 h-4 w-4" /> {busy === "answer" ? "Thinking…" : "Generate answer"}
            </Button>
          </div>
          {a?.answers && Object.keys(a.answers as Record<string, string>).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(a.answers as Record<string, string>).map(([q, ans]) => (
                <div key={q} className="rounded-xl border border-border bg-card p-5">
                  <div className="text-sm font-medium">{q}</div>
                  <pre className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{ans}</pre>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Saved answers will appear here.</p>
          )}
        </TabsContent>

        <TabsContent value="review" className="mt-4 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-medium">Reviewer agent pass</h3>
                <p className="text-xs text-muted-foreground">A second AI critiques the resume + cover letter and queues it for your approval.</p>
              </div>
              <Button size="sm" disabled={!a || !!busy} onClick={() => a && run("review", async () => {
                const res = await reviewFn({ data: { application_id: a.id, enqueue: true } });
                setReview(res.review);
              }, "Review complete")}>
                <ShieldCheck className="mr-2 h-4 w-4" /> {busy === "review" ? "Reviewing…" : review ? "Re-review" : "Run reviewer"}
              </Button>
            </div>
            {review && (
              <div className="mt-4 space-y-4 animate-fade-in">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border p-3"><div className="text-xs uppercase text-muted-foreground">Overall</div><div className="text-2xl font-semibold">{review.overall_score}</div></div>
                  <div className="rounded-lg border border-border p-3"><div className="text-xs uppercase text-muted-foreground">Resume</div><div className="text-2xl font-semibold">{review.resume_score ?? "—"}</div></div>
                  <div className="rounded-lg border border-border p-3"><div className="text-xs uppercase text-muted-foreground">Cover</div><div className="text-2xl font-semibold">{review.cover_score ?? "—"}</div></div>
                </div>
                <p className="text-sm">{review.summary}</p>
                {review.strengths.length > 0 && (
                  <div><div className="text-xs uppercase text-muted-foreground">Strengths</div><ul className="mt-1 list-disc pl-5 text-sm">{review.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
                )}
                {review.issues.length > 0 && (
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Issues</div>
                    <div className="mt-1 space-y-2">
                      {review.issues.map((iss, i) => (
                        <div key={i} className="rounded-md border border-border p-2 text-sm">
                          <div className="flex items-center gap-2"><Badge variant={iss.severity === "high" ? "destructive" : iss.severity === "med" ? "default" : "outline"}>{iss.severity}</Badge><span className="font-medium">{iss.area}</span></div>
                          <p className="mt-1 text-muted-foreground">{iss.message}</p>
                          {iss.suggested_fix && <p className="mt-1 text-xs"><span className="font-medium">Fix:</span> {iss.suggested_fix}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {review.rewrite_suggestions.length > 0 && (
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Rewrite suggestions</div>
                    <div className="mt-1 space-y-2">
                      {review.rewrite_suggestions.map((r, i) => (
                        <div key={i} className="rounded-md border border-border p-2 text-sm">
                          <Badge variant="secondary">{r.target}</Badge>
                          {r.before && <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground line-through">{r.before}</pre>}
                          <pre className="mt-1 whitespace-pre-wrap text-xs">{r.after}</pre>
                          <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="upskill" className="mt-4 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-medium">Skill-gap heatmap & learning plan</h3>
                <p className="text-xs text-muted-foreground">Find what's missing for this role and a focused weekly plan to close it.</p>
              </div>
              <Button size="sm" disabled={!!busy} onClick={() => run("upskill", async () => {
                const res = await upskillFn({ data: { job_id: jobId } });
                setUpskill(res);
              }, "Plan ready")}>
                <GraduationCap className="mr-2 h-4 w-4" /> {busy === "upskill" ? "Analyzing…" : upskill ? "Regenerate" : "Generate plan"}
              </Button>
            </div>
            {upskill && (
              <div className="mt-4 space-y-4 animate-fade-in">
                <p className="text-sm">{upskill.summary}</p>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Gaps</div>
                  <div className="mt-1 grid gap-2 sm:grid-cols-2">
                    {upskill.gaps.map((g, i) => (
                      <div key={i} className="rounded-md border border-border p-2 text-sm">
                        <div className="flex items-center justify-between"><span className="font-medium">{g.skill}</span><Badge variant={g.severity === "critical" ? "destructive" : g.severity === "important" ? "default" : "outline"}>{g.severity}</Badge></div>
                        <div className="mt-1 text-xs text-muted-foreground">{g.current_level} → {g.target_level}</div>
                        <p className="mt-1 text-xs">{g.why}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {upskill.plan.length > 0 && (
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Weekly plan</div>
                    <ol className="mt-1 space-y-2">
                      {upskill.plan.map((p, i) => (
                        <li key={i} className="rounded-md border border-border p-2 text-sm">
                          <div className="font-medium">Week {p.week} — {p.focus}</div>
                          <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">{p.actions.map((a, j) => <li key={j}>{a}</li>)}</ul>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {upskill.resources.length > 0 && (
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Resources</div>
                    <ul className="mt-1 space-y-1 text-sm">
                      {upskill.resources.map((r, i) => (
                        <li key={i} className="rounded-md border border-border p-2">
                          <div className="flex items-center gap-2"><Badge variant="outline">{r.kind}</Badge>{r.url ? <a className="font-medium text-primary hover:underline" href={r.url} target="_blank" rel="noreferrer">{r.title}</a> : <span className="font-medium">{r.title}</span>}</div>
                          <p className="mt-1 text-xs text-muted-foreground">{r.why}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="interview" className="mt-4 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-medium">Interview prep — STAR stories</h3>
                <p className="text-xs text-muted-foreground">Likely questions plus STAR-format stories grounded in your real experience.</p>
              </div>
              <Button size="sm" disabled={!!busy} onClick={() => run("interview", async () => {
                const res = await interviewFn({ data: { job_id: jobId, focus: "mixed" } });
                setInterview(res);
              }, "Prep ready")}>
                <Mic className="mr-2 h-4 w-4" /> {busy === "interview" ? "Preparing…" : interview ? "Regenerate" : "Generate prep"}
              </Button>
            </div>
            {interview && (
              <div className="mt-4 space-y-4 animate-fade-in">
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Likely questions</div>
                  <ul className="mt-1 space-y-1 text-sm">
                    {interview.questions.map((q, i) => (
                      <li key={i} className="rounded-md border border-border p-2">
                        <div className="flex items-center gap-2"><Badge variant="outline">{q.category}</Badge><span className="font-medium">{q.q}</span></div>
                        <p className="mt-1 text-xs text-muted-foreground">{q.why_asked}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">STAR stories</div>
                  <div className="mt-1 space-y-2">
                    {interview.star_stories.map((s, i) => (
                      <div key={i} className="rounded-md border border-border p-3 text-sm">
                        <div className="font-medium">{s.title}</div>
                        <p className="mt-1 text-xs"><b>S:</b> {s.situation}</p>
                        <p className="mt-1 text-xs"><b>T:</b> {s.task}</p>
                        <p className="mt-1 text-xs"><b>A:</b> {s.action}</p>
                        <p className="mt-1 text-xs"><b>R:</b> {s.result}</p>
                        {s.covers_questions.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{s.covers_questions.map((q, j) => <Badge key={j} variant="secondary" className="text-[10px]">{q}</Badge>)}</div>}
                      </div>
                    ))}
                  </div>
                </div>
                {interview.questions_to_ask.length > 0 && (
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Smart questions to ask them</div>
                    <ul className="mt-1 list-disc pl-5 text-sm">{interview.questions_to_ask.map((q, i) => <li key={i}>{q}</li>)}</ul>
                  </div>
                )}
                {interview.red_flags_to_address.length > 0 && (
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Address proactively</div>
                    <ul className="mt-1 list-disc pl-5 text-sm">{interview.red_flags_to_address.map((q, i) => <li key={i}>{q}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="behavioral" className="mt-4 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-medium">Behavioral drills</h3>
                <p className="text-xs text-muted-foreground">Predicted prompts, what they're probing for, and a model STAR answer from your real experience.</p>
              </div>
              <Button size="sm" disabled={!!busy} onClick={() => run("behavioral", async () => {
                const res = await behavioralFn({ data: { job_id: jobId } });
                setBehavioral(res);
              }, "Drills ready")}>
                <Brain className="mr-2 h-4 w-4" /> {busy === "behavioral" ? "Building…" : behavioral ? "Regenerate" : "Generate drills"}
              </Button>
            </div>
            {behavioral && (
              <div className="mt-4 space-y-3 animate-fade-in">
                {behavioral.drills.map((d, i) => (
                  <div key={i} className="rounded-md border border-border p-3 text-sm">
                    <div className="font-medium">{d.prompt}</div>
                    <p className="mt-1 text-xs text-muted-foreground">Probing for: {d.probing_for}</p>
                    {d.common_failures.length > 0 && (
                      <div className="mt-2 text-xs"><span className="font-medium">Common failures:</span> {d.common_failures.join(" · ")}</div>
                    )}
                    <div className="mt-2 rounded-md bg-muted/40 p-2 text-xs">
                      <p><b>S:</b> {d.model_answer.situation}</p>
                      <p className="mt-1"><b>T:</b> {d.model_answer.task}</p>
                      <p className="mt-1"><b>A:</b> {d.model_answer.action}</p>
                      <p className="mt-1"><b>R:</b> {d.model_answer.result}</p>
                    </div>
                    {d.follow_ups.length > 0 && (
                      <div className="mt-2 text-xs"><span className="font-medium">Likely follow-ups:</span>
                        <ul className="ml-4 list-disc">{d.follow_ups.map((f, j) => <li key={j}>{f}</li>)}</ul>
                      </div>
                    )}
                  </div>
                ))}
                {behavioral.coaching_notes.length > 0 && (
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Coaching notes</div>
                    <ul className="mt-1 list-disc pl-5 text-sm">{behavioral.coaching_notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>




      {a && (
        <div className="mt-8 space-y-3 rounded-xl border border-border bg-card p-5">
          {j.source_url && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-primary/5 p-3">
              <div className="text-sm">
                <div className="font-medium">Apply on the company site</div>
                <div className="text-xs text-muted-foreground">
                  Open the original posting in a new tab and apply with your tailored resume and cover letter.
                </div>
              </div>
              <a
                href={j.source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Open posting <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Send className="h-4 w-4 text-muted-foreground" />
            <span className="mr-2 text-sm text-muted-foreground">Status:</span>
            {(["saved", "drafting", "ready_to_apply", "submitted", "interview", "offer", "rejected"] as ApplicationStatus[]).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={a.status === s ? "default" : "outline"}
                onClick={() => run(`status-${s}`, () => setStatus({ data: { id: a.id, status: s } }), "Status updated")}
              >
                {s.replace("_", " ")}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

