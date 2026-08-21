import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Download,
  Eye,
  FileText,
  Loader2,
  MoreVertical,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  Files,
  FolderOpen,
  Copy,
  ExternalLink,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { normalizeResume, TEMPLATES, type TemplateId, starterResume } from "@/lib/resume";
import { exportDocx, exportPdf } from "@/lib/export";
import { ResumeDocument } from "@/components/resume/ResumeDocument";
import { UploadResumeModal } from "@/components/resume/UploadResumeModal";
import { listDocuments, deleteDocument, getDocument, downloadDocument } from "@/lib/documents.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type ResumesSearch = {
  tab?: "resumes" | "documents" | undefined;
};

export const Route = createFileRoute("/_authenticated/resumes")({
  head: () => ({ meta: [{ title: "Documents & Resumes — CareerOS" }] }),
  component: DocumentsAndResumesPage,
  validateSearch: (s: Record<string, unknown>): ResumesSearch => ({
    tab: s["tab"] === "documents" ? "documents" : "resumes",
  }),
});

type ResumeItem = {
  id: string;
  user_id: string;
  title: string;
  content: unknown;
  template_id: string;
  version: number;
  created_at: string;
  updated_at: string;
  created_from_job_id: string | null;
};

function DocumentsAndResumesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { tab = "resumes" } = useSearch({ from: "/_authenticated/resumes" });
  const [activeTab, setActiveTab] = useState<"resumes" | "documents">(tab);

  // Modal states
  const [deleteResumeId, setDeleteResumeId] = useState<string | null>(null);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<Awaited<ReturnType<typeof getDocument>> | null>(null);
  const [docLoadingId, setDocLoadingId] = useState<string | null>(null);

  // Server functions for documents
  const listDocsFn = useServerFn(listDocuments);
  const deleteDocFn = useServerFn(deleteDocument);
  const getDocFn = useServerFn(getDocument);
  const downloadDocFn = useServerFn(downloadDocument);

  // Queries
  const { data: resumes = [], isLoading: isResumesLoading } = useQuery<ResumeItem[]>({
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
          user_id: user!.id,
          title: doc.title || "Untitled Resume",
          content: meta["content"] || null,
          template_id: (meta["template_id"] as string) || "minimal",
          version: (meta["version"] as number) || 1,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
        } as ResumeItem;
      });
    },
  });

  const { data: documents = [], isLoading: isDocsLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => listDocsFn(),
  });

  // Mutations
  const createResumeMut = useMutation({
    mutationFn: async () => {
      const content = starterResume();
      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: user!.id,
          title: "New Resume",
          kind: "resume",
          metadata: {
            content,
            template_id: "minimal",
            version: 1,
          } as unknown as Json,
          is_primary: true,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => {
      void qc.invalidateQueries({ queryKey: ["resumes"] });
      void qc.invalidateQueries({ queryKey: ["documents"] });
      void navigate({ to: "/studio", search: { resumeId: id } });
    },
    onError: () => toast.error("Could not create resume"),
  });

  const deleteResumeMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["resumes"] });
      void qc.invalidateQueries({ queryKey: ["documents"] });
      setDeleteResumeId(null);
      toast.success("Resume deleted");
    },
    onError: () => toast.error("Delete failed"),
  });

  const handleDeleteDoc = async (id: string) => {
    try {
      await deleteDocFn({ data: { id } });
      toast.success("Document removed");
      qc.invalidateQueries({ queryKey: ["documents"] });
      setDeleteDocId(null);
    } catch {
      toast.error("Failed to delete document");
    }
  };

  const handleViewDoc = async (id: string) => {
    setDocLoadingId(id);
    try {
      const doc = await getDocFn({ data: { id } });
      setViewingDoc(doc);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load document");
    } finally {
      setDocLoadingId(null);
    }
  };

  const handleDownloadDoc = async (id: string) => {
    setDocLoadingId(id);
    try {
      const response = await downloadDocFn({ data: { id } });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match) {
          filename = match[1].replace(/['"]/g, "");
        }
      }
      if (!filename) {
        const mimeType = response.headers.get("Content-Type") || "application/octet-stream";
        const extension = mimeType.split("/")[1] || "bin";
        filename = `document.${extension}`;
      }
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to download");
    } finally {
      setDocLoadingId(null);
    }
  };

  const primaryDoc = documents.find((d) => d.is_primary);

  return (
    <div className="flex min-h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Files className="size-5" />
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                Documents & Resumes
              </h1>
            </div>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Manage your tailored ATS resumes, uploaded raw documents, and knowledge base files.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              id="upload-resume-btn"
              variant="outline"
              onClick={() => setUploadModalOpen(true)}
              className="rounded-xl shadow-xs hover:shadow-sm"
            >
              <Upload className="mr-2 size-4" />
              Upload Resume / Document
            </Button>

            <Button
              id="create-resume-btn"
              onClick={() => createResumeMut.mutate()}
              disabled={createResumeMut.isPending}
              className="rounded-xl shadow-sm hover:shadow-md"
            >
              {createResumeMut.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Plus className="mr-2 size-4" />
              )}
              New Blank Resume
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/80 bg-background/50 p-3">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Tailored Resumes
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xl font-bold text-foreground">{resumes.length}</span>
              <span className="text-xs text-muted-foreground">in Studio</span>
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-background/50 p-3">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Uploaded Files
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xl font-bold text-foreground">{documents.length}</span>
              <span className="text-xs text-muted-foreground">knowledge items</span>
            </div>
          </div>

          <div className="col-span-2 rounded-xl border border-border/80 bg-background/50 p-3 sm:col-span-1">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Primary Resume
            </div>
            <div className="mt-1 truncate text-sm font-semibold text-primary">
              {primaryDoc ? primaryDoc.title : "Not set"}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 px-6 py-6">
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            const t = val as "resumes" | "documents";
            setActiveTab(t);
            void navigate({ to: "/resumes", search: { tab: t }, replace: true });
          }}
          className="w-full space-y-6"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2 rounded-xl bg-muted/60 p-1">
            <TabsTrigger value="resumes" className="rounded-lg text-xs font-semibold">
              <Sparkles className="mr-1.5 size-3.5" />
              Tailored Resumes ({resumes.length})
            </TabsTrigger>
            <TabsTrigger value="documents" className="rounded-lg text-xs font-semibold">
              <FileText className="mr-1.5 size-3.5" />
              Uploaded Files ({documents.length})
            </TabsTrigger>
          </TabsList>

          {/* ── TAB 1: TAILORED RESUMES ── */}
          <TabsContent value="resumes" className="space-y-6 mt-0">
            {isResumesLoading && (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            )}

            {!isResumesLoading && resumes.length === 0 && (
              <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-border bg-card/50 py-20 text-center">
                <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="size-7" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">No tailored resumes yet</h3>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                    Create a blank ATS resume or upload your previous PDF to parse and tailor for job postings.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={() => setUploadModalOpen(true)} className="rounded-xl shadow-sm">
                    <Upload className="mr-1.5 size-4" /> Upload Resume
                  </Button>
                  <Button variant="outline" onClick={() => createResumeMut.mutate()} className="rounded-xl">
                    <Plus className="mr-1.5 size-4" /> New Blank Resume
                  </Button>
                </div>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {resumes.map((resume) => {
                const content = normalizeResume(resume.content);
                const tpl = (resume.template_id as TemplateId) ?? "minimal";
                const tplLabel = TEMPLATES.find((t) => t.id === tpl)?.name ?? tpl;

                return (
                  <div
                    key={resume.id}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* Miniature preview */}
                    <div className="relative h-48 overflow-hidden bg-white">
                      <div
                        className="pointer-events-none origin-top-left"
                        style={{ transform: "scale(0.32)", width: "312.5%", height: "312.5%" }}
                      >
                        <ResumeDocument content={content} template={tpl} density="compact" />
                      </div>
                      {/* Overlay actions */}
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          id={`open-resume-${resume.id}`}
                          size="sm"
                          asChild
                          className="shadow-lg hover:shadow-xl rounded-xl"
                        >
                          <Link to="/studio" search={{ resumeId: resume.id }}>
                            <Eye className="mr-1.5 size-4" /> Open Studio
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex items-start justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {resume.title || content.contact.name || "Untitled Resume"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {tplLabel} · v{resume.version} ·{" "}
                          {new Date(resume.updated_at).toLocaleDateString()}
                        </p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            id={`resume-menu-${resume.id}`}
                            className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                          >
                            <MoreVertical className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem asChild className="rounded-lg">
                            <Link to="/studio" search={{ resumeId: resume.id }}>
                              <Sparkles className="mr-2 size-4" /> Open in Studio
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              void exportPdf(
                                null,
                                content.contact.name
                                  ? `${content.contact.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_Resume.pdf`
                                  : "Resume.pdf",
                                content,
                                tpl,
                                "normal",
                              )
                            }
                            className="rounded-lg"
                          >
                            <Download className="mr-2 size-4" /> Download PDF (ATS)
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              exportDocx(
                                content,
                                content.contact.name
                                  ? `${content.contact.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_Resume.doc`
                                  : "Resume.doc",
                              )
                            }
                            className="rounded-lg"
                          >
                            <Download className="mr-2 size-4" /> Download DOCX
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive rounded-lg"
                            onClick={() => setDeleteResumeId(resume.id)}
                          >
                            <Trash2 className="mr-2 size-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ── TAB 2: UPLOADED DOCUMENTS & FILES ── */}
          <TabsContent value="documents" className="space-y-6 mt-0">
            {isDocsLoading && (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            )}

            {!isDocsLoading && documents.length === 0 && (
              <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-border bg-card/50 py-20 text-center">
                <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <FileText className="size-7" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">No uploaded documents</h3>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                    Upload your resume, portfolio materials, or past work to power AI tailoring and knowledge search.
                  </p>
                </div>
                <Button asChild className="rounded-xl shadow-sm">
                  <Link to="/upload">
                    <Upload className="mr-1.5 size-4" /> Upload Document
                  </Link>
                </Button>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {documents.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileText className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-semibold text-foreground text-sm">{d.title}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                          {d.kind.replace("_", " ")}
                        </Badge>
                        {d.is_primary && (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                            Primary
                          </Badge>
                        )}
                        {d.size_bytes && (
                          <span className="text-[11px] text-muted-foreground">
                            {(d.size_bytes / 1024).toFixed(0)} KB
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Uploaded {new Date(d.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDoc(d.id)}
                      disabled={docLoadingId === d.id}
                      className="rounded-lg text-xs"
                    >
                      {docLoadingId === d.id ? (
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      ) : (
                        <Eye className="mr-1.5 size-3.5" />
                      )}
                      View Text
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadDoc(d.id)}
                        disabled={docLoadingId === d.id}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                        title="Download file"
                      >
                        <Download className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDocId(d.id)}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                        title="Delete document"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Resume Dialog */}
      <AlertDialog open={!!deleteResumeId} onOpenChange={() => setDeleteResumeId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl">Delete this resume?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This cannot be undone. The resume and all its checkpoint versions will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              id="confirm-delete-btn"
              className={cn("bg-destructive text-white hover:bg-destructive/90 rounded-lg")}
              onClick={() => deleteResumeId && deleteResumeMut.mutate(deleteResumeId)}
            >
              {deleteResumeMut.isPending ? <Loader2 className="size-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Document Dialog */}
      <AlertDialog open={!!deleteDocId} onOpenChange={() => setDeleteDocId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl">Delete this document?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This will remove the document and its indexed chunks from your knowledge base.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90 rounded-lg"
              onClick={() => deleteDocId && handleDeleteDoc(deleteDocId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Document Dialog */}
      <Dialog open={!!viewingDoc} onOpenChange={(o) => !o && setViewingDoc(null)}>
        <DialogContent className="max-w-3xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileText className="size-5 text-primary" />
              {viewingDoc?.title}
            </DialogTitle>
          </DialogHeader>

          {viewingDoc?.extracted_text ? (
            <div className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-muted/30 p-4 text-xs font-mono leading-relaxed">
              {viewingDoc.extracted_text}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No extracted text stored for this document.
              {viewingDoc?.storage_path ? " You can download the original file below." : ""}
            </p>
          )}

          <DialogFooter className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {viewingDoc?.extracted_text && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (viewingDoc?.extracted_text) {
                      void navigator.clipboard.writeText(viewingDoc.extracted_text);
                      toast.success("Text copied to clipboard");
                    }
                  }}
                  className="rounded-lg text-xs"
                >
                  <Copy className="mr-1.5 size-3.5" /> Copy Text
                </Button>
              )}
              {viewingDoc?.id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDoc(viewingDoc.id)}
                  className="rounded-lg text-xs"
                >
                  <Download className="mr-1.5 size-3.5" /> Download File
                </Button>
              )}
            </div>
            <Button onClick={() => setViewingDoc(null)} className="rounded-lg text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload and Tailor Modal */}
      <UploadResumeModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
    </div>
  );
}
