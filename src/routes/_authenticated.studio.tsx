import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
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
  const { registerStudioSession, setMessages } = useAgentContext();
  const { resumeId, jobId } = useSearch({ from: "/_authenticated/studio" });

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

  // Load job description for context
  const { data: jobRow } = useQuery({
    queryKey: ["job", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data } = await supabase.from("jobs").select("*").eq("id", jobId!).maybeSingle();
      return data;
    },
  });

  // Load resume from DB
  const { data: resumeRow } = useQuery({
    queryKey: ["resume", resumeId],
    enabled: !!resumeId,
    queryFn: async () => {
      const { data } = await supabase
        .from("resumes")
        .select("*")
        .eq("id", resumeId!)
        .maybeSingle();
      return data;
    },
  });

  // Load version history / checkpoints
  const { data: versions = [] } = useQuery({
    queryKey: ["versions", currentResumeId],
    enabled: !!currentResumeId,
    queryFn: async () => {
      const { data } = await supabase
        .from("resume_versions")
        .select("*")
        .eq("resume_id", currentResumeId!)
        .order("version", { ascending: false })
        .limit(30);
      return (data ?? []) as Array<{
        id: string;
        version: number;
        label: string | null;
        created_at: string;
        content: unknown;
        resume_id: string;
        user_id: string;
        template_id?: string;
      }>;
    },
  });

  useEffect(() => {
    if (resumeRow) {
      setContent(normalizeResume(resumeRow.content));
      setTemplate((resumeRow.template_id as TemplateId) ?? "minimal");
      setCurrentResumeId(resumeRow.id);
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
          await supabase
            .from("resumes")
            .update({ content: c as unknown as Json, template_id: tpl, updated_at: new Date().toISOString() })
            .eq("id", currentResumeId);
        } else {
          const { data } = await supabase
            .from("resumes")
            .insert({
              user_id: user.id,
              title: c.contact.name || "Untitled Resume",
              content: c as unknown as Json,
              template_id: tpl,
              created_from_job_id: jobId ?? null,
            })
            .select("id")
            .single();
          if (data) setCurrentResumeId(data.id);
        }
        await qc.invalidateQueries({ queryKey: ["versions", currentResumeId] });
        toast.success("Saved");
      } catch {
        toast.error("Save failed");
      } finally {
        setIsSaving(false);
      }
    },
    [currentResumeId, jobId, qc, template, user],
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
          const { data: newResume } = await supabase
            .from("resumes")
            .insert({
              user_id: user.id,
              title: targetContent.contact.name || "Untitled Resume",
              content: targetContent as unknown as Json,
              template_id: template,
              created_from_job_id: jobId ?? null,
            })
            .select("id")
            .single();
          if (newResume) {
            resumeIdToUse = newResume.id;
            setCurrentResumeId(newResume.id);
          }
        }

        if (resumeIdToUse) {
          await supabase.from("resume_versions").insert({
            resume_id: resumeIdToUse,
            user_id: user.id,
            version: nextVersion,
            label,
            content: targetContent as unknown as Json,
            template_id: template,
          });
          await qc.invalidateQueries({ queryKey: ["versions", resumeIdToUse] });
          toast.success(`Checkpoint saved: ${label} (v${nextVersion})`);
        }
      } catch (err) {
        console.error("Checkpoint save failed:", err);
        toast.error("Could not save checkpoint");
      }
    },
    [content, currentResumeId, jobId, qc, template, user, versions],
  );

  // Revert to any specific checkpoint
  const handleRevertToCheckpoint = useCallback(
    (checkpoint: CheckpointItem) => {
      const restored = normalizeResume(checkpoint.content);
      const restoredTpl = (checkpoint.template_id as TemplateId) || template;

      // Auto-save a safety checkpoint before reverting
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

  // Quick Revert to latest previous checkpoint
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

  // Register this studio session with the global AgentContext
  useEffect(() => {
    return registerStudioSession({
      content,
      template,
      setContent,
      setTemplate,
      saveResume,
      createCheckpoint,
      handleRevertToCheckpoint,
      handleRevertLastChange,
      openCheckpointsModal: () => setShowVersions(true),
      jobRow: jobRow
        ? {
            id: jobRow.id,
            title: jobRow.title,
            company: jobRow.company,
            description: jobRow.description,
          }
        : null,
      versions: formattedVersions,
      currentResumeId,
    });
  }, [
    content,
    template,
    saveResume,
    createCheckpoint,
    handleRevertToCheckpoint,
    handleRevertLastChange,
    jobRow,
    formattedVersions,
    currentResumeId,
    registerStudioSession,
  ]);

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

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* ── LEFT PANE: form / JSON editor ── */}
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
            onClick={() => setUploadModalOpen(true)}
            className="rounded-xl p-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Upload resume (PDF / DOCX)"
          >
            <Upload className="size-4.5" />
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
                id="studio-upload-btn"
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1.5 shadow-xs hover:border-primary/50 transition-all font-medium"
                onClick={() => setUploadModalOpen(true)}
                title="Upload previous resume (PDF / DOCX)"
              >
                <Upload className="size-3.5" />
                <span className="hidden sm:inline">Upload</span>
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
                  className="h-[calc(100vh-250px)] w-full rounded-xl border border-border bg-secondary/30 font-mono text-xs leading-relaxed p-3.5 focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
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
                <Button size="sm" onClick={applyJsonEdit} className="w-full h-8 text-xs">
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

      {/* ── CENTER: live multi-page preview ── */}
      <div className="min-w-0 flex-1 flex flex-col overflow-hidden bg-muted/40">
        {/* Top Preview Control Bar - 2 Clean Lines */}
        <div className="border-b border-border bg-card shadow-xs z-10 shrink-0">
          {/* Line 1: Expanded Template Selector, Density, Guides ──> Download PDF in top right corner */}
          <div className="flex items-center justify-between gap-3 px-5 py-2.5 border-b border-border/50">
            {/* Left: Expanded Template Selector, Density, Guides */}
            <div className="flex items-center gap-3">
              {/* Expanded Template Selector */}
              <Select value={template} onValueChange={(v) => setTemplate(v as TemplateId)}>
                <SelectTrigger
                  id="template-select"
                  className="h-9 w-[300px] shrink-0 text-xs shadow-xs bg-secondary/50 border-border hover:border-primary/50 transition-all font-medium rounded-xl"
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

              {/* Spacing & Layout Customizer Popover */}
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
                        Reset to Normal
                      </button>
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quick Presets</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(["compact", "normal", "relaxed"] as const).map((preset) => (
                          <button
                            key={preset}
                            onClick={() => handleSelectDensity(preset)}
                            className={cn(
                              "rounded-lg px-2 py-1.5 text-[11px] font-medium border text-center transition-all capitalize",
                              density === preset
                                ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                                : "bg-secondary text-muted-foreground hover:text-foreground border-border",
                            )}
                          >
                            {preset === "compact" ? "Compact (1P)" : preset === "normal" ? "Standard" : "Spacious"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Section Spacing Slider */}
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
                      <div className="flex justify-between text-[9px] text-muted-foreground">
                        <span>Tight (4px)</span>
                        <span>Spacious (32px)</span>
                      </div>
                    </div>

                    {/* Item Spacing Slider */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">Item / Entry Gap</span>
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
                      <div className="flex justify-between text-[9px] text-muted-foreground">
                        <span>Tight (2px)</span>
                        <span>Spacious (20px)</span>
                      </div>
                    </div>

                    {/* Line Height Slider */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">Line Height</span>
                        <span className="font-mono text-[11px] text-primary font-bold">{Number(currentSpacing.lineHeight).toFixed(2)}</span>
                      </div>
                      <Slider
                        min={1.20}
                        max={1.80}
                        step={0.02}
                        value={[currentSpacing.lineHeight]}
                        onValueChange={(val) => {
                          if (val[0] !== undefined) updateSpacing({ lineHeight: Number(val[0].toFixed(2)) });
                        }}
                      />
                      <div className="flex justify-between text-[9px] text-muted-foreground">
                        <span>Compact (1.20)</span>
                        <span>Relaxed (1.80)</span>
                      </div>
                    </div>

                    {/* Margins Slider */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">Page Margins</span>
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
                      <div className="flex justify-between text-[9px] text-muted-foreground">
                        <span>Narrow (24px)</span>
                        <span>Wide (60px)</span>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Page Guide Toggle */}
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

            {/* Top Right Corner: Download PDF */}
            <div className="ml-auto flex items-center shrink-0">
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

          {/* Line 2: Undo, Checkpoints & Prominent Zoom Controls */}
          <div className="flex items-center justify-between gap-3 px-5 py-2 bg-secondary/20">
            {/* Left: Undo & Checkpoints */}
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

            {/* Right: Prominent Zoom Controls */}
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
            {/* Paper Document Container */}
            <div id="resume-preview-document" className="resume-print w-full flex flex-col items-center relative">
              <ResumeDocument content={content} template={template} density={density} spacing={content.spacing} />
            </div>
          </div>
        </div>
      </div>



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

      {/* Upload & Tailor Modal */}
      <UploadResumeModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        initialJob={
          jobRow
            ? {
                id: jobRow.id,
                title: jobRow.title,
                company: jobRow.company,
                description: jobRow.description || undefined,
              }
            : null
        }
        onLoaded={(loadedResume, newResumeId) => {
          setContent(loadedResume);
          setCurrentResumeId(newResumeId);
          void qc.invalidateQueries({ queryKey: ["versions", newResumeId] });
        }}
      />
    </div>
  );
}
