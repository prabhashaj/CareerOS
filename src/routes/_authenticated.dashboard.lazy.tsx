import { createLazyFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  FileText,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  BookOpen,
  User,
  Globe,
  FilePlus,
  PenTool,
  X,
  HelpCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listApplications, listReviewQueue } from "@/lib/applications.functions";
import { listDocuments } from "@/lib/documents.functions";
import { listJobs } from "@/lib/jobs.functions";
import { searchJobsWeb } from "@/lib/jobsearch.functions";

export const Route = createLazyFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const jobsFn = useServerFn(listJobs);
  const docsFn = useServerFn(listDocuments);
  const appsFn = useServerFn(listApplications);
  const reviewFn = useServerFn(listReviewQueue);
  const searchFn = useServerFn(searchJobsWeb);

  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");
  const [searching, setSearching] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("career_os_onboarding_guide");
    if (saved === "false") {
      setShowGuide(false);
    }
  }, []);

  const handleDismissGuide = () => {
    setShowGuide(false);
    localStorage.setItem("career_os_onboarding_guide", "false");
  };

  const handleShowGuide = () => {
    setShowGuide(true);
    localStorage.removeItem("career_os_onboarding_guide");
  };

  const jobs = useQuery({ queryKey: ["jobs"], queryFn: () => jobsFn() });
  const docs = useQuery({ queryKey: ["documents"], queryFn: () => docsFn() });
  const apps = useQuery({ queryKey: ["applications"], queryFn: () => appsFn() });
  const reviews = useQuery({ queryKey: ["review_queue"], queryFn: () => reviewFn() });

  const pendingReviews = (reviews.data ?? []).filter((r) => r.status === "pending").length;
  const scoredApps = (apps.data ?? []).filter((a) => a.match_score != null);
  const avgScore = scoredApps.length
    ? Math.round(
        (scoredApps.reduce((sum, a) => sum + Number(a.match_score), 0) / scoredApps.length) * 100,
      )
    : null;

  const topMatches = [...(apps.data ?? [])]
    .filter((a) => a.match_score != null)
    .sort((a, b) => Number(b.match_score) - Number(a.match_score))
    .slice(0, 5);

  void docs;


  const handleDiscover = async () => {
    setSearching(true);
    try {
      const res = await searchFn({
        data: { query: q.trim() || undefined, location: loc.trim() || undefined, limit: 30 },
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (res.ingested > 0) {
        toast.success(`Found ${res.ingested} new job${res.ingested === 1 ? "" : "s"}`);
        qc.invalidateQueries({ queryKey: ["jobs"] });
        navigate({ to: "/jobs" });
      } else {
        toast.info("No new jobs found. Try a different query.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-10 p-6 md:p-10">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-primary p-8 text-primary-foreground shadow-lift md:p-14">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-accent">
            <Sparkles className="h-3 w-3" /> AI Discovery
          </span>
          <h1 className="mt-5 font-display text-5xl leading-[1.02] md:text-6xl">
            Find your next role,<br />
            <em className="text-accent">tailored</em> to you.
          </h1>
          <p className="mt-4 max-w-xl text-base text-primary-foreground/75">
            Search Naukri, LinkedIn India, Instahyre, Cutshort and other top Indian job boards. We rank every match against your profile and draft a tailored application.
          </p>
          <div className="mt-7 flex flex-col gap-2 rounded-2xl bg-background/95 p-2 text-foreground shadow-lift sm:flex-row">
            <div className="flex flex-1 items-center gap-2 px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Role, skill or keywords"
                className="border-0 px-0 shadow-none focus-visible:ring-0"
                disabled={searching}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleDiscover();
                }}
              />
            </div>
            <div className="hidden h-8 w-px self-center bg-border sm:block" />
            <Input
              value={loc}
              onChange={(e) => setLoc(e.target.value)}
              placeholder="Location (optional)"
              className="border-0 shadow-none focus-visible:ring-0 sm:max-w-[220px]"
              disabled={searching}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleDiscover();
              }}
            />
            <Button onClick={handleDiscover} disabled={searching} size="lg" className="bg-gradient-accent text-accent-foreground hover:opacity-90">
              {searching ? "Searching…" : "Discover jobs"}
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Link to="/upload" className="rounded-full bg-background/10 px-3 py-1.5 text-primary-foreground/80 transition-colors hover:bg-background/20">
              Paste a URL →
            </Link>
            <Link to="/jobs" className="rounded-full bg-background/10 px-3 py-1.5 text-primary-foreground/80 transition-colors hover:bg-background/20">
              Browse pipeline →
            </Link>
          </div>
        </div>
      </section>

      {showGuide ? (
        <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft md:p-8 animate-fade-in-up">
          <div className="absolute right-4 top-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismissGuide}
              className="text-muted-foreground hover:text-foreground h-8 w-8"
              title="Dismiss onboarding guide"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl md:text-3xl text-foreground">
              Getting Started: How to effectively use CareerOS
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 max-w-3xl">
            CareerOS matches and tailors applications by grounding AI actions in your real background. Follow these steps to build your master knowledge base and generate high-impact career assets.
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col justify-between space-y-3 rounded-xl border border-border bg-muted/10 p-4 transition-all hover:bg-muted/20">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    1
                  </span>
                  <div className="font-medium text-sm flex items-center gap-1.5 text-foreground">
                    <User className="h-4 w-4 text-muted-foreground" /> Profile details
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Fill in your target roles, locations, and personal info in Settings. This defines the target parameters for all matching.
                </p>
              </div>
              <Link
                to="/settings"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline pt-2"
              >
                Configure details <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="flex flex-col justify-between space-y-3 rounded-xl border border-border bg-muted/10 p-4 transition-all hover:bg-muted/20">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    2
                  </span>
                  <div className="font-medium text-sm flex items-center gap-1.5 text-foreground">
                    <Globe className="h-4 w-4 text-muted-foreground" /> Connect URLs
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Enrich your profile by pasting links to your GitHub, LinkedIn, portfolio, or blogs. Our AI indexes them automatically.
                </p>
              </div>
              <Link
                to="/settings"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline pt-2"
              >
                Expand profile <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="flex flex-col justify-between space-y-3 rounded-xl border border-border bg-muted/10 p-4 transition-all hover:bg-muted/20">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    3
                  </span>
                  <div className="font-medium text-sm flex items-center gap-1.5 text-foreground">
                    <FilePlus className="h-4 w-4 text-muted-foreground" /> Add Documents
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Upload your master resumes, past cover letters, transcripts, or experience letters to act as the source of truth for applications.
                </p>
              </div>
              <Link
                to="/upload"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline pt-2"
              >
                Upload resumes <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="flex flex-col justify-between space-y-3 rounded-xl border border-border bg-muted/10 p-4 transition-all hover:bg-muted/20">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    4
                  </span>
                  <div className="font-medium text-sm flex items-center gap-1.5 text-foreground">
                    <PenTool className="h-4 w-4 text-muted-foreground" /> Writing Style
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Paste writing samples in Settings. The AI builds a style print so tailored applications speak in your genuine voice.
                </p>
              </div>
              <Link
                to="/settings"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline pt-2"
              >
                Train writing style <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShowGuide}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 h-8 px-3 rounded-full border border-border bg-card/50"
          >
            <HelpCircle className="h-3.5 w-3.5" /> Show setup guide
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl">Top matches</h2>
              <p className="text-xs text-muted-foreground">Highest-scoring applications</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/jobs">
                All jobs <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          {topMatches.length > 0 ? (
            <ul className="divide-y divide-border">
              {topMatches.map((a) => {
                const pct = Math.round(Number(a.match_score) * 100);
                return (
                  <li key={a.id} className="py-3">
                    <Link to="/jobs/$jobId" params={{ jobId: a.job_id }} className="flex items-center justify-between gap-4 rounded-lg px-2 py-1 -mx-2 transition-colors hover:bg-muted/50">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{a.job?.title ?? "Untitled"}</div>
                        <div className="truncate text-sm text-muted-foreground">{a.job?.company ?? ""}</div>
                      </div>
                      <Badge variant={pct >= 75 ? "default" : pct >= 50 ? "secondary" : "outline"} className="shrink-0">{pct}%</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <p className="text-sm text-muted-foreground">No ranked jobs yet. Open a job and click Rank.</p>
              <Button asChild className="mt-4" size="sm">
                <Link to="/jobs">Go to jobs</Link>
              </Button>
            </div>
          )}
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/20 blur-2xl" />
          <div className="relative">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display text-2xl">Quality</h2>
            </div>
            <div className="font-display text-6xl">{avgScore == null ? "—" : `${avgScore}%`}</div>
            <p className="mt-2 text-sm text-muted-foreground">Average AI match score across your applications.</p>
            {pendingReviews > 0 && (
              <Button asChild variant="outline" className="mt-6 w-full">
                <Link to="/review">
                  <ShieldCheck className="mr-2 h-4 w-4" /> {pendingReviews} pending review{pendingReviews === 1 ? "" : "s"}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}