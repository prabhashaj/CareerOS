import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  Sparkles,
  Trash2,
  AlertTriangle,
  Wand2,
  Briefcase,
  FileText,
  BookOpen,
  Layers,
  CheckCircle2,
  Sliders,
  Globe,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { expandProfile } from "@/lib/expand.functions";
import { analyzeWritingStyle, clearWritingStyle, type WritingStyle } from "@/lib/style.functions";
import { resetWorkspace } from "@/lib/reset.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — CareerOS" }] }),
  component: SettingsPage,
});

function ExpandSection() {
  const expand = useServerFn(expandProfile);
  const [urls, setUrls] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof expandProfile>> | null>(null);

  const run = async () => {
    const list = urls.split(/[\s,]+/).map((u) => u.trim()).filter(Boolean);
    if (list.length === 0) return toast.error("Add at least one URL");
    setBusy(true);
    try {
      const res = await expand({ data: { urls: list, title: "Profile enrichment" } });
      setResult(res);
      toast.success(`Enriched profile · ${res.chunks} chunks indexed`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-primary" />
          <h2 className="font-display text-lg font-bold text-foreground">Enrich Profile from Web Sources</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Paste LinkedIn, GitHub, portfolio, Google Scholar, or personal website URLs. We extract your verified experience and index it into your Knowledge Hub.
        </p>
      </div>

      <Textarea
        rows={4}
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        placeholder={"https://github.com/your-username\nhttps://your-portfolio.com\nhttps://linkedin.com/in/your-profile"}
        className="text-xs resize-none rounded-xl leading-relaxed bg-secondary/30"
      />

      <Button
        onClick={run}
        disabled={busy}
        className="h-9 font-bold text-xs gap-1.5 rounded-xl shadow-xs"
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
        <span>{busy ? "Enriching Knowledge Hub…" : "Enrich Knowledge Hub"}</span>
      </Button>

      {result && (
        <div className="space-y-2 rounded-xl border border-border bg-secondary/20 p-3.5 text-xs animate-fade-in">
          <div className="font-bold text-foreground flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-success" /> Done — {result.enriched_chars.toLocaleString()} characters ({result.chunks} vector chunks indexed)
          </div>
          <ul className="text-[11px] text-muted-foreground space-y-0.5">
            {result.sources.map((s, i) => (
              <li key={i} className="truncate">
                {s.ok ? "✓" : "✗"} {s.url}{s.error ? ` — ${s.error}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function WritingStyleSection({ currentStyle }: { currentStyle: WritingStyle | null }) {
  const qc = useQueryClient();
  const analyze = useServerFn(analyzeWritingStyle);
  const clear = useServerFn(clearWritingStyle);
  const [samples, setSamples] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (samples.trim().length < 80) return toast.error("Paste at least ~80 chars of your writing");
    setBusy(true);
    try {
      await analyze({ data: { samples } });
      toast.success("Writing voice profile saved");
      qc.invalidateQueries({ queryKey: ["profile"] });
      setSamples("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Wand2 className="size-4 text-primary" />
          <h2 className="font-display text-lg font-bold text-foreground">Writing Voice & Tone Preferences</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Paste 2–4 paragraphs of your own natural writing (past cover letters, emails, posts). AI extracts your distinct communication voice for all tailoring tasks.
        </p>
      </div>

      <Textarea
        rows={4}
        value={samples}
        onChange={(e) => setSamples(e.target.value)}
        placeholder="Paste writing samples representing your authentic voice and tone..."
        className="text-xs resize-none rounded-xl leading-relaxed bg-secondary/30"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={run}
          disabled={busy}
          className="h-9 font-bold text-xs gap-1.5 rounded-xl shadow-xs"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
          <span>{busy ? "Analyzing Style…" : currentStyle ? "Re-analyze Style" : "Analyze Writing Style"}</span>
        </Button>
        {currentStyle && (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await clear();
              qc.invalidateQueries({ queryKey: ["profile"] });
              toast.success("Writing style cleared");
            }}
            className="h-9 text-xs rounded-xl"
          >
            <Trash2 className="size-3.5 mr-1 text-muted-foreground" /> Clear Voice
          </Button>
        )}
      </div>

      {currentStyle && (
        <div className="space-y-2.5 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs">
          <div className="font-semibold text-foreground">
            <ReactMarkdown>{currentStyle.summary}</ReactMarkdown>
          </div>
          <div className="flex flex-wrap gap-1">
            {currentStyle.tone.map((t, i) => (
              <Badge key={i} variant="secondary" className="text-[10px]">
                {t}
              </Badge>
            ))}
          </div>
          {currentStyle.signature_moves.length > 0 && (
            <div className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">Signature moves:</span> {currentStyle.signature_moves.join(" • ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const RESET_SCOPES = [
  {
    key: "jobs",
    title: "Target Roles & JDs",
    desc: "All saved target job descriptions and criteria.",
    icon: Briefcase,
  },
  {
    key: "resumes",
    title: "Resumes & Checkpoints",
    desc: "All tailored resumes, templates, and version history in Studio.",
    icon: FileText,
  },
  {
    key: "documents",
    title: "Knowledge Hub Files",
    desc: "All uploaded master resumes, certifications, and project notes.",
    icon: BookOpen,
  },
  {
    key: "chunks",
    title: "Indexed Knowledge Chunks",
    desc: "Vector embeddings and retrieval indices.",
    icon: Layers,
  },
  {
    key: "profile_extras",
    title: "Preferences & Voice Profile",
    desc: "Target roles, salary criteria, and writing style preferences.",
    icon: Sliders,
  },
] as const;

type ResetScope = (typeof RESET_SCOPES)[number]["key"];

function DangerZone() {
  const reset = useServerFn(resetWorkspace);
  const qc = useQueryClient();
  const [scopes, setScopes] = useState<Record<ResetScope, boolean>>(() =>
    Object.fromEntries(RESET_SCOPES.map((s) => [s.key, false])) as Record<ResetScope, boolean>,
  );
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const toggle = (k: ResetScope) => setScopes((s) => ({ ...s, [k]: !s[k] }));
  const selected = (Object.keys(scopes) as ResetScope[]).filter((k) => scopes[k]);

  const selectAll = () =>
    setScopes(Object.fromEntries(RESET_SCOPES.map((s) => [s.key, true])) as Record<ResetScope, boolean>);

  const clearAll = () =>
    setScopes(Object.fromEntries(RESET_SCOPES.map((s) => [s.key, false])) as Record<ResetScope, boolean>);

  const run = async () => {
    if (confirm.trim().toUpperCase() !== "RESET") {
      return toast.error('Please type "RESET" into the confirmation field.');
    }
    if (selected.length === 0) {
      return toast.error("Please select at least one data category to reset.");
    }

    setBusy(true);
    const toastId = toast.loading("Purging selected workspace data...");
    try {
      await reset({ data: { confirm: "RESET", scopes: selected } });
      toast.success("Workspace reset successfully!", { id: toastId });
      qc.invalidateQueries();
      setConfirm("");
      clearAll();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Reset failed", { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-destructive/20 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="size-5" />
            <h2 className="font-display text-lg font-bold">Danger Zone — Reset Workspace Data</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Permanently wipe selected workspace data. Your account authentication and base profile identity will remain.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            Select All
          </button>
          <span className="text-muted-foreground text-xs">•</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Selectable Scope Cards */}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {RESET_SCOPES.map((s) => {
          const isChecked = scopes[s.key];
          const Icon = s.icon;
          return (
            <div
              key={s.key}
              onClick={() => toggle(s.key)}
              className={cn(
                "flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all select-none",
                isChecked
                  ? "border-destructive/60 bg-destructive/10 text-foreground shadow-xs"
                  : "border-border bg-card/80 hover:border-destructive/40 text-muted-foreground hover:text-foreground",
              )}
            >
              <div
                className={cn(
                  "grid size-8 place-items-center rounded-lg shrink-0 transition-colors",
                  isChecked ? "bg-destructive text-destructive-foreground" : "bg-secondary text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="font-semibold text-xs text-foreground flex items-center justify-between">
                  <span>{s.title}</span>
                  {isChecked && (
                    <Badge variant="destructive" className="text-[9px] h-3.5 px-1 py-0 font-bold">
                      Selected
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Input & Action Button */}
      <div className="space-y-3 pt-2 border-t border-destructive/20">
        <div className="space-y-1">
          <Label htmlFor="reset-confirm" className="text-xs font-bold text-foreground">
            Type <span className="font-mono text-destructive font-bold">RESET</span> to confirm permanent deletion:
          </Label>
          <Input
            id="reset-confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="RESET"
            className="h-9 text-xs font-mono uppercase rounded-xl bg-card border-destructive/30 focus:border-destructive"
          />
        </div>

        <Button
          variant="destructive"
          onClick={run}
          disabled={busy || confirm.trim().toUpperCase() !== "RESET" || selected.length === 0}
          className="h-9 px-4 font-bold text-xs gap-2 rounded-xl shadow-xs transition-all"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          <span>{busy ? "Resetting Selected Data…" : `Reset Selected Data (${selected.length} scopes)`}</span>
        </Button>
      </div>
    </div>
  );
}

function SettingsPage() {
  const qc = useQueryClient();
  const get = useServerFn(getMyProfile);
  const update = useServerFn(updateMyProfile);
  const { data } = useQuery({ queryKey: ["profile"], queryFn: () => get() });

  const [form, setForm] = useState({
    full_name: "",
    headline: "",
    location: "",
    phone: "",
    linkedin_url: "",
    portfolio_url: "",
    work_authorization: "",
    target_roles_text: "",
    target_locations_text: "",
    min_salary: "" as string | number,
    requires_sponsorship: false,
  });

  useEffect(() => {
    if (data) {
      setForm({
        full_name: data.full_name ?? "",
        headline: data.headline ?? "",
        location: data.location ?? "",
        phone: data.phone ?? "",
        linkedin_url: data.linkedin_url ?? "",
        portfolio_url: data.portfolio_url ?? "",
        work_authorization: data.work_authorization ?? "",
        target_roles_text: (data.target_roles ?? []).join(", "),
        target_locations_text: (data.target_locations ?? []).join(", "),
        min_salary: data.min_salary ?? "",
        requires_sponsorship: data.requires_sponsorship ?? false,
      });
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await update({
        data: {
          full_name: form.full_name,
          headline: form.headline,
          location: form.location,
          phone: form.phone,
          linkedin_url: form.linkedin_url,
          portfolio_url: form.portfolio_url,
          work_authorization: form.work_authorization,
          target_roles: form.target_roles_text.split(",").map((s) => s.trim()).filter(Boolean),
          target_locations: form.target_locations_text.split(",").map((s) => s.trim()).filter(Boolean),
          min_salary: form.min_salary ? Number(form.min_salary) : undefined,
          requires_sponsorship: form.requires_sponsorship,
        },
      });
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-6 sm:p-10 space-y-8">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" /> Profile & Engine Preferences
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Settings & Candidate Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Manage your personal details, target roles, writing style voice, and profile enrichment sources.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="border-b border-border/70 pb-3">
          <h2 className="font-display text-lg font-bold text-foreground">Core Candidate Details</h2>
          <p className="text-xs text-muted-foreground">Used across tailored resumes and cover letter headers.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="fn" className="text-xs font-semibold text-muted-foreground">Full Name</Label>
            <Input id="fn" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="h-9 text-xs rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="h" className="text-xs font-semibold text-muted-foreground">Professional Headline</Label>
            <Input id="h" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="Senior Full Stack Engineer" className="h-9 text-xs rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="loc" className="text-xs font-semibold text-muted-foreground">Location</Label>
            <Input id="loc" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="San Francisco, CA / Remote" className="h-9 text-xs rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ph" className="text-xs font-semibold text-muted-foreground">Phone Number</Label>
            <Input id="ph" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 000-0000" className="h-9 text-xs rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="li" className="text-xs font-semibold text-muted-foreground">LinkedIn URL</Label>
            <Input id="li" type="url" value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/username" className="h-9 text-xs rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pf" className="text-xs font-semibold text-muted-foreground">Portfolio / GitHub URL</Label>
            <Input id="pf" type="url" value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} placeholder="https://yourportfolio.com" className="h-9 text-xs rounded-xl" />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="roles" className="text-xs font-semibold text-muted-foreground">Target Roles (comma-separated)</Label>
          <Input id="roles" value={form.target_roles_text} onChange={(e) => setForm({ ...form, target_roles_text: e.target.value })} placeholder="Staff Platform Engineer, Lead Backend Engineer" className="h-9 text-xs rounded-xl" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="locs" className="text-xs font-semibold text-muted-foreground">Target Locations (comma-separated)</Label>
          <Input id="locs" value={form.target_locations_text} onChange={(e) => setForm({ ...form, target_locations_text: e.target.value })} placeholder="Remote, San Francisco, New York" className="h-9 text-xs rounded-xl" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="wa" className="text-xs font-semibold text-muted-foreground">Work Authorization</Label>
            <Input id="wa" value={form.work_authorization} onChange={(e) => setForm({ ...form, work_authorization: e.target.value })} placeholder="US Citizen / Green Card / STEM OPT" className="h-9 text-xs rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ms" className="text-xs font-semibold text-muted-foreground">Minimum Annual Target Salary ($)</Label>
            <Input id="ms" type="number" value={form.min_salary} onChange={(e) => setForm({ ...form, min_salary: e.target.value })} placeholder="160000" className="h-9 text-xs rounded-xl" />
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer pt-1">
          <input type="checkbox" checked={form.requires_sponsorship} onChange={(e) => setForm({ ...form, requires_sponsorship: e.target.checked })} className="rounded accent-primary" />
          <span>I require visa sponsorship now or in the future</span>
        </label>

        <div className="pt-2">
          <Button type="submit" className="font-bold text-xs h-9 px-5 rounded-xl shadow-xs">
            Save Profile Settings
          </Button>
        </div>
      </form>

      <ExpandSection />
      <WritingStyleSection currentStyle={(data?.preferences as { writing_style?: WritingStyle } | null)?.writing_style ?? null} />
      <DangerZone />
    </div>
  );
}
