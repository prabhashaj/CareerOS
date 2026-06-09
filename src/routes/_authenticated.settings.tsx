import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Sparkles, Trash2, AlertTriangle, Wand2 } from "lucide-react";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { expandProfile } from "@/lib/expand.functions";
import { analyzeWritingStyle, clearWritingStyle, type WritingStyle } from "@/lib/style.functions";
import { resetWorkspace } from "@/lib/reset.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

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
    <div className="mt-8 max-w-2xl space-y-4 rounded-xl border border-border bg-card p-6">
      <div>
        <h2 className="text-lg font-medium">Expand profile from the web</h2>
        <p className="text-sm text-muted-foreground">
          Paste LinkedIn, GitHub, portfolio, Scholar, or personal-site URLs. We'll scrape them,
          extract a clean knowledge base, and index it so tailoring uses richer context.
        </p>
      </div>
      <Textarea rows={4} value={urls} onChange={(e) => setUrls(e.target.value)} placeholder={"https://github.com/you\nhttps://your-portfolio.com\nhttps://scholar.google.com/citations?user=..."} />
      <Button onClick={run} disabled={busy}>
        <Sparkles className="mr-2 h-4 w-4" /> {busy ? "Enriching…" : "Expand profile"}
      </Button>
      {result && (
        <div className="space-y-1 rounded-md border border-border p-3 text-sm">
          <div className="font-medium">Done — {result.enriched_chars.toLocaleString()} chars, {result.chunks} chunks</div>
          <ul className="text-xs text-muted-foreground">
            {result.sources.map((s, i) => (
              <li key={i}>{s.ok ? "✓" : "✗"} {s.url}{s.error ? ` — ${s.error}` : ""}</li>
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
      toast.success("Style profile saved — tailoring will now match your voice");
      qc.invalidateQueries({ queryKey: ["profile"] });
      setSamples("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-8 max-w-2xl space-y-4 rounded-xl border border-border bg-card p-6">
      <div>
        <h2 className="text-lg font-medium">Writing style</h2>
        <p className="text-sm text-muted-foreground">
          Paste 2–4 samples of your own writing (cover letters, blog posts, emails). AI extracts a voice profile that
          steers every tailoring task.
        </p>
      </div>
      <Textarea rows={5} value={samples} onChange={(e) => setSamples(e.target.value)} placeholder="Paste a few paragraphs you wrote in your natural voice…" />
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={run} disabled={busy}>
          <Wand2 className="mr-2 h-4 w-4" /> {busy ? "Analyzing…" : currentStyle ? "Re-analyze" : "Analyze style"}
        </Button>
        {currentStyle && (
          <Button
            variant="outline"
            onClick={async () => {
              await clear();
              qc.invalidateQueries({ queryKey: ["profile"] });
              toast.success("Writing style cleared");
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Clear
          </Button>
        )}
      </div>
      {currentStyle && (
        <div className="space-y-2 rounded-md border border-border p-3 text-sm">
          <div className="text-sm text-foreground">
            <ReactMarkdown>{currentStyle.summary}</ReactMarkdown>
          </div>
          <div className="flex flex-wrap gap-1">{currentStyle.tone.map((t, i) => <Badge key={i} variant="secondary">{t}</Badge>)}</div>
          {currentStyle.signature_moves.length > 0 && (
            <div className="text-xs"><span className="font-medium">Signature moves:</span> {currentStyle.signature_moves.join(" · ")}</div>
          )}
          {currentStyle.avoids.length > 0 && (
            <div className="text-xs text-muted-foreground"><span className="font-medium">Avoids:</span> {currentStyle.avoids.join(" · ")}</div>
          )}
        </div>
      )}
    </div>
  );
}

const RESET_SCOPES = [
  { key: "jobs", label: "Saved jobs" },
  { key: "applications", label: "Job applications" },
  { key: "documents", label: "Uploaded documents" },
  { key: "chunks", label: "Indexed knowledge chunks" },
  { key: "review_queue", label: "Review queue" },
  { key: "events", label: "Application events / history" },
  { key: "profile_extras", label: "Targets & preferences (keeps your identity)" },
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

  const run = async () => {
    if (confirm !== "RESET") return toast.error('Type RESET to confirm');
    if (selected.length === 0) return toast.error("Pick at least one scope");
    setBusy(true);
    try {
      const res = await reset({ data: { confirm: "RESET", scopes: selected } });
      toast.success("Workspace reset");
      qc.invalidateQueries();
      setConfirm("");
      setScopes(Object.fromEntries(RESET_SCOPES.map((s) => [s.key, false])) as Record<ResetScope, boolean>);
      console.info("reset counts", res.counts);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-8 max-w-2xl space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <h2 className="text-lg font-medium text-destructive">Danger zone — reset workspace</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Permanently delete the selected data. Your account and profile identity remain. This cannot be undone.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {RESET_SCOPES.map((s) => (
          <label key={s.key} className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm">
            <input type="checkbox" checked={scopes[s.key]} onChange={() => toggle(s.key)} />
            {s.label}
          </label>
        ))}
      </div>
      <div>
        <Label htmlFor="confirm">Type RESET to confirm</Label>
        <Input id="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="RESET" />
      </div>
      <Button variant="destructive" onClick={run} disabled={busy || confirm !== "RESET" || selected.length === 0}>
        <Trash2 className="mr-2 h-4 w-4" /> {busy ? "Resetting…" : "Reset selected data"}
      </Button>
    </div>
  );
}

function SettingsPage() {
  const qc = useQueryClient();
  const get = useServerFn(getMyProfile);
  const update = useServerFn(updateMyProfile);
  const { data } = useQuery({ queryKey: ["profile"], queryFn: () => get() });

  const [form, setForm] = useState({
    full_name: "", headline: "", location: "", phone: "",
    linkedin_url: "", portfolio_url: "", work_authorization: "",
    target_roles_text: "", target_locations_text: "",
    min_salary: "" as string | number, requires_sponsorship: false,
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
    <div className="p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Profile and job preferences power AI matching.</p>

      <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="fn">Full name</Label>
            <Input id="fn" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="h">Headline</Label>
            <Input id="h" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="Senior Frontend Engineer" />
          </div>
          <div>
            <Label htmlFor="loc">Current location</Label>
            <Input id="loc" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="ph">Phone</Label>
            <Input id="ph" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="li">LinkedIn URL</Label>
            <Input id="li" type="url" value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="pf">Portfolio URL</Label>
            <Input id="pf" type="url" value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} />
          </div>
        </div>

        <div>
          <Label htmlFor="roles">Target roles (comma-separated)</Label>
          <Input id="roles" value={form.target_roles_text} onChange={(e) => setForm({ ...form, target_roles_text: e.target.value })} placeholder="Frontend Engineer, Full Stack Engineer" />
        </div>
        <div>
          <Label htmlFor="locs">Target locations (comma-separated)</Label>
          <Input id="locs" value={form.target_locations_text} onChange={(e) => setForm({ ...form, target_locations_text: e.target.value })} placeholder="Remote, New York, London" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="wa">Work authorization</Label>
            <Input id="wa" value={form.work_authorization} onChange={(e) => setForm({ ...form, work_authorization: e.target.value })} placeholder="US citizen / EU work permit / etc." />
          </div>
          <div>
            <Label htmlFor="ms">Minimum salary (annual)</Label>
            <Input id="ms" type="number" value={form.min_salary} onChange={(e) => setForm({ ...form, min_salary: e.target.value })} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.requires_sponsorship} onChange={(e) => setForm({ ...form, requires_sponsorship: e.target.checked })} />
          I require visa sponsorship
        </label>

        <Button type="submit">Save profile</Button>
      </form>

      <ExpandSection />
      <WritingStyleSection currentStyle={(data?.preferences as { writing_style?: WritingStyle } | null)?.writing_style ?? null} />
      <DangerZone />
    </div>
  );
}
