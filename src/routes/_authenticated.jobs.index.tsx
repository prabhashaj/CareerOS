import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  Plus,
  Sparkles,
  FileText,
  Mail,
  Mic,
  Trash2,
  ExternalLink,
  ChevronRight,
  Loader2,
  Building2,
  MapPin,
  Globe,
  CheckCircle2,
  Copy,
  Zap,
} from "lucide-react";
import { listJobs, createJob, deleteJob, ingestJobFromUrl } from "@/lib/jobs.functions";
import { rankJob, rankAllJobs } from "@/lib/ranking.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/jobs/")({
  head: () => ({ meta: [{ title: "Target Roles & JDs — CareerOS" }] }),
  component: TargetJobsPage,
});

function TargetJobsPage() {
  const qc = useQueryClient();
  const listJobsFn = useServerFn(listJobs);
  const createJobFn = useServerFn(createJob);
  const deleteJobFn = useServerFn(deleteJob);
  const ingestJobFn = useServerFn(ingestJobFromUrl);
  const rankJobFn = useServerFn(rankJob);
  const rankAllFn = useServerFn(rankAllJobs);

  const [searchQuery, setSearchQuery] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<"paste" | "url">("paste");

  // New Job Form State
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScoringAll, setIsScoringAll] = useState(false);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => listJobsFn(),
  });

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading("Saving target job description...");
    try {
      if (addMode === "url" && sourceUrl.trim()) {
        await ingestJobFn({ data: { url: sourceUrl.trim() } });
      } else {
        if (!title.trim() || !company.trim()) {
          toast.error("Please provide both a job title and company name.", { id: toastId });
          setIsSubmitting(false);
          return;
        }
        await createJobFn({
          data: {
            title: title.trim(),
            company: company.trim(),
            location: location.trim() || undefined,
            description: description.trim() || undefined,
            source_url: sourceUrl.trim() || undefined,
          },
        });
      }

      toast.success("Target job added successfully!", { id: toastId });
      setAddModalOpen(false);
      setTitle("");
      setCompany("");
      setLocation("");
      setDescription("");
      setSourceUrl("");
      void qc.invalidateQueries({ queryKey: ["jobs"] });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to add job", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return;
    try {
      await deleteJobFn({ data: { id } });
      toast.success("Target job removed");
      void qc.invalidateQueries({ queryKey: ["jobs"] });
    } catch {
      toast.error("Failed to remove job");
    }
  };

  const handleScoreAll = async () => {
    setIsScoringAll(true);
    const toastId = toast.loading("Calculating ATS match scores across all roles...");
    try {
      const res = await rankAllFn();
      toast.success(`Scored ${res.scored} target roles against your resume!`, { id: toastId });
      void qc.invalidateQueries({ queryKey: ["jobs"] });
      void qc.invalidateQueries({ queryKey: ["applications"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scoring failed", { id: toastId });
    } finally {
      setIsScoringAll(false);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    const q = searchQuery.toLowerCase();
    return j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || (j.location ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="mx-auto max-w-7xl p-6 sm:p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Briefcase className="size-3.5 text-primary" /> Target Roles & JDs
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Target Job Descriptions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Attach job descriptions to tailor resumes, craft bespoke cover letters, and run mock interview drills.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {jobs.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleScoreAll}
              disabled={isScoringAll}
              className="h-9 font-semibold text-xs gap-1.5 rounded-xl"
            >
              {isScoringAll ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5 text-primary" />}
              <span>Score All Matches</span>
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="h-9 font-bold text-xs gap-1.5 rounded-xl shadow-sm"
          >
            <Plus className="size-4" />
            <span>Add Target Job</span>
          </Button>
        </div>
      </div>

      {/* Search Filter */}
      {jobs.length > 0 && (
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search target roles by title, company, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md h-9 text-xs rounded-xl bg-card"
          />
          <span className="text-xs text-muted-foreground font-medium">
            Showing {filteredJobs.length} of {jobs.length} target roles
          </span>
        </div>
      )}

      {/* Grid of Jobs */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/40 p-12 text-center space-y-4">
          <div className="mx-auto grid size-14 place-items-center rounded-3xl bg-primary/10 text-primary">
            <Briefcase className="size-7" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-display text-lg font-bold">No Target Roles Yet</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Add the job description of any role you're applying for to instantly generate tailored resumes, cover letters, and interview coaching.
            </p>
          </div>
          <Button onClick={() => setAddModalOpen(true)} className="font-semibold text-xs rounded-xl">
            <Plus className="size-4 mr-1.5" /> Add Your First Target Job
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((j) => (
            <div
              key={j.id}
              className="group rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <Link
                      to="/jobs/$jobId"
                      params={{ jobId: j.id }}
                      className="font-display text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1"
                    >
                      {j.title}
                    </Link>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="size-3.5 shrink-0" />
                      <span className="font-medium truncate">{j.company}</span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteJob(j.id, `${j.title} at ${j.company}`)}
                    className="size-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                    title="Remove job"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                  {j.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" /> {j.location}
                    </span>
                  )}
                  {j.remote && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Remote
                    </Badge>
                  )}
                  {j.employment_type && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                      {j.employment_type.replace("_", " ")}
                    </Badge>
                  )}
                </div>
              </div>

              {/* 3 Pillars Action Toolbar */}
              <div className="mt-5 pt-3.5 border-t border-border/70 space-y-2">
                <div className="grid grid-cols-3 gap-1.5">
                  <Link
                    to="/studio"
                    search={{ jobId: j.id }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-secondary/40 hover:bg-primary hover:text-primary-foreground border border-border/60 hover:border-primary transition-all text-center group/btn"
                    title="Tailor Resume for this role"
                  >
                    <FileText className="size-4 mb-0.5 text-primary group-hover/btn:text-primary-foreground transition-colors" />
                    <span className="text-[10px] font-bold">Resume</span>
                  </Link>

                  <Link
                    to="/cover-letter"
                    search={{ jobId: j.id }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-secondary/40 hover:bg-primary hover:text-primary-foreground border border-border/60 hover:border-primary transition-all text-center group/btn"
                    title="Generate Cover Letter for this role"
                  >
                    <Mail className="size-4 mb-0.5 text-primary group-hover/btn:text-primary-foreground transition-colors" />
                    <span className="text-[10px] font-bold">Letter</span>
                  </Link>

                  <Link
                    to="/interview"
                    search={{ jobId: j.id }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-secondary/40 hover:bg-primary hover:text-primary-foreground border border-border/60 hover:border-primary transition-all text-center group/btn"
                    title="Prepare for Interview for this role"
                  >
                    <Mic className="size-4 mb-0.5 text-primary group-hover/btn:text-primary-foreground transition-colors" />
                    <span className="text-[10px] font-bold">Interview</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Target Job Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">
              Add Target Job Description
            </DialogTitle>
            <DialogDescription className="text-xs">
              Paste the job details to unlock instant AI resume tailoring, cover letter generation, and interview coaching.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddJob} className="space-y-4 pt-2">
            <div className="flex items-center rounded-xl bg-secondary p-1 border border-border/60">
              <button
                type="button"
                onClick={() => setAddMode("paste")}
                className={cn(
                  "flex-1 py-1 text-xs font-semibold rounded-lg transition-all",
                  addMode === "paste"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Paste Description
              </button>
              <button
                type="button"
                onClick={() => setAddMode("url")}
                className={cn(
                  "flex-1 py-1 text-xs font-semibold rounded-lg transition-all",
                  addMode === "url"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Import from URL
              </button>
            </div>

            {addMode === "url" ? (
              <div className="space-y-2">
                <Label htmlFor="add-url" className="text-xs font-semibold text-muted-foreground">
                  Job Posting URL (Greenhouse, Lever, LinkedIn, etc.)
                </Label>
                <Input
                  id="add-url"
                  type="url"
                  placeholder="https://boards.greenhouse.io/company/jobs/12345"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="text-xs rounded-xl"
                  required
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="add-title" className="text-xs font-semibold text-muted-foreground">
                      Job Title *
                    </Label>
                    <Input
                      id="add-title"
                      placeholder="e.g. Senior Backend Engineer"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="text-xs rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="add-company" className="text-xs font-semibold text-muted-foreground">
                      Company Name *
                    </Label>
                    <Input
                      id="add-company"
                      placeholder="e.g. Stripe"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="text-xs rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="add-loc" className="text-xs font-semibold text-muted-foreground">
                    Location (optional)
                  </Label>
                  <Input
                    id="add-loc"
                    placeholder="e.g. San Francisco, CA / Remote"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="add-desc" className="text-xs font-semibold text-muted-foreground">
                    Job Description Text & Requirements
                  </Label>
                  <Textarea
                    id="add-desc"
                    rows={5}
                    placeholder="Paste the full job posting requirements and details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="text-xs resize-none rounded-xl leading-relaxed bg-secondary/30"
                  />
                </div>
              </>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="font-bold text-xs rounded-xl">
                {isSubmitting ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Plus className="size-3.5 mr-1.5" />}
                <span>Save Target Job</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
