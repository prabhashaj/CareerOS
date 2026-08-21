import { createLazyFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  FileText,
  Mail,
  Mic,
  Sparkles,
  Briefcase,
  FolderOpen,
  Plus,
  Zap,
  Building2,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  BookOpen,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { listDocuments } from "@/lib/documents.functions";
import { listJobs, createJob } from "@/lib/jobs.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createLazyFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const jobsFn = useServerFn(listJobs);
  const docsFn = useServerFn(listDocuments);
  const createJobFn = useServerFn(createJob);

  // Quick Launchpad state
  const [quickTitle, setQuickTitle] = useState("");
  const [quickCompany, setQuickCompany] = useState("");
  const [quickDescription, setQuickDescription] = useState("");
  const [isSavingJob, setIsSavingJob] = useState(false);

  const jobs = useQuery({ queryKey: ["jobs"], queryFn: () => jobsFn() });
  const docs = useQuery({ queryKey: ["documents"], queryFn: () => docsFn() });

  // User saved resumes query
  const { data: resumes = [] } = useQuery({
    queryKey: ["resumes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("documents")
        .select("id, title, metadata, created_at, updated_at")
        .eq("user_id", user!.id)
        .eq("kind", "resume")
        .order("updated_at", { ascending: false })
        .limit(6);
      return (data ?? []).map((doc) => {
        const meta = (doc.metadata as Record<string, unknown>) || {};
        return {
          id: doc.id,
          title: doc.title,
          template_id: (meta["template_id"] as string) || "minimal",
          version: (meta["version"] as number) || 1,
          updated_at: doc.updated_at,
          created_at: doc.created_at,
        };
      });
    },
  });

  const handleQuickAction = async (target: "studio" | "cover-letter" | "interview") => {
    if (!quickTitle.trim() && !quickDescription.trim()) {
      navigate({ to: `/${target}` });
      return;
    }

    // Save job first if provided
    let createdJobId: string | undefined = undefined;
    if (quickTitle.trim() || quickDescription.trim()) {
      try {
        setIsSavingJob(true);
        const newJob = await createJobFn({
          data: {
            title: quickTitle.trim() || "Target Role",
            company: quickCompany.trim() || "Target Company",
            description: quickDescription.trim() || undefined,
          },
        });
        createdJobId = newJob.id;
        void qc.invalidateQueries({ queryKey: ["jobs"] });
      } catch (e) {
        console.error(e);
      } finally {
        setIsSavingJob(false);
      }
    }

    if (target === "studio") {
      navigate({ to: "/studio", search: { jobId: createdJobId } });
    } else if (target === "cover-letter") {
      navigate({ to: "/cover-letter", search: { jobId: createdJobId } });
    } else if (target === "interview") {
      navigate({ to: "/interview", search: { jobId: createdJobId } });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-10 p-6 sm:p-10">
      {/* ── HERO BANNER: The 3 Superpowers ── */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-primary p-8 text-primary-foreground shadow-lift md:p-12">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/25 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> AI Career Suite
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-5xl leading-tight">
            Tailor Resumes, Craft Cover Letters & Master Interviews
          </h1>
          <p className="text-sm md:text-base text-primary-foreground/80 leading-relaxed max-w-2xl">
            Everything is grounded in your verified background and aligned directly to target job descriptions for maximum ATS match and human impact.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/studio">
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold rounded-xl shadow-md">
                <Sparkles className="mr-2 h-4 w-4 text-primary" /> Open Resume Studio
              </Button>
            </Link>
            <Link to="/cover-letter">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 font-semibold rounded-xl backdrop-blur-sm">
                <Mail className="mr-2 h-4 w-4" /> Cover Letter Maker
              </Button>
            </Link>
            <Link to="/interview">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 font-semibold rounded-xl backdrop-blur-sm">
                <Mic className="mr-2 h-4 w-4" /> Interview Prep
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 1-CLICK JOB DESCRIPTION LAUNCHPAD ── */}
      <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/70 pb-4">
          <div className="space-y-1">
            <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <Zap className="size-5 text-primary" /> Instant JD Launchpad
            </h2>
            <p className="text-xs text-muted-foreground">
              Paste any Job Description to immediately generate tailored application assets with 1 click.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4 space-y-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground">Job Title</Label>
              <Input
                placeholder="e.g. Senior Machine Learning Engineer"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="h-9 text-xs rounded-xl bg-secondary/30"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground">Company Name</Label>
              <Input
                placeholder="e.g. Stripe, OpenAI, Google"
                value={quickCompany}
                onChange={(e) => setQuickCompany(e.target.value)}
                className="h-9 text-xs rounded-xl bg-secondary/30"
              />
            </div>
          </div>

          <div className="md:col-span-8 space-y-1">
            <Label className="text-[11px] font-semibold text-muted-foreground">Job Description Requirements / Text</Label>
            <Textarea
              rows={4}
              placeholder="Paste the full job posting requirements here to tailor resumes, generate cover letters, or create mock interview drills..."
              value={quickDescription}
              onChange={(e) => setQuickDescription(e.target.value)}
              className="text-xs resize-none rounded-xl leading-relaxed bg-secondary/30"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-border/60">
          <span className="text-xs text-muted-foreground mr-auto hidden sm:inline">
            Choose what to generate for this JD:
          </span>
          <Button
            variant="default"
            size="sm"
            onClick={() => handleQuickAction("studio")}
            disabled={isSavingJob}
            className="h-9 font-bold text-xs gap-1.5 rounded-xl shadow-xs"
          >
            <Sparkles className="size-3.5" /> Tailor Resume
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction("cover-letter")}
            disabled={isSavingJob}
            className="h-9 font-semibold text-xs gap-1.5 rounded-xl"
          >
            <Mail className="size-3.5 text-primary" /> Cover Letter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction("interview")}
            disabled={isSavingJob}
            className="h-9 font-semibold text-xs gap-1.5 rounded-xl"
          >
            <Mic className="size-3.5 text-primary" /> Interview Prep
          </Button>
        </div>
      </section>

      {/* ── STATS & OVERVIEW ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase font-bold tracking-wider">Target Roles</span>
            <Briefcase className="size-4 text-primary" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-foreground">{jobs.data?.length ?? 0}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Saved job descriptions</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase font-bold tracking-wider">Resumes in Library</span>
            <FileText className="size-4 text-primary" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-foreground">{resumes.length}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Tailored & starter versions</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase font-bold tracking-wider">Knowledge Hub Items</span>
            <BookOpen className="size-4 text-primary" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-foreground">{docs.data?.length ?? 0}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Indexed resumes & documents</p>
        </div>
      </div>

      {/* ── SAVED TARGET ROLES & RECENT RESUMES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Saved Target Roles */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="size-4 text-primary" />
              <h3 className="font-display text-base font-bold text-foreground">Target Roles</h3>
            </div>
            <Link to="/jobs" className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="size-3" />
            </Link>
          </div>

          {(jobs.data ?? []).length === 0 ? (
            <div className="text-center py-8 space-y-2 border border-dashed border-border rounded-2xl bg-secondary/10">
              <p className="text-xs text-muted-foreground">No target roles saved yet.</p>
              <Link to="/jobs">
                <Button size="sm" variant="outline" className="text-xs h-8">
                  <Plus className="size-3.5 mr-1" /> Add Target Role
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {(jobs.data ?? []).slice(0, 4).map((j) => (
                <div
                  key={j.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-border bg-secondary/20 hover:border-primary/40 transition-all"
                >
                  <div className="min-w-0 pr-3">
                    <div className="font-semibold text-xs text-foreground truncate">{j.title}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="size-3 shrink-0" />
                      <span className="truncate">{j.company}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link to="/studio" search={{ jobId: j.id }}>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] font-semibold text-primary" title="Resume">
                        Resume
                      </Button>
                    </Link>
                    <Link to="/cover-letter" search={{ jobId: j.id }}>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] font-semibold text-primary" title="Letter">
                        Letter
                      </Button>
                    </Link>
                    <Link to="/interview" search={{ jobId: j.id }}>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] font-semibold text-primary" title="Prep">
                        Prep
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Resumes in Library */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <FolderOpen className="size-4 text-primary" />
              <h3 className="font-display text-base font-bold text-foreground">Resumes & Documents</h3>
            </div>
            <Link to="/resumes" className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="size-3" />
            </Link>
          </div>

          {resumes.length === 0 ? (
            <div className="text-center py-8 space-y-2 border border-dashed border-border rounded-2xl bg-secondary/10">
              <p className="text-xs text-muted-foreground">No saved resumes found.</p>
              <Link to="/studio">
                <Button size="sm" className="text-xs h-8">
                  <Sparkles className="size-3.5 mr-1" /> Create Resume
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {resumes.slice(0, 4).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-border bg-secondary/20 hover:border-primary/40 transition-all"
                >
                  <div className="min-w-0 pr-3">
                    <div className="font-semibold text-xs text-foreground truncate">{r.title || "Untitled Resume"}</div>
                    <div className="text-[11px] text-muted-foreground">
                      Template: {r.template_id} • v{r.version}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link to="/studio" search={{ resumeId: r.id }}>
                      <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs font-semibold">
                        Edit in Studio
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}