import { useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  Loader2,
  ArrowRight,
  FileType,
  FileCode,
} from "lucide-react";
import { toast } from "sonner";
import { extractTextFromFile } from "@/lib/extract-text";
import { parseResumeText, tailorResume } from "@/lib/agent.functions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Step = "upload" | "tailor" | "processing";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional job context if opened from a specific job */
  initialJob?: {
    id?: string;
    title?: string;
    company?: string;
    description?: string;
  } | null;
  /** Optional callback when resume is loaded without redirecting */
  onLoaded?: (resume: ResumeContent, resumeId: string) => void;
};

export function UploadResumeModal({ open, onOpenChange, initialJob, onLoaded }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [step, setStep] = useState<Step>("upload");
  const [uploadMethod, setUploadMethod] = useState<"file" | "paste">("file");
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");

  // Extracted resume data
  const [parsedResume, setParsedResume] = useState<ResumeContent | null>(null);

  // Job tailoring options
  const [jobOption, setJobOption] = useState<"custom" | "saved">(
    initialJob ? "custom" : "custom",
  );
  const [targetTitle, setTargetTitle] = useState(initialJob?.title ?? "");
  const [targetCompany, setTargetCompany] = useState(initialJob?.company ?? "");
  const [targetDescription, setTargetDescription] = useState(initialJob?.description ?? "");
  const [selectedSavedJobId, setSelectedSavedJobId] = useState<string>(initialJob?.id ?? "");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch saved jobs for selection
  const { data: savedJobs = [] } = useQuery({
    queryKey: ["saved-jobs", user?.id],
    enabled: open && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, company, location, description, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        title: string;
        company: string;
        location: string | null;
        description: string | null;
        created_at: string;
      }>;
    },
  });

  const resetState = () => {
    setStep("upload");
    setFile(null);
    setRawText("");
    setParsedResume(null);
    setIsExtracting(false);
    setProcessingStatus("");
    if (!initialJob) {
      setTargetTitle("");
      setTargetCompany("");
      setTargetDescription("");
      setSelectedSavedJobId("");
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  };

  // Step 1: Parse uploaded resume with Mistral AI
  const parseMut = useMutation({
    mutationFn: async (text: string) => {
      setProcessingStatus("AI is structuring your resume facts...");
      const res = await parseResumeText({ data: { text } });
      const parsed = JSON.parse(res.resumeJson);
      return normalizeResume(parsed);
    },
    onSuccess: (resume) => {
      setParsedResume(resume);
      setStep("tailor");
      toast.success("Resume successfully parsed!");
    },
    onError: (err: unknown) => {
      setStep("upload");
      const msg = err instanceof Error ? err.message : "Failed to parse resume";
      toast.error(msg);
    },
  });

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) void processSelectedFile(droppedFile);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) void processSelectedFile(selectedFile);
  };

  const processSelectedFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsExtracting(true);
    setStep("processing");
    setProcessingStatus(`Reading document: ${selectedFile.name}...`);

    try {
      const text = await extractTextFromFile(selectedFile);
      if (!text || text.trim().length < 20) {
        throw new Error("Could not extract sufficient text from this file. Please try another file or paste text directly.");
      }
      setIsExtracting(false);
      parseMut.mutate(text);
    } catch (err: unknown) {
      setIsExtracting(false);
      setStep("upload");
      const msg = err instanceof Error ? err.message : "Failed to extract text from file";
      toast.error(msg);
    }
  };

  const handlePasteSubmit = () => {
    if (!rawText.trim() || rawText.trim().length < 20) {
      toast.error("Please paste at least 20 characters of resume text.");
      return;
    }
    setStep("processing");
    parseMut.mutate(rawText.trim());
  };

  // Step 2A: Tailor to Job & Save
  const tailorAndSaveMut = useMutation({
    mutationFn: async () => {
      if (!user || !parsedResume) throw new Error("No resume to tailor");

      let jobTitle = targetTitle.trim();
      let company = targetCompany.trim();
      let jobDesc = targetDescription.trim();
      let jobIdToLink: string | null = null;

      if (jobOption === "saved" && selectedSavedJobId) {
        const savedJob = savedJobs.find((j) => j.id === selectedSavedJobId);
        if (savedJob) {
          jobTitle = savedJob.title;
          company = savedJob.company;
          jobDesc = savedJob.description || "";
          jobIdToLink = savedJob.id;
        }
      }

      if (!jobDesc) {
        throw new Error("Please enter or select a job description to tailor your resume.");
      }

      setStep("processing");
      setProcessingStatus("AI is tailoring keywords and experience to the job description...");

      // 1. Call AI tailor function
      const tailorRes = await tailorResume({
        data: {
          resume: parsedResume,
          instruction: `Tailor this resume precisely for the ${jobTitle || "target"} role at ${company || "the company"}. Optimize keywords and emphasize matching skills.`,
          jobTitle,
          company,
          jobDescription: jobDesc,
        },
      });

      const tailoredContent = normalizeResume(JSON.parse(tailorRes.resumeJson));

      // 2. If it was a custom job description, save it to jobs table
      if (!jobIdToLink && jobDesc) {
        const { data: newJob } = await supabase
          .from("jobs")
          .insert({
            user_id: user.id,
            title: jobTitle || "Target Job",
            company: company || "Target Company",
            description: jobDesc,
          })
          .select("id")
          .single();
        if (newJob) jobIdToLink = newJob.id;
      }

      // 3. Save tailored resume
      const resumeTitle = `${parsedResume.contact.name || "Resume"} — ${jobTitle || "Tailored"}`;
      const { data: savedResume, error: resumeErr } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          title: resumeTitle,
          content: tailoredContent as unknown as Json,
          template_id: "minimal",
          created_from_job_id: jobIdToLink,
        })
        .select("id")
        .single();

      if (resumeErr) throw resumeErr;

      return {
        resumeId: savedResume.id,
        jobId: jobIdToLink,
        tailoredResume: tailoredContent,
      };
    },
    onSuccess: async ({ resumeId, jobId, tailoredResume }) => {
      await qc.invalidateQueries({ queryKey: ["resumes"] });
      toast.success("Resume tailored and saved!");
      handleClose(false);

      if (onLoaded) {
        onLoaded(tailoredResume, resumeId);
      } else {
        void navigate({
          to: "/studio",
          search: {
            resumeId,
            jobId: jobId ?? undefined,
          },
        });
      }
    },
    onError: (err: unknown) => {
      setStep("tailor");
      const msg = err instanceof Error ? err.message : "Tailoring failed";
      toast.error(msg);
    },
  });

  // Step 2B: Skip tailoring and save base resume
  const saveAsBaseMut = useMutation({
    mutationFn: async () => {
      if (!user || !parsedResume) throw new Error("No resume parsed");
      setStep("processing");
      setProcessingStatus("Saving your resume...");

      const resumeTitle = parsedResume.contact.name
        ? `${parsedResume.contact.name}'s Resume`
        : "Imported Resume";

      const { data, error } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          title: resumeTitle,
          content: parsedResume as unknown as Json,
          template_id: "minimal",
        })
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: async (resumeId) => {
      await qc.invalidateQueries({ queryKey: ["resumes"] });
      toast.success("Resume imported successfully!");
      handleClose(false);

      if (onLoaded && parsedResume) {
        onLoaded(parsedResume, resumeId);
      } else {
        void navigate({ to: "/studio", search: { resumeId } });
      }
    },
    onError: (err: unknown) => {
      setStep("tailor");
      const msg = err instanceof Error ? err.message : "Failed to save resume";
      toast.error(msg);
    },
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl overflow-hidden p-0 sm:max-h-[90vh]">
        {/* Header */}
        <DialogHeader className="border-b border-border bg-card p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                {step === "upload" && <Upload className="size-5" />}
                {step === "tailor" && <Sparkles className="size-5" />}
                {step === "processing" && <Loader2 className="size-5 animate-spin" />}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  {step === "upload" && "Upload Previous Resume"}
                  {step === "tailor" && "Tailor to Target Job Description"}
                  {step === "processing" && "Processing with AI"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {step === "upload" && "Upload your existing PDF, Word, or text resume to parse and adapt."}
                  {step === "tailor" && "Tailor keywords, highlights, and ATS structure for a specific job."}
                  {step === "processing" && processingStatus}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {/* ── STEP 1: UPLOAD ── */}
          {step === "upload" && (
            <div className="space-y-4">
              <Tabs
                value={uploadMethod}
                onValueChange={(v) => setUploadMethod(v as "file" | "paste")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file" className="text-xs">
                    <FileType className="mr-1.5 size-3.5" />
                    Upload File (.pdf, .docx, .txt)
                  </TabsTrigger>
                  <TabsTrigger value="paste" className="text-xs">
                    <FileCode className="mr-1.5 size-3.5" />
                    Paste Resume Text
                  </TabsTrigger>
                </TabsList>

                {/* File Upload Tab */}
                <TabsContent value="file" className="mt-4 space-y-4">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card/60 p-8 text-center transition-all hover:border-primary hover:bg-primary/5",
                      file && "border-primary bg-primary/5",
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc,.txt,.md"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />

                    <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary shadow-sm">
                      <Upload className="size-6" />
                    </div>

                    <div>
                      <p className="font-semibold text-foreground">
                        {file ? file.name : "Click to browse or drag & drop resume file"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Supports PDF (.pdf), Microsoft Word (.docx, .doc), and Plain Text (.txt)
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[11px]">PDF</Badge>
                      <Badge variant="outline" className="text-[11px]">DOCX</Badge>
                      <Badge variant="outline" className="text-[11px]">TXT</Badge>
                    </div>
                  </div>
                </TabsContent>

                {/* Paste Text Tab */}
                <TabsContent value="paste" className="mt-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="paste-resume-text" className="text-xs font-semibold">
                      Resume Text
                    </Label>
                    <Textarea
                      id="paste-resume-text"
                      placeholder="Paste your full resume text here (experience, education, skills, contact info)..."
                      rows={9}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      className="font-mono text-xs leading-relaxed"
                    />
                  </div>
                  <Button
                    onClick={handlePasteSubmit}
                    disabled={rawText.trim().length < 20}
                    className="w-full"
                  >
                    <Sparkles className="mr-2 size-4" />
                    Parse Resume with AI
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* ── STEP 2: TAILOR RESUME ── */}
          {step === "tailor" && parsedResume && (
            <div className="space-y-5">
              {/* Parsed Summary Card */}
              <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-foreground">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                    Resume Parsed: {parsedResume.contact.name || "Candidate"}
                    {parsedResume.contact.title ? ` (${parsedResume.contact.title})` : ""}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    Extracted {parsedResume.experience.length} experience item{parsedResume.experience.length !== 1 ? "s" : ""},{" "}
                    {parsedResume.skills.reduce((acc, s) => acc + s.items.length, 0)} skills, and{" "}
                    {parsedResume.education.length} education item{parsedResume.education.length !== 1 ? "s" : ""}.
                  </p>
                </div>
              </div>

              {/* Tailor Question & Options */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-foreground">
                    Target Job Description (Optional)
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    AI will adapt keywords & phrasing
                  </span>
                </div>

                <Tabs
                  value={jobOption}
                  onValueChange={(v) => setJobOption(v as "custom" | "saved")}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="custom" className="text-xs">
                      Paste Job Posting
                    </TabsTrigger>
                    <TabsTrigger
                      value="saved"
                      disabled={savedJobs.length === 0}
                      className="text-xs"
                    >
                      Pick Saved Job ({savedJobs.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* Custom Job Posting Tab */}
                  <TabsContent value="custom" className="mt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="tailor-title" className="text-xs">
                          Job Title
                        </Label>
                        <Input
                          id="tailor-title"
                          placeholder="e.g. Senior Frontend Engineer"
                          value={targetTitle}
                          onChange={(e) => setTargetTitle(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="tailor-company" className="text-xs">
                          Company
                        </Label>
                        <Input
                          id="tailor-company"
                          placeholder="e.g. Stripe, Google, Acme Inc"
                          value={targetCompany}
                          onChange={(e) => setTargetCompany(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="tailor-desc" className="text-xs">
                        Full Job Description
                      </Label>
                      <Textarea
                        id="tailor-desc"
                        placeholder="Paste the job description, required qualifications, technical stack, responsibilities..."
                        rows={5}
                        value={targetDescription}
                        onChange={(e) => setTargetDescription(e.target.value)}
                        className="text-xs leading-relaxed"
                      />
                    </div>
                  </TabsContent>

                  {/* Saved Jobs Tab */}
                  <TabsContent value="saved" className="mt-3 space-y-2">
                    <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                      {savedJobs.map((job) => {
                        const isSelected = selectedSavedJobId === job.id;
                        return (
                          <div
                            key={job.id}
                            onClick={() => setSelectedSavedJobId(job.id)}
                            className={cn(
                              "flex cursor-pointer items-start justify-between rounded-lg border p-3 text-xs transition-colors",
                              isSelected
                                ? "border-primary bg-primary/5 text-foreground"
                                : "border-border bg-card hover:border-primary/50 text-muted-foreground",
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-foreground">{job.title}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {job.company} · {job.location || "Remote"}
                              </p>
                            </div>
                            {isSelected && (
                              <Badge variant="default" className="ml-2 text-[10px]">
                                Selected
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => saveAsBaseMut.mutate()}
                  disabled={saveAsBaseMut.isPending || tailorAndSaveMut.isPending}
                  className="order-2 text-xs sm:order-1"
                >
                  <FileText className="mr-1.5 size-3.5" />
                  Skip & Save as Base Resume
                </Button>

                <Button
                  onClick={() => tailorAndSaveMut.mutate()}
                  disabled={
                    tailorAndSaveMut.isPending ||
                    saveAsBaseMut.isPending ||
                    (jobOption === "custom" && !targetDescription.trim()) ||
                    (jobOption === "saved" && !selectedSavedJobId)
                  }
                  className="order-1 text-xs sm:order-2"
                >
                  <Sparkles className="mr-1.5 size-3.5" />
                  Tailor Resume & Open Studio
                  <ArrowRight className="ml-1.5 size-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3: PROCESSING WITH AI ── */}
          {step === "processing" && (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="relative">
                <div className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="size-8 animate-pulse text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-card shadow">
                  <Loader2 className="size-4 animate-spin text-primary" />
                </div>
              </div>

              <div>
                <p className="font-display font-semibold text-foreground">
                  AI is working...
                </p>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  {processingStatus || "Analyzing your document and formatting standard ATS structure."}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                Preserving all factual experience without hallucinating facts
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
