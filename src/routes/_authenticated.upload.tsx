import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Upload, FileText, Sparkles, Github, Linkedin, MessageCircle, Award, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { createDocument } from "@/lib/documents.functions";
import { importProfile } from "@/lib/profile-import.functions";
import {
  nextUnderstandingQuestion,
  saveUnderstanding,
  saveSkillsAndCerts,
} from "@/lib/user-understanding.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/upload")({
  head: () => ({ meta: [{ title: "Add a document or job — CareerOS" }] }),
  component: UploadPage,
});

function UploadPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Add content</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The more we know about you, the better every agent performs — matching, tailoring, interviews, all of it.
        </p>
      </div>

      <Tabs defaultValue="understand" className="max-w-3xl">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="understand"><MessageCircle className="mr-2 h-4 w-4" /> Understand me</TabsTrigger>
          <TabsTrigger value="resume"><FileText className="mr-2 h-4 w-4" /> Resume / docs</TabsTrigger>
          <TabsTrigger value="skills"><Award className="mr-2 h-4 w-4" /> Skills & certs</TabsTrigger>
          <TabsTrigger value="profile"><Github className="mr-2 h-4 w-4" /> Import profile</TabsTrigger>
        </TabsList>

        <TabsContent value="understand"><UnderstandMe /></TabsContent>
        <TabsContent value="resume"><ResumeUploader /></TabsContent>
        <TabsContent value="skills"><SkillsAndCerts /></TabsContent>
        <TabsContent value="profile"><ProfileImport /></TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// Understand-me interview
// ============================================================================

type Turn = { question: string; answer: string };

