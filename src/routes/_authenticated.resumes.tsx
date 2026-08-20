import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { normalizeResume, TEMPLATES, type TemplateId, starterResume } from "@/lib/resume";
import { exportDocx, exportPdf } from "@/lib/export";
import { ResumeDocument } from "@/components/resume/ResumeDocument";
import { UploadResumeModal } from "@/components/resume/UploadResumeModal";
import { Button } from "@/components/ui/button";
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

export const Route = createFileRoute("/_authenticated/resumes")({
  head: () => ({ meta: [{ title: "My Resumes — CareerOS" }] }),
  component: ResumesPage,
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

function ResumesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const { data: resumes = [], isLoading } = useQuery<ResumeItem[]>({
    queryKey: ["resumes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ResumeItem[];
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const content = starterResume();
      const { data, error } = await supabase
        .from("resumes")
        .insert({
          user_id: user!.id,
          title: "New Resume",
          content: content as unknown as Json,
          template_id: "minimal",
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => {
      void qc.invalidateQueries({ queryKey: ["resumes"] });
      void navigate({ to: "/studio", search: { resumeId: id } });
    },
    onError: () => toast.error("Could not create resume"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("resumes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["resumes"] });
      setDeleteId(null);
      toast.success("Resume deleted");
    },
    onError: () => toast.error("Delete failed"),
  });

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-6 shadow-sm">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My Resumes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {resumes.length} resume{resumes.length !== 1 ? "s" : ""} saved
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            id="upload-resume-btn"
            variant="outline"
            onClick={() => setUploadModalOpen(true)}
            className="shadow-sm hover:shadow-md transition-all h-10 rounded-xl"
          >
            <Upload className="size-4 mr-2" />
            Upload Previous Resume
          </Button>

          <Button
            id="create-resume-btn"
            onClick={() => createMut.mutate()}
            disabled={createMut.isPending}
            className="shadow-md hover:shadow-lg transition-all h-10 rounded-xl"
          >
            {createMut.isPending ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <Plus className="size-4 mr-2" />
            )}
            New Blank Resume
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 px-6 py-6">
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && resumes.length === 0 && (
          <div className="flex flex-col items-center gap-6 py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary">
              <FileText className="size-8 text-primary" />
            </div>
            <div>
              <p className="text-xl font-semibold text-foreground">No resumes yet</p>
              <p className="mt-1 text-sm text-muted-foreground max-w-md">
                Upload your previous PDF/Word resume to parse and adapt, or start from a blank ATS-tested template.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button onClick={() => setUploadModalOpen(true)} className="shadow-md hover:shadow-lg transition-all">
                <Upload className="size-4 mr-2" /> Upload Resume (PDF / Word)
              </Button>
              <Button variant="outline" onClick={() => createMut.mutate()} className="shadow-sm hover:shadow-md transition-all">
                <Plus className="size-4 mr-2" /> Create Blank
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
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-xl hover:translate-y-[-4px]"
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
                      className="shadow-lg hover:shadow-xl transition-all"
                    >
                      <Link to="/studio" search={{ resumeId: resume.id }}>
                        <Eye className="size-4 mr-1.5" /> Open Studio
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <div className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {resume.title || content.contact.name || "Untitled"}
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
                        onClick={() => setDeleteId(resume.id)}
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
      </div>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl">Delete this resume?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This cannot be undone. The resume and all its versions will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              id="confirm-delete-btn"
              className={cn("bg-destructive text-white hover:bg-destructive/90 rounded-lg")}
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
            >
              {deleteMut.isPending ? <Loader2 className="size-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload and Tailor Modal */}
      <UploadResumeModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
    </div>
  );
}
