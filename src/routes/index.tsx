import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  FileText,
  Search,
  Wand2,
  Mic,
  Briefcase,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CareerOS — Your AI Job Search Copilot" },
      {
        name: "description",
        content:
          "Discover roles, tailor every application to your real resume, and prep interviews — all in one place. You approve every action.",
      },
      { property: "og:title", content: "CareerOS — AI Career Copilot" },
      {
        property: "og:description",
        content:
          "Tailored resumes, ranked matches, interview prep. Grounded in your real experience.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Briefcase className="h-4 w-4" />
            </div>
            <span className="font-display text-xl">CareerOS</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/login">Sign in</Link></Button>
            <Button asChild size="sm"><Link to="/register">Get started</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero — split */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(55% 45% at 85% 10%, color-mix(in oklab, var(--accent) 30%, transparent), transparent 70%), radial-gradient(40% 40% at 5% 85%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 70%)",
          }}
        />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 md:py-28 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground shadow-soft">
              <Sparkles className="h-3.5 w-3.5 text-accent-foreground" /> AI job-search copilot
            </div>
            <h1 className="font-display text-5xl tracking-tight md:text-6xl">
              Land the role.
              <br />
              <em className="text-primary">Skip the busywork.</em>
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted-foreground">
              Paste a job URL. CareerOS ranks the fit against your resume,
              tailors a clean application, and helps you prep — grounded in
              your real experience, with you approving every action.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-lift">
                <Link to="/register">
                  Start free <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">I have an account</Link>
              </Button>
            </div>
          </div>

          {/* Preview card */}
          <div className="relative">
            <div className="rounded-2xl border border-border bg-card p-2 shadow-lift">
              <div className="rounded-xl border border-border/60 bg-background p-5">
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                    <div className="h-2 w-2 rounded-full bg-accent" />
                  </div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">careeros</div>
                </div>
                <div className="mt-2">
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Tailored application</div>
                  <div className="mt-1 font-display text-2xl">Senior Frontend Engineer</div>
                  <div className="text-xs text-muted-foreground">Linear · Remote</div>
                </div>
                <div className="mt-5 space-y-2.5">
                  {[
                    { k: "Match score", v: "88%" },
                    { k: "Resume tailored", v: "Ready" },
                    { k: "Cover letter", v: "Drafted" },
                  ].map((r) => (
                    <div key={r.k} className="flex items-center justify-between rounded-lg border border-border bg-card px-3.5 py-2.5">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">{r.k}</span>
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Features</div>
          <h2 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
            Everything you need, nothing you don't.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">How it works</div>
            <h2 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">From a URL to a tailored application.</h2>
          </div>
          <ol className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="relative rounded-2xl border border-border bg-card p-6">
                <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary font-display text-base text-primary-foreground">
                  {i + 1}
                </div>
                <h3 className="font-display text-lg">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="overflow-hidden rounded-3xl border border-border bg-gradient-primary p-12 text-center text-primary-foreground shadow-lift md:p-16">
          <h2 className="font-display text-4xl tracking-tight md:text-5xl">
            Open your CareerOS.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-primary-foreground/80">
            Free to start. You stay in control of every application.
          </p>
          <div className="mt-7">
            <Button asChild size="lg" variant="secondary">
              <Link to="/register">Get started <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Briefcase className="h-3 w-3" />
            </div>
            <span>© {new Date().getFullYear()} CareerOS</span>
          </div>
          <div className="flex gap-5">
            <Link to="/login" className="hover:text-foreground">Sign in</Link>
            <Link to="/register" className="hover:text-foreground">Create account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  { icon: Search, title: "Job discovery", desc: "Paste a job URL or search the web — we extract role, company, and requirements into a clean pipeline." },
  { icon: Sparkles, title: "AI match scoring", desc: "Every saved job is ranked against your resume so you can focus on the roles you can actually win." },
  { icon: Wand2, title: "Tailored applications", desc: "Generate a tailored resume and cover letter for any job, grounded in your real experience." },
  { icon: ShieldCheck, title: "Reviewer agent", desc: "A second AI critiques every draft for evidence, tone, and ATS keywords before you ship it." },
  { icon: Mic, title: "Interview prep", desc: "Likely questions and STAR-format answer drafts built from your actual background." },
  { icon: FileText, title: "Document library", desc: "Upload your resume once. CareerOS reuses it across ranking, tailoring, and interview prep." },
];

const steps = [
  { title: "Add a job", desc: "Paste a URL or run a search. We pull the posting into your pipeline." },
  { title: "Rank & tailor", desc: "Score the fit against your resume, then generate a tailored application." },
  { title: "Review & apply", desc: "The reviewer agent hardens the draft. You approve and submit on your terms." },
];