function UnderstandMe() {
  const qc = useQueryClient();
  const nextQ = useServerFn(nextUnderstandingQuestion);
  const save = useServerFn(saveUnderstanding);
  const [history, setHistory] = useState<Turn[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      const res = await nextQ({ data: { history: [] } });
      if (res.done) setDone(true);
      else setCurrent(res.question);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start interview");
    } finally {
      setBusy(false);
    }
  };

  const submitAnswer = async () => {
    if (!current || !answer.trim()) return;
    const turn: Turn = { question: current, answer: answer.trim() };
    const updated = [...history, turn];
    setHistory(updated);
    setAnswer("");
    setCurrent(null);
    setBusy(true);
    try {
      const res = await nextQ({ data: { history: updated } });
      if (res.done) setDone(true);
      else setCurrent(res.question);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load next question");
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    setBusy(true);
    try {
      await save({ data: { history } });
      toast.success("Saved to your knowledge base");
      qc.invalidateQueries({ queryKey: ["documents"] });
      setHistory([]);
      setCurrent(null);
      setDone(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 space-y-4 rounded-xl border border-border bg-card p-6">
      <div>
        <h2 className="text-lg font-semibold">Let the AI get to know you</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A short guided interview about your skills, projects, goals, and preferences. Answers are saved to your knowledge base and used by every agent — matching, tailoring, interview prep.
        </p>
      </div>

      {history.length > 0 && (
        <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
          {history.map((t, i) => (
            <div key={i} className="space-y-1">
              <div className="font-medium text-foreground">Q: {t.question}</div>
              <div className="text-muted-foreground whitespace-pre-wrap">A: {t.answer}</div>
            </div>
          ))}
        </div>
      )}

      {!current && !done && history.length === 0 && (
        <Button onClick={start} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Start interview
        </Button>
      )}

      {current && (
        <div className="space-y-3">
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-medium text-foreground">{current}</p>
          </div>
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            placeholder="Your answer…"
          />
          <div className="flex gap-2">
            <Button onClick={submitAnswer} disabled={busy || !answer.trim()}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Next question
            </Button>
            {history.length >= 3 && (
              <Button variant="outline" onClick={finish} disabled={busy}>
                Finish & save
              </Button>
            )}
          </div>
        </div>
      )}

      {done && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">All done — ready to save {history.length} answers to your knowledge base.</p>
          <Button onClick={finish} disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save to knowledge base
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Resume / docs uploader (unchanged behavior, refreshed copy)
// ============================================================================

function ResumeUploader() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const createDoc = useServerFn(createDocument);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"resume" | "knowledge_base" | "cover_letter" | "other">("resume");
  const [extractedText, setExtractedText] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      let storagePath: string | undefined;
      let mimeType: string | undefined;
      let sizeBytes: number | undefined;
      if (file) {
        storagePath = `${user.id}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from("jobpilot-documents").upload(storagePath, file);
        if (error) throw error;
        mimeType = file.type;
        sizeBytes = file.size;
      }
      await createDoc({
        data: {
          title: title || file?.name || "Untitled",
          kind,
          storage_path: storagePath,
          mime_type: mimeType,
          size_bytes: sizeBytes,
          extracted_text: extractedText || undefined,
          is_primary: kind === "resume",
        },
      });
      toast.success("Document saved");
      qc.invalidateQueries({ queryKey: ["documents"] });
      setFile(null);
      setTitle("");
      setExtractedText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-border bg-card p-6">
      <div>
        <Label>Document type</Label>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="resume">Resume</option>
          <option value="knowledge_base">Knowledge base (achievements, projects)</option>
          <option value="cover_letter">Cover letter template</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Engineering resume 2026" />
      </div>
      <div>
        <Label htmlFor="file">File (PDF, DOCX, TXT)</Label>
        <Input id="file" type="file" accept=".pdf,.docx,.txt,.md" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>
      <div>
        <Label htmlFor="text">Or paste text content</Label>
        <Textarea id="text" rows={8} value={extractedText} onChange={(e) => setExtractedText(e.target.value)} placeholder="Paste resume content here so the AI can use it for matching and tailoring…" />
      </div>
      <Button type="submit" disabled={busy}>
        <Upload className="mr-2 h-4 w-4" /> {busy ? "Saving…" : "Save document"}
      </Button>
    </form>
  );
}

// ============================================================================
// Skills & Certifications form
// ============================================================================

function SkillsAndCerts() {
  const qc = useQueryClient();
  const save = useServerFn(saveSkillsAndCerts);
  const [skills, setSkills] = useState<string[]>([]);
  const [certs, setCerts] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [certInput, setCertInput] = useState("");
  const [achievements, setAchievements] = useState("");
  const [busy, setBusy] = useState(false);

  const addItem = (val: string, list: string[], set: (l: string[]) => void, clear: () => void) => {
    const parts = val.split(",").map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const next = Array.from(new Set([...list, ...parts]));
    set(next);
    clear();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await save({ data: { skills, certifications: certs, achievements: achievements || undefined } });
      toast.success("Saved to your knowledge base");
      qc.invalidateQueries({ queryKey: ["documents"] });
      setSkills([]);
      setCerts([]);
      setAchievements("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-xl border border-border bg-card p-6">
      <div>
        <h2 className="text-lg font-semibold">Skills & certifications</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The matcher uses every skill and credential here. Add freely — more is better.
        </p>
      </div>

      <div>
        <Label>Skills</Label>
        <div className="mt-2 flex gap-2">
          <Input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem(skillInput, skills, setSkills, () => setSkillInput(""));
              }
            }}
            placeholder="e.g. Python, React, AWS  (comma-separate or press Enter)"
          />
          <Button type="button" variant="outline" onClick={() => addItem(skillInput, skills, setSkills, () => setSkillInput(""))}>
            Add
          </Button>
        </div>
        {skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.map((s) => (
              <Badge key={s} variant="secondary" className="gap-1">
                {s}
                <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label>Certifications</Label>
        <div className="mt-2 flex gap-2">
          <Input
            value={certInput}
            onChange={(e) => setCertInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem(certInput, certs, setCerts, () => setCertInput(""));
              }
            }}
            placeholder="e.g. AWS Solutions Architect — Associate (2024)"
          />
          <Button type="button" variant="outline" onClick={() => addItem(certInput, certs, setCerts, () => setCertInput(""))}>
            Add
          </Button>
        </div>
        {certs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {certs.map((c) => (
              <Badge key={c} variant="secondary" className="gap-1">
                {c}
                <button type="button" onClick={() => setCerts(certs.filter((x) => x !== c))}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="ach">Achievements, projects, anything else</Label>
        <Textarea
          id="ach"
          rows={6}
          value={achievements}
          onChange={(e) => setAchievements(e.target.value)}
          placeholder="Awards, open-source projects, side projects, languages, publications, hackathon wins…"
        />
      </div>

      <Button type="submit" disabled={busy || (!skills.length && !certs.length && !achievements.trim())}>
        {busy ? "Saving…" : "Save to knowledge base"}
      </Button>
    </form>
  );
}

// ============================================================================
// GitHub / LinkedIn profile import
// ============================================================================

function ProfileImport() {
  const qc = useQueryClient();
  const importFn = useServerFn(importProfile);
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setPreview(null);
    try {
      const res = await importFn({
        data: {
          github: github.trim() || undefined,
          linkedin: linkedin.trim() || undefined,
        },
      });
      toast.success(`Imported: ${res.title}`);
      setPreview(res.preview);
      qc.invalidateQueries({ queryKey: ["documents"] });
      setGithub("");
      setLinkedin("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-border bg-card p-6">
      <div>
        <h2 className="text-lg font-semibold">Import from GitHub or LinkedIn</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We pull your public profile, distill it into a clean knowledge-base entry, and feed it into every match.
        </p>
      </div>

      <div>
        <Label htmlFor="gh"><Github className="mr-1 inline h-4 w-4" /> GitHub username or URL</Label>
        <Input id="gh" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="e.g. octocat or https://github.com/octocat" />
      </div>

      <div>
        <Label htmlFor="li"><Linkedin className="mr-1 inline h-4 w-4" /> LinkedIn profile URL</Label>
        <Input id="li" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://www.linkedin.com/in/yourname" />
        <p className="mt-1 text-xs text-muted-foreground">
          LinkedIn sometimes blocks scrapers. If import fails, paste your profile text in the Resume / docs tab as "knowledge base".
        </p>
      </div>

      <Button type="submit" disabled={busy || (!github.trim() && !linkedin.trim())}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
        {busy ? "Importing…" : "Import & save"}
      </Button>

      {preview && (
        <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4">
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview</div>
          <pre className="whitespace-pre-wrap text-sm text-foreground">{preview}…</pre>
        </div>
      )}
    </form>
  );
}
