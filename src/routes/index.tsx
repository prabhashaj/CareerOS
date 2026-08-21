import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  FileText,
  Mail,
  Mic,
  Briefcase,
  CheckCircle2,
  Target,
  ChevronRight,
  Play,
  RotateCcw,
  Sliders,
  Award,
  BookOpen,
  HelpCircle,
  TrendingUp,
  Zap,
  Check,
  Layers,
  FileCheck,
  Star,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CareerOS — AI Tailored Resumes, Cover Letters & Interview Prep" },
      {
        name: "description",
        content:
          "Turn any Job Description into an ATS-optimized tailored resume, bespoke cover letter, and full interview prep pack. Grounded in your real experience.",
      },
      { property: "og:title", content: "CareerOS — AI Career Application Suite" },
      {
        property: "og:description",
        content:
          "Tailored resumes, bespoke cover letters, and interview coaching. Grounded in your real experience.",
      },
    ],
  }),
  component: Landing,
});

function InteractiveDashboard() {
  const [activeTab, setActiveTab] = useState<"resume" | "cover" | "interview">("resume");

  // Resume Tailor state
  const [tailorOriginal] = useState(
    "Managed database instances and wrote data retrieval queries."
  );
  const [tailorModified, setTailorModified] = useState(
    "Managed database instances and wrote data retrieval queries."
  );
  const [isTailoring, setIsTailoring] = useState(false);

  // Cover Letter state
  const [coverTone, setCoverTone] = useState<"confident" | "warm" | "formal">("confident");

  return (
    <div className="relative mx-auto max-w-5xl rounded-3xl border border-border bg-card shadow-2xl overflow-hidden text-left font-sans">
      {/* Top Browser mockup bar */}
      <div className="flex items-center justify-between border-b border-border/80 bg-secondary/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-400/80" />
          <div className="h-3 w-3 rounded-full bg-amber-400/80" />
          <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
          <span className="ml-2 font-mono text-xs text-muted-foreground">app.careeros.ai/studio</span>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono">
          Interactive Live Simulation
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[440px]">
        {/* Simulation Sidebar */}
        <aside className="md:col-span-4 border-r border-border/70 bg-card p-4 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2">
            AI Superpowers
          </div>
          <button
            onClick={() => setActiveTab("resume")}
            className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-left transition-all ${
              activeTab === "resume"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>1. Tailored Resume to JD</span>
          </button>
          <button
            onClick={() => setActiveTab("cover")}
            className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-left transition-all ${
              activeTab === "cover"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Mail className="h-4 w-4 shrink-0" />
            <span>2. Cover Letter Maker</span>
          </button>
          <button
            onClick={() => setActiveTab("interview")}
            className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-left transition-all ${
              activeTab === "interview"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Mic className="h-4 w-4 shrink-0" />
            <span>3. Interview Coaching</span>
          </button>

          <div className="mt-8 pt-4 border-t border-border/60 p-2 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Target Role</span>
            <div className="font-semibold text-xs text-foreground truncate">Staff Platform Engineer</div>
            <div className="text-[11px] text-muted-foreground">Stripe • San Francisco / Remote</div>
          </div>
        </aside>

        {/* Simulation Main Stage */}
        <main className="md:col-span-8 p-6 flex flex-col justify-between bg-muted/20">
          {/* TAB 1: RESUME TAILORING */}
          {activeTab === "resume" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> ATS Resume Tailor
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Rewrites bullet points with strong action verbs & verified metrics for the target JD.
                  </p>
                </div>
                <Badge variant="default" className="text-xs">
                  94% ATS Match
                </Badge>
              </div>

              <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
                <div className="text-[11px] font-bold text-muted-foreground uppercase">Original Bullet Point:</div>
                <div className="text-xs text-muted-foreground font-mono bg-secondary/40 p-2.5 rounded-lg">
                  "{tailorOriginal}"
                </div>

                <div className="text-[11px] font-bold text-primary uppercase pt-1">AI Tailored & ATS-Optimized:</div>
                <div className="text-xs text-foreground font-mono bg-primary/5 border border-primary/20 p-2.5 rounded-lg leading-relaxed">
                  "{tailorModified}"
                </div>

                <div className="pt-2">
                  <Button
                    size="sm"
                    disabled={isTailoring}
                    onClick={() => {
                      setIsTailoring(true);
                      setTimeout(() => {
                        setTailorModified(
                          "Architected and deployed PostgreSQL and Redis cluster infrastructure supporting 4.2M daily queries, reducing P99 latency by 34% through automated query optimization and caching.",
                        );
                        setIsTailoring(false);
                      }, 600);
                    }}
                    className="h-8 text-xs font-bold gap-1.5"
                  >
                    <Sparkles className="size-3.5" />
                    <span>{isTailoring ? "Tailoring..." : "Simulate AI Tailoring"}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COVER LETTER MAKER */}
          {activeTab === "cover" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" /> Bespoke Cover Letter Maker
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Generates persuasive, company-aligned letters with custom tone presets.
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
                <div className="flex gap-2">
                  {(["confident", "warm", "formal"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setCoverTone(t)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-semibold border capitalize transition-all ${
                        coverTone === t
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/40 text-muted-foreground border-border"
                      }`}
                    >
                      {t} Tone
                    </button>
                  ))}
                </div>

                <div className="text-xs font-sans text-foreground leading-relaxed bg-secondary/20 p-3.5 rounded-xl border border-border/70">
                  {coverTone === "confident" &&
                    "Dear Stripe Team, Having spent the past six years architecting high-throughput distributed payment pipelines, I was immediately drawn to the Staff Platform Engineer opening. At my previous role, I reduced latency by 34% and scaled data infrastructure to handle $12M in monthly volume. I look forward to bringing this ownership to Stripe's core infrastructure."}
                  {coverTone === "warm" &&
                    "Hello Stripe Team, I've long admired Stripe's relentless developer focus and elegant API design. When I built my first financial integration using Stripe, I knew I wanted to engineer systems at this scale. My background in building fault-tolerant cloud systems makes me thrilled about the opportunity to contribute to your platform team."}
                  {coverTone === "formal" &&
                    "Dear Hiring Team, I am writing to express my enthusiastic interest in the Staff Platform Engineer position at Stripe. With extensive experience in enterprise cloud architecture, PostgreSQL clustering, and distributed observability, I have consistently driven measurable ROI and 99.99% system reliability across mission-critical services."}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INTERVIEW PREP */}
          {activeTab === "interview" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                    <Mic className="h-4 w-4 text-primary" /> Interview Prep & STAR Coach
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Interactive mock practice with real-time AI scoring, STAR analysis, and model answers.
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  Behavioral Drill
                </Badge>
              </div>

              <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
                <div className="text-xs font-semibold text-foreground">
                  "Tell me about a time you handled a critical production incident under tight SLA deadlines."
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">AI Evaluation: 92/100</span>
                    <span className="text-[10px] text-muted-foreground">STAR Complete</span>
                  </div>
                  <p className="text-[11px] text-foreground leading-relaxed">
                    <strong>Model Answer:</strong> In Q3 during a major migration, our primary cluster spiked to 98% CPU. I immediately isolated the un-indexed query, deployed a hotfix within 12 minutes, and implemented circuit breakers that prevented $400k in potential transaction failures.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
            <span>Powered by Mistral AI + Candidate Knowledge Base</span>
            <Link to="/register" className="text-primary font-bold hover:underline flex items-center gap-1">
              Try full app <ArrowRight className="size-3" />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-accent-foreground font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground group-hover:scale-105 transition-transform">
              <Briefcase className="h-4 w-4" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-primary">CareerOS</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#simulator" className="transition-colors hover:text-foreground">Interactive Demo</a>
            <a href="#features" className="transition-colors hover:text-foreground">3 Core Superpowers</a>
            <a href="#workflow" className="transition-colors hover:text-foreground">How It Works</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="text-sm font-medium">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="shadow-soft text-sm font-semibold rounded-xl">
              <Link to="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border py-20 md:py-28 text-center space-y-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent/15 blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-4xl px-6 space-y-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 backdrop-blur-sm px-4 py-1 text-xs font-semibold text-primary shadow-soft mx-auto">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> The 3-Pillar AI Career Suite
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl leading-tight">
            Tailored Resumes, Persuasive Letters & Mock Interview Coaching.
          </h1>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
            Stop sending generic applications. Paste any Job Description to generate ATS-compliant resumes, bespoke company-grounded cover letters, and comprehensive interview drill packs in seconds.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Button asChild size="lg" className="shadow-lift px-8 rounded-xl font-bold">
              <Link to="/register">
                Start Tailoring Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-8 rounded-xl font-semibold">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>

          {/* Value Stats */}
          <div className="pt-8 border-t border-border/60 grid grid-cols-3 gap-6 max-w-2xl mx-auto font-sans">
            <div>
              <div className="text-3xl font-display font-bold text-primary">100%</div>
              <div className="text-xs text-muted-foreground mt-0.5">ATS Vector PDFs</div>
            </div>
            <div>
              <div className="text-3xl font-display font-bold text-primary">5 Tones</div>
              <div className="text-xs text-muted-foreground mt-0.5">Bespoke Cover Letters</div>
            </div>
            <div>
              <div className="text-3xl font-display font-bold text-primary">STAR Drills</div>
              <div className="text-xs text-muted-foreground mt-0.5">Live Mock AI Coach</div>
            </div>
          </div>
        </div>

        {/* Interactive Simulator Section */}
        <div id="simulator" className="mx-auto max-w-6xl px-6 pt-10">
          <InteractiveDashboard />
        </div>
      </section>

      {/* 3 Core Pillars Feature Grid */}
      <section id="features" className="border-b border-border py-24 bg-card/50">
        <div className="mx-auto max-w-6xl px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Core Pillars</span>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Everything you need to win the offer</h2>
            <p className="text-sm text-muted-foreground">
              Built on state-of-the-art AI, grounded in your real work history, and fine-tuned for hiring managers and ATS algorithms.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Pillar 1 */}
            <div className="rounded-3xl border border-border bg-card p-8 shadow-xs space-y-4 hover:border-primary/40 hover:shadow-md transition-all">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="size-6" />
              </div>
              <h3 className="font-display text-xl font-bold">1. Tailored Resume Studio</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Analyze target job descriptions, discover missing keyword gaps, optimize bullet points with strong action verbs & quantified impact, and export pixel-perfect ATS vector PDFs.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-3xl border border-border bg-card p-8 shadow-xs space-y-4 hover:border-primary/40 hover:shadow-md transition-all">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Mail className="size-6" />
              </div>
              <h3 className="font-display text-xl font-bold">2. Cover Letter Maker</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate highly personalized cover letters aligned with the company's mission and culture. Choose between Confident, Warm, Formal, Concise, or Executive voice presets.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-3xl border border-border bg-card p-8 shadow-xs space-y-4 hover:border-primary/40 hover:shadow-md transition-all">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Mic className="size-6" />
              </div>
              <h3 className="font-display text-xl font-bold">3. Interview Preparation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Targeted technical & behavioral question banks, automated STAR story creation from your background, and interactive mock practice with real-time AI feedback and scoring.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Workflow */}
      <section id="workflow" className="border-b border-border py-24 bg-background">
        <div className="mx-auto max-w-6xl px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Workflow</span>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">How to apply with maximum conversion</h2>
            <p className="text-sm text-muted-foreground">
              Follow our simple 3-step loop for every target role.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-xs">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                01
              </div>
              <h3 className="font-display text-lg font-bold">Upload Knowledge Hub</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Upload your master resumes, project portfolios, and certifications. CareerOS indexes your real achievements as grounded ground-truth.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-xs">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                02
              </div>
              <h3 className="font-display text-lg font-bold">Attach Target JD & Tailor</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Paste any job posting to calculate live ATS match scores, optimize bullet points, and generate a bespoke cover letter tailored to the role.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-xs">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                03
              </div>
              <h3 className="font-display text-lg font-bold">Ace the Interview</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Practice tailored question drills, review your STAR story bank, and study the 10-minute pre-interview cheat sheet before stepping into the room.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 bg-gradient-primary text-primary-foreground text-center">
        <div className="mx-auto max-w-4xl px-6 space-y-6">
          <h2 className="font-display text-3xl sm:text-5xl font-bold">
            Ready to stand out in every application?
          </h2>
          <p className="text-sm md:text-base text-primary-foreground/80 max-w-xl mx-auto">
            Create your tailored resume, persuasive cover letter, and interview prep pack in under 2 minutes.
          </p>
          <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold rounded-xl shadow-lg px-8">
            <Link to="/register">
              Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 bg-background text-xs text-muted-foreground text-center">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Briefcase className="size-4 text-primary" />
            <span className="font-display text-base font-bold text-foreground">CareerOS</span>
            <span>• AI Career Suite</span>
          </div>
          <div>© 2026 CareerOS. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
