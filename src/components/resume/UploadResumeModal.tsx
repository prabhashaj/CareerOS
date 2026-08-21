import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Upload,
  FileText,
  Sparkles,
  Loader2,
  FileType,
  FileCode,
} from "lucide-react";
import { toast } from "sonner";
import { parseResumeFile, parseResumeText } from "@/lib/agent.functions";
import { normalizeResume, type ResumeContent } from "@/lib/resume";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Callback when resume is parsed and saved */
  onLoaded?: (resume: ResumeContent, resumeId: string, title: string) => void;
};

export function UploadResumeModal({ open, onOpenChange, onLoaded }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const parseFileFn = useServerFn(parseResumeFile);
  const parseTextFn = useServerFn(parseResumeText);

  const [uploadMethod, setUploadMethod] = useState<"file" | "paste">("file");
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setRawText("");
    setIsProcessing(false);
    setProcessingStatus("");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  };

  // Helper to extract clean error message
  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) return err.message;
    if (typeof err === "object" && err !== null) {
      const e = err as Record<string, unknown>;
      if (typeof e["message"] === "string") return e["message"];
      if (typeof e["error"] === "string") return e["error"];
    }
    return String(err || "Failed to process document");
  };

  // 1. Process and save uploaded file
  const processFileMut = useMutation({
    mutationFn: async (selectedFile: File) => {
      if (!user) throw new Error("Please sign in first");
      setIsProcessing(true);
      setProcessingStatus(`Reading document: ${selectedFile.name}...`);

      // Read file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          const commaIdx = res.indexOf(",");
          resolve(commaIdx !== -1 ? res.slice(commaIdx + 1) : res);
        };
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(selectedFile);
      });

      setProcessingStatus("AI is structuring your resume facts & experience...");
      const res = await parseFileFn({
        data: {
          base64,
          filename: selectedFile.name,
          mimeType: selectedFile.type,
        },
      });

      const parsed = JSON.parse(res.resumeJson);
      const normalized = normalizeResume(parsed);

      setProcessingStatus("Saving base resume to your documents library...");
      const resumeTitle = normalized.contact.name
        ? `${normalized.contact.name}'s Resume`
        : selectedFile.name.replace(/\.[^/.]+$/, "") || "Imported Resume";

      // Clear previous primary resume flags
      try {
        await supabase
          .from("documents")
          .update({ is_primary: false })
          .eq("user_id", user.id)
          .eq("kind", "resume");
      } catch (e) {
        console.warn("Primary reset note:", e);
      }

      // Save structured resume to documents table with kind: 'resume'
      const { data: savedDoc, error: saveErr } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          title: resumeTitle,
          kind: "resume",
          extracted_text: res.extractedText || "",
          metadata: {
            content: normalized,
            template_id: "minimal",
            version: 1,
          } as unknown as Json,
          is_primary: true,
        })
        .select("id")
        .single();

      if (saveErr) throw saveErr;

      return {
        resumeId: savedDoc.id,
        resumeContent: normalized,
        resumeTitle,
      };
    },
    onSuccess: async ({ resumeId, resumeContent, resumeTitle }) => {
      await qc.invalidateQueries({ queryKey: ["resumes"] });
      await qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document uploaded & structured successfully!");
      handleClose(false);

      if (onLoaded) {
        onLoaded(resumeContent, resumeId, resumeTitle);
      }
    },
    onError: (err: unknown) => {
      setIsProcessing(false);
      toast.error(getErrorMessage(err));
    },
  });

  // 2. Process and save pasted raw text
  const processTextMut = useMutation({
    mutationFn: async (text: string) => {
      if (!user) throw new Error("Please sign in first");
      setIsProcessing(true);
      setProcessingStatus("AI is structuring your pasted resume facts...");

      const res = await parseTextFn({ data: { text } });
      const parsed = JSON.parse(res.resumeJson);
      const normalized = normalizeResume(parsed);

      setProcessingStatus("Saving base resume to your library...");
      const resumeTitle = normalized.contact.name
        ? `${normalized.contact.name}'s Resume`
        : "Pasted Resume";

      // Clear previous primary resume flags
      try {
        await supabase
          .from("documents")
          .update({ is_primary: false })
          .eq("user_id", user.id)
          .eq("kind", "resume");
      } catch (e) {
        console.warn("Primary reset note:", e);
      }

      // Save structured resume to documents table with kind: 'resume'
      const { data: savedDoc, error: saveErr } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          title: resumeTitle,
          kind: "resume",
          extracted_text: text,
          metadata: {
            content: normalized,
            template_id: "minimal",
            version: 1,
          } as unknown as Json,
          is_primary: true,
        })
        .select("id")
        .single();

      if (saveErr) throw saveErr;

      return {
        resumeId: savedDoc.id,
        resumeContent: normalized,
        resumeTitle,
      };
    },
    onSuccess: async ({ resumeId, resumeContent, resumeTitle }) => {
      await qc.invalidateQueries({ queryKey: ["resumes"] });
      await qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Resume text structured & saved to your library!");
      handleClose(false);

      if (onLoaded) {
        onLoaded(resumeContent, resumeId, resumeTitle);
      }
    },
    onError: (err: unknown) => {
      setIsProcessing(false);
      toast.error(getErrorMessage(err));
    },
  });

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      processFileMut.mutate(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFileMut.mutate(selectedFile);
    }
  };

  const handlePasteSubmit = () => {
    if (!rawText.trim() || rawText.trim().length < 10) {
      toast.error("Please paste at least 10 characters of resume text.");
      return;
    }
    processTextMut.mutate(rawText.trim());
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Upload className="size-4" />
            </div>
            <div>
              <DialogTitle className="font-display text-lg font-bold">Upload Resume Document</DialogTitle>
              <DialogDescription className="text-xs">
                Upload your existing PDF, Word (.docx), or text resume to save as your base document.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center animate-fade-in">
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-foreground">Importing Document</div>
              <p className="text-xs text-muted-foreground">{processingStatus}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <Tabs
              value={uploadMethod}
              onValueChange={(v) => setUploadMethod(v as "file" | "paste")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 rounded-xl bg-secondary/50 p-1">
                <TabsTrigger value="file" className="text-xs font-semibold rounded-lg flex items-center gap-1.5">
                  <FileType className="size-3.5" /> File Upload
                </TabsTrigger>
                <TabsTrigger value="paste" className="text-xs font-semibold rounded-lg flex items-center gap-1.5">
                  <FileCode className="size-3.5" /> Paste Raw Text
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: File Upload */}
              <TabsContent value="file" className="mt-3 space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.doc"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-primary/50 bg-secondary/20 hover:bg-secondary/40 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
                >
                  <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary mx-auto">
                    <FileText className="size-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-foreground">Click to browse or drop your resume</div>
                    <div className="text-[11px] text-muted-foreground">Supports PDF, DOCX, and TXT</div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Paste Raw Text */}
              <TabsContent value="paste" className="mt-3 space-y-3">
                <Textarea
                  rows={6}
                  placeholder="Paste your raw resume text, markdown, or summary here..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="text-xs resize-none rounded-xl leading-relaxed bg-secondary/30"
                />
                <Button
                  onClick={handlePasteSubmit}
                  disabled={rawText.trim().length < 10}
                  className="w-full font-bold text-xs h-9 rounded-xl shadow-xs"
                >
                  <Sparkles className="size-3.5 mr-1.5" /> Parse and Save Base Resume
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
