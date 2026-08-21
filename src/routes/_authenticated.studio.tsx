import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Code2,
  Download,
  Eye,
  FileText,
  History,
  LayoutTemplate,
  Loader2,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Sliders,
  Sparkles,
  SquarePen,
  Upload,
  ZoomIn,
  ZoomOut,
  Check,
  Target,
  Mail,
  Mic,
  ChevronRight,
  AlertCircle,
  Building2,
  Briefcase,
  CheckCircle2,
  Zap,
  ArrowRight,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { useAgentContext } from "@/hooks/use-agent-context";
import {
  TEMPLATES,
  type TemplateId,
  type ResumeDensity,
  type SpacingConfig,
  SPACING_PRESETS,
  emptyResume,
  normalizeResume,
  starterResume,
} from "@/lib/resume";
import type { ResumeContent } from "@/lib/resume";
import { ResumeForm } from "@/components/studio/ResumeForm";
import { ResumeDocument } from "@/components/resume/ResumeDocument";
import { UploadResumeModal } from "@/components/resume/UploadResumeModal";
import { CheckpointsModal, type CheckpointItem } from "@/components/studio/CheckpointsModal";
import { exportDocx, exportPdf } from "@/lib/export";
import { tailorResume } from "@/lib/agent.functions";
import { analyzeATSKeywords } from "@/lib/tailoring.functions";
import { listJobs, getJob } from "@/lib/jobs.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type StudioSearch = {
  resumeId?: string | undefined;
  jobId?: string | undefined;
};

export const Route = createFileRoute("/_authenticated/studio")({
  head: () => ({ meta: [{ title: "Resume Studio — CareerOS" }] }),
  component: StudioPage,
  validateSearch: (s: Record<string, unknown>): StudioSearch => ({
    resumeId: typeof s["resumeId"] === "string" ? s["resumeId"] : undefined,
    jobId: typeof s["jobId"] === "string" ? s["jobId"] : undefined,
  }),
});

type LeftTab = "form" | "json";

function StudioPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { registerStudioSession, updateStudioSession, setMessages } = useAgentContext();
  const { resumeId, jobId } = useSearch({ from: "/_authenticated/studio" });

  const tailorFn = useServerFn(tailorResume);
  const atsAnalyzeFn = useServerFn(analyzeATSKeywords);
  const listJobsFn = useServerFn(listJobs);
  const getJobFn = useServerFn(getJob);

  // Flow State: If neither resumeId nor jobId is provided, show the initial setup wizard
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(!!resumeId || !!jobId);

  // Resume Content & Editor State
  const [content, setContent] = useState<ResumeContent>(starterResume());
  const [template, setTemplate] = useState<TemplateId>("minimal");
  const [density, setDensity] = useState<"compact" | "normal" | "relaxed">("normal");
  const [leftTab, setLeftTab] = useState<LeftTab>("form");
  const [jsonRaw, setJsonRaw] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(resumeId ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [zoom, setZoom] = useState(0.85);
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [isWideEditor, setIsWideEditor] = useState(false);
  const [showPageBreaks, setShowPageBreaks] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Target Job & Tailoring State
  const [selectedBaseResumeId, setSelectedBaseResumeId] = useState<string>(resumeId ?? "starter");
  const [recentlyUploadedTitle, setRecentlyUploadedTitle] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string>(jobId ?? "");
  const [targetTitle, setTargetTitle] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [targetDescription, setTargetDescription] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isTailoring, setIsTailoring] = useState(false);
  const [reTailorModalOpen, setReTailorModalOpen] = useState(false);

  // Spacing
  const activePreset = SPACING_PRESETS[density] || SPACING_PRESETS.normal;
  const currentSpacing: {
    sectionGap: number;
    itemGap: number;
    lineHeight: number;
    fontSize: number;
    pageMargin: number;
  } = {
    sectionGap: content.spacing?.sectionGap ?? activePreset.sectionGap ?? 14,
    itemGap: content.spacing?.itemGap ?? activePreset.itemGap ?? 8,
    lineHeight: content.spacing?.lineHeight ?? activePreset.lineHeight ?? 1.42,
    fontSize: content.spacing?.fontSize ?? activePreset.fontSize ?? 10,
    pageMargin: content.spacing?.pageMargin ?? activePreset.pageMargin ?? 44,
  };

  const updateSpacing = (patch: Partial<SpacingConfig>) => {
    setContent((prev) => ({
      ...prev,
      spacing: {
        ...currentSpacing,
        ...patch,
      },
    }));
  };

  const handleSelectDensity = (d: ResumeDensity) => {
    setDensity(d);
    setContent((prev) => ({
      ...prev,
      spacing: { ...SPACING_PRESETS[d] },
    }));
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    const toastId = toast.loading("Generating ATS-compliant vector PDF...");
    try {
      const filename = content.contact.name
        ? `${content.contact.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_Resume.pdf`
        : "Resume.pdf";
      await exportPdf("resume-preview-document", filename, content, template, density, content.spacing);
      toast.success("ATS-ready PDF downloaded successfully", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF", { id: toastId });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Queries
  const { data: savedJobs = [] } = useQuery({
    queryKey: ["saved-jobs", user?.id],
    enabled: !!user,
    queryFn: () => listJobsFn(),
  });  // Fetch existing resumes from documents table
  const { data: userResumes = [] } = useQuery({
    queryKey: ["resumes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, metadata, extracted_text, created_at, updated_at")
        .eq("user_id", user!.id)
        .eq("kind", "resume")
        .order("updated_at", { ascending: false });
      if (error) {
        console.warn("Could not fetch resumes from documents:", error);
        return [];
      }
      return (data ?? []).map((doc) => {
        const meta = (doc.metadata as Record<string, unknown>) || {};
        return {
          id: doc.id,
          title: doc.title || "Untitled Resume",
          content: meta["content"] || null,
          template_id: (meta["template_id"] as string) || "minimal",
          version: (meta["version"] as number) || 1,
          updated_at: doc.updated_at,
          created_at: doc.created_at,
        };
      });
    },
  });

  // Load selected job details if activeJobId is set
  useEffect(() => {
    if (activeJobId && activeJobId !== "custom") {
      void (async () => {
        try {
          const j = await getJobFn({ data: { id: activeJobId } });
          if (j) {
            setTargetTitle(j.title);
            setTargetCompany(j.company);
            setTargetDescription(j.description || "");
          }
        } catch {
          // ignore
        }
      })();
    }
  }, [activeJobId, getJobFn]);

  // Load resume from DB if resumeId is set
  const { data: resumeRow } = useQuery({
    queryKey: ["resume", resumeId],
    enabled: !!resumeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", resumeId!)
        .maybeSingle();
      if (error || !data) return null;
      const meta = (data.metadata as Record<string, unknown>) || {};
      return {
        id: data.id,
        title: data.title,
        content: meta["content"] || null,
        template_id: (meta["template_id"] as string) || "minimal",
        version: (meta["version"] as number) || 1,
        extracted_text: data.extracted_text,
      };
    },
  });

  // Load version history / checkpoints
  const { data: versions = [] } = useQuery({
    queryKey: ["versions", currentResumeId],
    enabled: !!currentResumeId,
    queryFn: async () => {
      const { data } = await supabase
        .from("documents")
        .select("id, title, metadata, updated_at")
        .eq("id", currentResumeId!)
        .maybeSingle();
      if (!data) return [];
      const meta = (data.metadata as Record<string, unknown>) || {};
      const checkpoints = (meta["checkpoints"] as Array<{
        id: string;
        version: number;
        label: string | null;
        created_at: string;
        content: unknown;
        template_id?: string;
      }>) || [];
      return checkpoints.map((c) => ({
        id: c.id,
        version: c.version,
        label: c.label,
        created_at: c.created_at,
        content: c.content,
        resume_id: data.id,
        user_id: user?.id || "",
        template_id: c.template_id,
      }));
    },
  });

  useEffect(() => {
    if (resumeRow) {
      setContent(normalizeResume(resumeRow.content));
      setTemplate((resumeRow.template_id as TemplateId) ?? "minimal");
      setCurrentResumeId(resumeRow.id);
      setIsSetupComplete(true);
    }
  }, [resumeRow]);

  // Sync JSON editor when switching tab
  useEffect(() => {
    if (leftTab === "json") {
      setJsonRaw(JSON.stringify(content, null, 2));
    }
  }, [leftTab]);

  const saveResume = useCallback(
    async (c: ResumeContent, tpl = template) => {
      if (!user) return;
      setIsSaving(true);
      try {
        if (currentResumeId) {
          const { error } = await supabase
            .from("documents")
            .update({
              title: c.contact.name ? `${c.contact.name}'s Resume` : "Untitled Resume",
              metadata: {
                content: c,
                template_id: tpl,
                version: 1,
              } as unknown as Json,
              updated_at: new Date().toISOString(),
            })
            .eq("id", currentResumeId);
          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from("documents")
            .insert({
              user_id: user.id,
              title: c.contact.name ? `${c.contact.name}'s Resume` : "Untitled Resume",
              kind: "resume",
              metadata: {
                content: c,
                template_id: tpl,
                version: 1,
              } as unknown as Json,
              is_primary: true,
            })
            .select("id")
            .single();
          if (error) throw error;
          if (data) setCurrentResumeId(data.id);
        }
        await qc.invalidateQueries({ queryKey: ["versions", currentResumeId] });
        await qc.invalidateQueries({ queryKey: ["resumes"] });
        await qc.invalidateQueries({ queryKey: ["documents"] });
        toast.success("Saved");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Save failed";
        toast.error(msg);
      } finally {
        setIsSaving(false);
      }
    },
    [currentResumeId, qc, template, user],
  );

  // Checkpoint creation handler
  const createCheckpoint = useCallback(
    async (label: string, customContent?: ResumeContent, _source: "agent" | "manual" | "user" = "manual") => {
      if (!user) return;
      const targetContent = customContent || content;
      const nextVersion = (versions[0]?.version || 0) + 1;

      try {
        let resumeIdToUse = currentResumeId;
        if (!resumeIdToUse) {
          const { data: newDoc, error: insertErr } = await supabase
            .from("documents")
            .insert({
              user_id: user.id,
              title: targetContent.contact.name ? `${targetContent.contact.name}'s Resume` : "Untitled Resume",
              kind: "resume",
              metadata: {
                content: targetContent,
                template_id: template,
                version: 1,
                checkpoints: [
                  {
                    id: crypto.randomUUID(),
                    version: 1,
                    label,
                    created_at: new Date().toISOString(),
                    content: targetContent,
                    template_id: template,
                  },
                ],
              } as unknown as Json,
              is_primary: true,
            })
            .select("id")
            .single();
          if (insertErr) throw insertErr;
          if (newDoc) {
            resumeIdToUse = newDoc.id;
            setCurrentResumeId(newDoc.id);
          }
        } else {
          const newCheckpoint = {
            id: crypto.randomUUID(),
            version: nextVersion,
            label,
            created_at: new Date().toISOString(),
            content: targetContent,
            template_id: template,
          };
          const { data: doc } = await supabase.from("documents").select("metadata").eq("id", resumeIdToUse).maybeSingle();
          const meta = (doc?.metadata as Record<string, unknown>) || {};
          const existingCheckpoints = (meta["checkpoints"] as unknown[]) || [];
          await supabase
            .from("documents")
            .update({
              metadata: {
                ...meta,
                content: targetContent,
                template_id: template,
                version: nextVersion,
                checkpoints: [newCheckpoint, ...existingCheckpoints],
              } as unknown as Json,
              updated_at: new Date().toISOString(),
            })
            .eq("id", resumeIdToUse);
        }

        if (resumeIdToUse) {
          await qc.invalidateQueries({ queryKey: ["versions", resumeIdToUse] });
          await qc.invalidateQueries({ queryKey: ["resumes"] });
          await qc.invalidateQueries({ queryKey: ["documents"] });
        }
      } catch (err: unknown) {
        console.warn("Checkpoint save note:", err);
      }
    },
    [content, currentResumeId, qc, template, user, versions],
  );

  // Revert to checkpoint
  const handleRevertToCheckpoint = useCallback(
    (checkpoint: CheckpointItem) => {
      const restored = normalizeResume(checkpoint.content);
      const restoredTpl = (checkpoint.template_id as TemplateId) || template;

      void createCheckpoint(`Before reverting to v${checkpoint.version}`, content, "user");

      setContent(restored);
      if (checkpoint.template_id) {
        setTemplate(restoredTpl);
      }
      void saveResume(restored, restoredTpl);

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).slice(2, 10),
          role: "agent",
          text: `🔄 **Checkpoint Restored**: Successfully reverted resume back to **"${checkpoint.label}"** (Version v${checkpoint.version}).`,
        },
      ]);

      toast.success(`Reverted to v${checkpoint.version}: ${checkpoint.label}`);
    },
    [content, createCheckpoint, saveResume, setMessages, template],
  );

  const handleRevertLastChange = useCallback(() => {
    if (versions.length === 0) {
      toast.info("No previous checkpoints found to revert to.");
      return;
    }
    const target = versions[0];
    if (target) {
      handleRevertToCheckpoint({
        id: target.id,
        version: target.version,
        label: target.label || `Version ${target.version}`,
        created_at: target.created_at,
        content: normalizeResume(target.content),
        template_id: target.template_id,
        source: "manual",
      });
    }
  }, [handleRevertToCheckpoint, versions]);

  const formattedVersions: CheckpointItem[] = useMemo(
    () =>
      versions.map((v) => ({
        id: v.id,
        version: v.version,
        label: v.label || `Version ${v.version}`,
        created_at: v.created_at,
        content: normalizeResume(v.content),
        template_id: v.template_id,
      })),
    [versions],
  );

  const currentSessionData = useMemo(
    () => ({
      content,
      template,
      setContent,
      setTemplate,
      saveResume,
      createCheckpoint,
      handleRevertToCheckpoint,
      handleRevertLastChange,
      openCheckpointsModal: () => setShowVersions(true),
      jobRow:
        targetTitle || targetCompany
          ? {
              id: activeJobId,
              title: targetTitle,
              company: targetCompany,
              description: targetDescription,
            }
          : null,
      versions: formattedVersions,
      currentResumeId,
    }),
    [
      content,
      template,
      saveResume,
      createCheckpoint,
      handleRevertToCheckpoint,
      handleRevertLastChange,
      targetTitle,
      targetCompany,
      activeJobId,
      targetDescription,
      formattedVersions,
      currentResumeId,
    ],
  );

  useEffect(() => {
    return registerStudioSession(currentSessionData);
  }, [registerStudioSession]);

  useEffect(() => {
    updateStudioSession(currentSessionData);
  }, [currentSessionData, updateStudioSession]);

  // Execute AI Tailoring with JD + Knowledge Hub
  const handleExecuteTailoring = async (baseContentToUse = content) => {
    setIsTailoring(true);
    const toastId = toast.loading("Analyzing JD & tailoring resume with verified Knowledge Hub proof points...");
    try {
      await createCheckpoint(`Before Tailoring for ${targetCompany || targetTitle || "Target Role"}`, baseContentToUse, "agent");

      const instruction = customInstructions.trim()
        ? `Tailor this resume specifically for ${targetTitle} at ${targetCompany}. Instructions: ${customInstructions}`
        : `Tailor this resume specifically for the position of ${targetTitle} at ${targetCompany}. Optimize summary, strengthen bullet points with strong action verbs & verified metrics, align technical skills, and maximize ATS score.`;

      const res = await tailorFn({
        data: {
          resume: baseContentToUse,
          instruction,
          jobTitle: targetTitle,
          company: targetCompany,
          jobDescription: targetDescription,
          companyResearch: true,
        },
      });

      const parsedNewResume = JSON.parse(res.resumeJson);
      const normalized = normalizeResume(parsedNewResume);
      setContent(normalized);
      void saveResume(normalized);

      setIsSetupComplete(true);
      setReTailorModalOpen(false);
      toast.success("Tailored resume generated successfully!", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Tailoring failed", { id: toastId });
    } finally {
      setIsTailoring(false);
    }
  };

  // Start from Setup Wizard
  const handleStartSetup = async (withAiTailoring: boolean) => {
    let baseResumeContent = starterResume();

    if (selectedBaseResumeId && selectedBaseResumeId !== "starter") {
      const match = userResumes.find((r) => r.id === selectedBaseResumeId);
      if (match) {
        baseResumeContent = normalizeResume(match.content);
        setCurrentResumeId(match.id);
      }
    }

    setContent(baseResumeContent);

    if (withAiTailoring) {
      if (!targetTitle.trim() && !targetDescription.trim()) {
        toast.error("Please enter a job title or paste the job description to tailor.");
        return;
      }
      await handleExecuteTailoring(baseResumeContent);
    } else {
      setIsSetupComplete(true);
      toast.success("Resume loaded in Studio editor");
    }
  };

  const applyJsonEdit = () => {
    try {
      const parsed = JSON.parse(jsonRaw);
      const normalized = normalizeResume(parsed);
      void createCheckpoint("Before Manual JSON Edit", content, "manual");
      setContent(normalized);
      setJsonError(null);
      toast.success("JSON applied (Checkpoint saved)");
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  // ── INITIAL SETUP WIZARD (When user opens Studio directly) ──
  if (!isSetupComplete) {
    return (
      <div className="min-h-full flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-2xl space-y-6 rounded-3xl border border-border bg-card p-8 shadow-lift animate-fade-in">
          <div className="space-y-1.5 border-b border-border/70 pb-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" /> Resume Studio Setup
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Select Resume & Target Job Description
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Choose your base resume and attach the job description you're applying for to tailor bullet points and ATS keywords.
            </p>
          </div>

          <div className="space-y-5">
            {/* Step 1: Base Resume */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                1. Select Base Resume
              </Label>
              <div className="flex gap-2">
                <Select
                  value={selectedBaseResumeId}
                  onValueChange={(val) => setSelectedBaseResumeId(val)}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-secondary/30 font-medium">
                    <SelectValue placeholder="Choose a base resume..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="starter" className="text-xs cursor-pointer">
                      Use Default Master Profile Resume
                    </SelectItem>
                    {userResumes.map((r) => (
                      <SelectItem key={r.id} value={r.id} className="text-xs cursor-pointer">
                        {r.title || "Untitled Resume"} (Template: {r.template_id} • v{r.version})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadModalOpen(true)}
                  className="h-10 text-xs font-semibold rounded-xl gap-1.5 shrink-0"
                >
                  <Upload className="size-3.5" /> Upload File
                </Button>
              </div>
            </div>

            {/* Step 2: Target Job Description */}
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                2. Target Role & Job Description
              </Label>

              {savedJobs.length > 0 && (
                <Select
                  value={activeJobId}
                  onValueChange={(val) => setActiveJobId(val)}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-secondary/30">
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="setup-title" className="text-[11px] font-semibold text-muted-foreground">
                    Job Title
                  </Label>
                  <Input
                    id="setup-title"
                    placeholder="e.g. Staff Backend Engineer"
                    value={targetTitle}
                    onChange={(e) => setTargetTitle(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="setup-comp" className="text-[11px] font-semibold text-muted-foreground">
                    Company Name
                  </Label>
                  <Input
                    id="setup-comp"
                    placeholder="e.g. Stripe, OpenAI"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="setup-desc" className="text-[11px] font-semibold text-muted-foreground">
                  Job Description Requirements
                </Label>
                <Textarea
                  id="setup-desc"
                  rows={4}
                  placeholder="Paste the full job posting requirements to align keywords and bullet points..."
                  value={targetDescription}
                  onChange={(e) => setTargetDescription(e.target.value)}
                  className="text-xs resize-none rounded-xl leading-relaxed bg-secondary/30"
                />
              </div>
            </div>

            {/* Step 3: Custom Focus */}
            <div className="space-y-1">
              <Label htmlFor="setup-inst" className="text-[11px] font-semibold text-muted-foreground">
                Custom Tailoring Focus (Optional)
              </Label>
              <Input
                id="setup-inst"
                placeholder="e.g. Emphasize distributed systems scale and latency reductions"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => void handleStartSetup(false)}
              className="text-xs text-muted-foreground hover:text-foreground order-2 sm:order-1"
            >
              Skip & Open in Editor Directly
            </Button>

            <Button
              type="button"
              onClick={() => void handleStartSetup(true)}
              disabled={isTailoring}
              className="w-full sm:w-auto h-10 font-bold text-xs gap-2 rounded-xl shadow-md order-1 sm:order-2"
            >
              {isTailoring ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Tailoring with Knowledge Hub...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" /> Generate Tailored Resume
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Upload Modal */}
        <UploadResumeModal
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          onLoaded={(loadedResume, newResumeId) => {
            setContent(loadedResume);
            setSelectedBaseResumeId(newResumeId);
            setCurrentResumeId(newResumeId);
            void qc.invalidateQueries({ queryKey: ["resumes"] });
            void qc.invalidateQueries({ queryKey: ["versions", newResumeId] });
          }}
        />
      </div>
    );
  }

  // ── MAIN STUDIO EDITOR CANVAS ──
  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* ── LEFT PANE: Form / JSON Editor ── */}
      {isEditorCollapsed ? (
        <div className="flex w-14 shrink-0 flex-col items-center border-r border-border bg-card py-4 gap-3 transition-all duration-300 shadow-sm">
          <button
            onClick={() => setIsEditorCollapsed(false)}
            className="rounded-xl p-2.5 text-primary hover:bg-primary/10 transition-colors"
            title="Expand editor pane"
          >
            <PanelLeftOpen className="size-5" />
          </button>
          <div className="h-px w-6 bg-border" />
          <button
            onClick={() => {
              setLeftTab("form");
              setIsEditorCollapsed(false);
            }}
            className="rounded-xl p-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Open Form Editor"
          >
            <SquarePen className="size-4.5" />
          </button>
          <button
            onClick={() => {
              setJsonRaw(JSON.stringify(content, null, 2));
              setLeftTab("json");
              setIsEditorCollapsed(false);
            }}
            className="rounded-xl p-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Open JSON Editor"
          >
            <Code2 className="size-4.5" />
          </button>
          <button
            onClick={() => setReTailorModalOpen(true)}
            className="rounded-xl p-2.5 text-primary hover:bg-primary/10 transition-colors"
            title="Re-tailor for target job"
          >
            <Sparkles className="size-4.5" />
          </button>
          <button
            onClick={() => void saveResume(content)}
            disabled={isSaving}
            className="rounded-xl p-2.5 text-primary hover:bg-primary/10 transition-colors"
            title="Save changes"
          >
            {isSaving ? <Loader2 className="size-4.5 animate-spin" /> : <FileText className="size-4.5" />}
          </button>
        </div>
      ) : (
        <div
          className={cn(
            "flex shrink-0 flex-col border-r border-border bg-card transition-all duration-300 shadow-sm",
            isWideEditor ? "w-[680px]" : "w-[520px]",
          )}
        >
          {/* Top Header Toolbar */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-card">
            <button
              onClick={() => setIsEditorCollapsed(true)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors mr-1"
              title="Collapse editor (give 100% space to preview)"
            >
              <PanelLeftClose className="size-4.5" />
            </button>

            <div className="flex items-center rounded-xl bg-secondary p-1 border border-border/60">
              <button
                id="studio-tab-form"
                onClick={() => setLeftTab("form")}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  leftTab === "form"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <SquarePen className="size-4" /> Form
              </button>
              <button
                id="studio-tab-json"
                onClick={() => {
                  setJsonRaw(JSON.stringify(content, null, 2));
                  setLeftTab("json");
                }}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  leftTab === "json"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Code2 className="size-4" /> JSON
              </button>
            </div>

            <button
              onClick={() => setIsWideEditor((w) => !w)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors ml-1"
              title={isWideEditor ? "Normal editor width" : "Wide editor width (680px)"}
            >
              {isWideEditor ? <Minimize2 className="size-4.5" /> : <Maximize2 className="size-4.5" />}
            </button>

            <div className="ml-auto flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1.5 shadow-xs font-medium"
                onClick={() => setReTailorModalOpen(true)}
                title="Switch target JD or re-tailor"
              >
                <Sparkles className="size-3.5 text-primary" />
                <span className="hidden sm:inline">Re-tailor</span>
              </Button>
              <Button
                id="studio-save-btn"
                variant="default"
                size="sm"
                className="h-8 px-3 text-xs gap-1.5 shadow-sm hover:shadow-md transition-all font-semibold"
                disabled={isSaving}
                onClick={() => void saveResume(content)}
              >
                {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />}
                <span>Save</span>
              </Button>
            </div>
          </div>

          {/* Form or JSON Content */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
            {leftTab === "form" ? (
              <ResumeForm value={content} onChange={setContent} />
            ) : (
              <div className="space-y-2.5">
                <textarea
                  id="studio-json-editor"
                  className="h-[calc(100vh-220px)] w-full rounded-xl border border-border bg-secondary/30 font-mono text-xs leading-relaxed p-3.5 focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                  value={jsonRaw}
                  onChange={(e) => {
                    setJsonRaw(e.target.value);
                    setJsonError(null);
                  }}
                  spellCheck={false}
                />
                {jsonError && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive">
                    {jsonError}
                  </p>
                )}
                <Button size="sm" onClick={applyJsonEdit} className="w-full h-8 text-xs font-semibold">
                  Apply JSON to Preview
                </Button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 bg-card/90">
            <div className="flex items-center gap-2">
              <Button
                id="export-pdf-btn"
                variant="default"
                size="sm"
                className="h-8 text-xs gap-1.5 font-semibold shadow-sm hover:shadow-md transition-all"
                disabled={isExportingPdf}
                onClick={handleExportPdf}
              >
                {isExportingPdf ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />} Download PDF
              </Button>
              <Button
                id="export-docx-btn"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 shadow-xs hover:shadow-sm transition-all"
                onClick={() =>
                  exportDocx(
                    content,
                    content.contact.name
                      ? `${content.contact.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_Resume.doc`
                      : "Resume.doc",
                  )
                }
              >
                <Download className="size-3.5" /> DOCX
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setContent(emptyResume())}
              className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* ── CENTER: Live Multi-Page Preview ── */}
      <div className="min-w-0 flex-1 flex flex-col overflow-hidden bg-muted/40">
        {/* Top Preview Control Bar */}
        <div className="border-b border-border bg-card shadow-xs z-10 shrink-0">
          <div className="flex items-center justify-between gap-3 px-5 py-2.5 border-b border-border/50">
            {/* Left: Template Selector, Density, Guides */}
            <div className="flex items-center gap-3">
              {/* Template Selector */}
              <Select value={template} onValueChange={(v) => setTemplate(v as TemplateId)}>
                <SelectTrigger
                  id="template-select"
                  className="h-9 w-[280px] shrink-0 text-xs shadow-xs bg-secondary/50 border-border hover:border-primary/50 transition-all font-medium rounded-xl"
                >
                  <div className="flex items-center gap-2 truncate text-left w-full pr-2">
                    <LayoutTemplate className="size-3.5 text-primary shrink-0" />
                    <span className="font-bold text-foreground shrink-0">
                      {TEMPLATES.find((t) => t.id === template)?.name || "Template"}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      ({TEMPLATES.find((t) => t.id === template)?.blurb.split(".")[0]})
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={6} className="w-[320px] rounded-xl shadow-xl">
                  {TEMPLATES.map((t) => {
                    const isSelected = template === t.id;
                    return (
                      <SelectItem key={t.id} value={t.id} className="text-xs py-2.5 cursor-pointer rounded-lg mb-1 last:mb-0">
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className={cn("font-bold", isSelected ? "text-primary" : "text-foreground")}>
                                {t.name}
                              </span>
                              {isSelected && (
                                <Badge variant="default" className="text-[9px] h-3.5 px-1 py-0 font-bold bg-primary text-primary-foreground">
                                  Active
                                </Badge>
                              )}
                            </div>
                            {t.atsSafe && (
                              <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded">
                                ATS Best
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground leading-snug">{t.blurb}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Density */}
              <div className="flex items-center rounded-xl bg-secondary p-0.5 border border-border/60 shrink-0">
                {(["compact", "normal", "relaxed"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => handleSelectDensity(d)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-[11px] uppercase font-bold transition-all",
                      density === d
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    title={`Preset: ${d}`}
                  >
                    {d[0]}
                  </button>
                ))}
              </div>

              {/* Spacing Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    id="spacing-customizer-btn"
                    className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors shrink-0"
                    title="Fine-tune Section Spacing, Item Spacing & Margins"
                  >
                    <Sliders className="size-3.5 text-primary" />
                    <span className="text-[11px] font-semibold">Spacing</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-84 p-4 rounded-2xl shadow-2xl border border-border bg-card" align="start">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                      <div>
                        <h4 className="text-xs font-bold text-foreground">Spacing & Layout</h4>
                        <p className="text-[10px] text-muted-foreground">Customize gaps to fit 1 or 2 pages</p>
                      </div>
                      <button
                        onClick={() => handleSelectDensity("normal")}
                        className="text-[10px] text-primary hover:underline font-semibold"
                      >
                        Reset
                      </button>
                    </div>

                    {/* Section Spacing */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">Section Spacing</span>
                        <span className="font-mono text-[11px] text-primary font-bold">{currentSpacing.sectionGap}px</span>
                      </div>
                      <Slider
                        min={4}
                        max={32}
                        step={1}
                        value={[currentSpacing.sectionGap]}
                        onValueChange={(val) => {
                          if (val[0] !== undefined) updateSpacing({ sectionGap: val[0] });
                        }}
                      />
                    </div>

                    {/* Item Gap */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">Item Gap</span>
                        <span className="font-mono text-[11px] text-primary font-bold">{currentSpacing.itemGap}px</span>
                      </div>
                      <Slider
                        min={2}
                        max={20}
                        step={1}
                        value={[currentSpacing.itemGap]}
                        onValueChange={(val) => {
                          if (val[0] !== undefined) updateSpacing({ itemGap: val[0] });
                        }}
                      />
                    </div>

                    {/* Margins */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">Margins</span>
                        <span className="font-mono text-[11px] text-primary font-bold">{currentSpacing.pageMargin}px</span>
                      </div>
                      <Slider
                        min={24}
                        max={60}
                        step={2}
                        value={[currentSpacing.pageMargin]}
                        onValueChange={(val) => {
                          if (val[0] !== undefined) updateSpacing({ pageMargin: val[0] });
                        }}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Guides */}
              <button
                onClick={() => setShowPageBreaks((b) => !b)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium border transition-colors shrink-0",
                  showPageBreaks
                    ? "bg-primary/10 border-primary/30 text-primary font-semibold"
                    : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground",
                )}
                title="Toggle A4 Page Break Guides"
              >
                <Eye className="size-3.5" />
                <span className="text-[11px]">Guides</span>
              </button>
            </div>

            {/* Top Right: Download PDF */}
            <div className="ml-auto flex items-center gap-2 shrink-0">
              <Button
                id="preview-export-pdf-btn"
                size="sm"
                className="h-9 px-4 text-xs gap-2 shadow-sm hover:shadow-md transition-all font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isExportingPdf}
                onClick={handleExportPdf}
                title="Download ATS-compliant vector PDF"
              >
                {isExportingPdf ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                <span>Download PDF</span>
              </Button>
            </div>
          </div>

          {/* Line 2: Undo, Checkpoints & Zoom */}
          <div className="flex items-center justify-between gap-3 px-5 py-2 bg-secondary/20">
            <div className="flex items-center gap-2">
              <Button
                id="preview-undo-btn"
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1.5 rounded-xl border-border hover:bg-secondary shrink-0"
                disabled={versions.length === 0}
                onClick={handleRevertLastChange}
                title="Undo / Revert to previous checkpoint"
              >
                <RotateCcw className="size-3.5" />
                <span className="text-[11px]">Undo</span>
              </Button>

              <Button
                id="preview-checkpoints-btn"
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1.5 rounded-xl font-semibold border-border hover:border-primary/50 shrink-0"
                onClick={() => setShowVersions(true)}
                title="View all Checkpoints & Version Timeline"
              >
                <History className="size-3.5 text-primary" />
                <span className="text-[11px]">Checkpoints</span>
                {versions.length > 0 && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4 font-bold bg-primary/10 text-primary">
                    {versions.length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5 rounded-xl bg-secondary/50 px-2.5 py-1 border border-border/70 shrink-0">
              <span className="text-[11px] font-medium text-muted-foreground mr-1">Zoom:</span>
              <button
                onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.05).toFixed(2))))}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="size-3.5" />
              </button>
              <button
                onClick={() => setZoom(0.85)}
                className="font-mono text-xs font-semibold px-1.5 text-center text-foreground hover:text-primary transition-colors"
                title="Reset to 85% (Fit View)"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.05).toFixed(2))))}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="size-3.5" />
              </button>
              <button
                onClick={() => setZoom(0.85)}
                className="ml-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-card hover:bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
                title="Fit to screen (85%)"
              >
                Fit
              </button>
            </div>
          </div>
        </div>

        {/* Document Scroll Area */}
        <div className="min-w-0 flex-1 overflow-auto p-6 sm:p-8 flex justify-center print:p-0">
          <div
            className="origin-top transition-transform duration-150 relative print:shadow-none print:transform-none"
            style={{
              width: "210mm",
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
              marginBottom: `${Math.max(40, (zoom - 0.8) * 350)}px`,
            }}
          >
            <div id="resume-preview-document" className="resume-print w-full flex flex-col items-center relative">
              <ResumeDocument content={content} template={template} density={density} spacing={content.spacing} />
            </div>
          </div>
        </div>
      </div>

      {/* Re-tailor / Change JD Modal */}
      <Dialog open={reTailorModalOpen} onOpenChange={setReTailorModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">
              Tailor Resume to Target Job
            </DialogTitle>
            <DialogDescription className="text-xs">
              Attach a job description to tailor your resume bullet points and summary with verified Knowledge Hub proof points.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="retailor-title" className="text-xs font-semibold text-muted-foreground">
                  Job Title
                </Label>
                <Input
                  id="retailor-title"
                  placeholder="e.g. Senior Backend Engineer"
                  value={targetTitle}
                  onChange={(e) => setTargetTitle(e.target.value)}
                  className="text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="retailor-comp" className="text-xs font-semibold text-muted-foreground">
                  Company Name
                </Label>
                <Input
                  id="retailor-comp"
                  placeholder="e.g. Stripe"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="retailor-desc" className="text-xs font-semibold text-muted-foreground">
                Job Description Requirements
              </Label>
              <Textarea
                id="retailor-desc"
                rows={4}
                placeholder="Paste key responsibilities and requirements..."
                value={targetDescription}
                onChange={(e) => setTargetDescription(e.target.value)}
                className="text-xs resize-none rounded-xl leading-relaxed bg-secondary/30"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="retailor-inst" className="text-xs font-semibold text-muted-foreground">
                Specific Instructions (optional)
              </Label>
              <Input
                id="retailor-inst"
                placeholder="e.g. Emphasize AWS and Kubernetes infrastructure projects"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReTailorModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => void handleExecuteTailoring(content)}
                disabled={isTailoring}
                className="font-bold text-xs gap-1.5 rounded-xl shadow-xs"
              >
                {isTailoring ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                <span>{isTailoring ? "Tailoring..." : "Tailor Resume"}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkpoints & History Modal */}
      <CheckpointsModal
        open={showVersions}
        onOpenChange={setShowVersions}
        checkpoints={versions.map((v) => ({
          id: v.id,
          version: v.version,
          label: v.label || `Version ${v.version}`,
          created_at: v.created_at,
          content: normalizeResume(v.content),
          template_id: v.template_id,
        }))}
        currentContent={content}
        onCreateCheckpoint={(label) => createCheckpoint(label)}
        onRevert={handleRevertToCheckpoint}
      />

      {/* Upload Base Resume Modal */}
      <UploadResumeModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onLoaded={(loadedResume, newResumeId) => {
          setContent(loadedResume);
          setCurrentResumeId(newResumeId);
          void qc.invalidateQueries({ queryKey: ["versions", newResumeId] });
        }}
      />
    </div>
  );
}
