import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Compass, Sparkles, ArrowRight, Target, TrendingUp, Rocket, Loader2 } from "lucide-react";
import { discoverCareerPaths } from "@/lib/career.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/career")({
  head: () => ({ meta: [{ title: "Career discovery — CareerOS" }] }),
  component: CareerPage,
});

const trackMeta = {
  adjacent: { icon: Target, label: "Adjacent", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300" },
  lateral: { icon: TrendingUp, label: "Lateral", color: "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-300" },
  stretch: { icon: Rocket, label: "Stretch", color: "bg-accent/15 text-accent-foreground border-accent/40" },
} as const;

function CareerPage() {
  const discover = useServerFn(discoverCareerPaths);
  const [busy, setBusy] = useState(false);
  const [horizon, setHorizon] = useState(18);
  const [risk, setRisk] = useState<"safe" | "balanced" | "stretch">("balanced");
  const [result, setResult] = useState<Awaited<ReturnType<typeof discoverCareerPaths>> | null>(null);

  const run = async () => {
    setBusy(true);
    try {
      const r = await discover({ data: { horizon_months: horizon, risk_appetite: risk } });
      setResult(r);
      toast.success("Career paths ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const grouped = result
    ? {
        adjacent: result.suggestions.filter((s) => s.track === "adjacent"),
        lateral: result.suggestions.filter((s) => s.track === "lateral"),
        stretch: result.suggestions.filter((s) => s.track === "stretch"),
      }
    : null;

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
        <Compass className="h-3 w-3 text-accent" /> Discovery
      </div>
      <h1 className="font-display text-4xl tracking-tight">Career discovery</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Adjacent, lateral, and stretch roles you could realistically pursue — grounded in your profile and resume.
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-gradient-to-br from-card to-card/50 p-6 shadow-sm">
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="h" className="text-xs uppercase tracking-wider text-muted-foreground">
              Horizon
            </Label>
            <div className="mt-2 flex items-center gap-3">
              <input
                id="h"
                type="range"
                min={3}
                max={36}
                step={3}
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
                className="flex-1 accent-accent"
              />
              <span className="w-20 text-sm font-medium tabular-nums">{horizon} mo</span>
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Risk appetite</Label>
            <div className="mt-2 flex gap-1 rounded-lg border border-border bg-background p-1">
              {(["safe", "balanced", "stretch"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRisk(r)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${
                    risk === r ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <Button disabled={busy} onClick={run} size="lg" className="ml-auto">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {busy ? "Thinking…" : result ? "Regenerate" : "Generate paths"}
          </Button>
        </div>
      </div>

      {!result && !busy && (
        <div className="mt-12 rounded-2xl border border-dashed border-border p-12 text-center">
          <Compass className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">Generate paths to see tailored suggestions.</p>
        </div>
      )}

      {busy && (
        <div className="mt-12 rounded-2xl border border-border p-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
          <p className="mt-3 text-sm text-muted-foreground">Analyzing your background…</p>
        </div>
      )}

      {result && grouped && (
        <div className="mt-8 space-y-8">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Summary</div>
            <div className="mt-2 text-sm leading-relaxed">
              <ReactMarkdown>{result.summary}</ReactMarkdown>
            </div>
          </div>

          {(["adjacent", "lateral", "stretch"] as const).map((track) => {
            const items = grouped[track];
            if (items.length === 0) return null;
            const meta = trackMeta[track];
            const Icon = meta.icon;
            return (
              <section key={track}>
                <div className="mb-3 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-accent" />
                  <h2 className="font-display text-xl">{meta.label} moves</h2>
                  <span className="text-xs text-muted-foreground">({items.length})</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {items.map((s, i) => (
                    <article
                      key={i}
                      className="group rounded-2xl border border-border bg-card p-5 transition hover:border-accent/40 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display text-lg leading-tight">{s.role}</h3>
                        <Badge variant="outline" className={meta.color}>{meta.label}</Badge>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-foreground/80">{s.why_it_fits}</p>

                      {s.transferable_strengths.length > 0 && (
                        <div className="mt-4">
                          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Transferable strengths</div>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {s.transferable_strengths.map((x, j) => (
                              <Badge key={j} variant="secondary" className="text-xs font-normal">{x}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {s.gaps_to_close.length > 0 && (
                        <div className="mt-3">
                          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Gaps to close</div>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {s.gaps_to_close.map((x, j) => (
                              <Badge key={j} variant="outline" className="text-xs font-normal">{x}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-start gap-2 rounded-lg bg-accent/5 p-3 text-xs">
                        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                        <div>
                          <span className="font-medium">First step:</span> {s.first_step}
                        </div>
                      </div>

                      {(s.example_titles.length > 0 || s.example_companies.length > 0) && (
                        <div className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                          {s.example_titles.length > 0 && <div><span className="font-medium">Titles:</span> {s.example_titles.join(" · ")}</div>}
                          {s.example_companies.length > 0 && <div><span className="font-medium">Companies:</span> {s.example_companies.join(" · ")}</div>}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            );
          })}

          {result.long_term_themes.length > 0 && (
            <div className="rounded-2xl border border-border bg-gradient-to-br from-accent/5 to-transparent p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Long-term themes</div>
              </div>
              <ul className="mt-3 space-y-2">
                {result.long_term_themes.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
