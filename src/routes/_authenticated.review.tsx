import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  ShieldCheck,
  ShieldX,
  Inbox,
  ChevronDown,
  ExternalLink,
  Puzzle,
  MapPin,
  Briefcase,
  Send,
} from "lucide-react";
import { useState } from "react";
import { listReviewQueue, decideReview } from "@/lib/applications.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/review")({
  head: () => ({ meta: [{ title: "Review queue — CareerOS" }] }),
  component: ReviewPage,
});

type Step = {
  action: string;
  selector: string;
  field_label?: string;
  value?: string;
  note?: string;
};

type FillResult = {
  sessionId?: string | null;
  liveViewUrl: string | null;
  directApplyUrl?: string | null;
  draftUrl?: string | null;
  filled: number;
  total: number;
  uploaded?: number;
  manualUploads?: number;
  error?: string | null;
};

function ReviewPage() {
  const qc = useQueryClient();
  const fn = useServerFn(listReviewQueue);
  const decide = useServerFn(decideReview);
  const { data, isLoading } = useQuery({ queryKey: ["review_queue"], queryFn: () => fn() });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [filled] = useState<Record<string, FillResult>>({});

  const openWithExtension = (sourceUrl?: string) => {
    if (!sourceUrl) {
      toast.error("No application URL on this job.");
      return;
    }
    window.open(sourceUrl, "_blank", "noopener,noreferrer");
    toast.success("Opened application — click the CareerOS extension icon to auto-fill.");
  };

  const decideAndAutofill = async (
    rowId: string,
    decision: "approved" | "rejected",
    _applicationId: string | null,
    sourceUrl?: string,
  ) => {
    setBusy(rowId);
    try {
      await decide({ data: { id: rowId, decision } });
      qc.invalidateQueries({ queryKey: ["review_queue"] });
      if (decision === "rejected") {
        toast.success("Rejected");
        return;
      }
      toast.success("Approved — opening the application page for the extension to fill.");
      openWithExtension(sourceUrl);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };


  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Review queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Human-in-the-loop checkpoints before any sensitive AI action.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data || data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Nothing to review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((r) => {
            const payload = (r.payload ?? {}) as {
              steps?: Step[];
              warnings?: string[];
              source_url?: string;
              detected_ats?: string;
            };
            const steps = payload.steps ?? [];
            const isOpen = expanded[r.id] ?? false;
            const job = (r as { job?: { title: string; company: string; location: string | null; remote: boolean | null; source_url: string | null } | null }).job ?? null;
            const application = (r as { application?: { id: string; status: string; match_score: number | null; answers?: { draft_url?: string } | null } | null }).application ?? null;
            const sourceUrl = payload.source_url ?? job?.source_url ?? undefined;
            const fillRes = filled[r.id];
            const draftUrl = fillRes?.draftUrl ?? application?.answers?.draft_url ?? null;
            const applyHref = draftUrl ?? sourceUrl;
            const isBusy = busy === r.id;

            return (
              <div key={r.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{r.title}</h3>
                      <Badge
                        variant={
                          r.status === "pending"
                            ? "secondary"
                            : r.status === "approved"
                              ? "default"
                              : "outline"
                        }
                      >
                        {r.status}
                      </Badge>
                      <Badge variant="outline">{r.action_type}</Badge>
                      {payload.detected_ats && (
                        <Badge variant="outline">{payload.detected_ats}</Badge>
                      )}
                      {application?.status && (
                        <Badge variant="secondary">app: {application.status}</Badge>
                      )}
                    </div>

                    {job && (
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" />
                          {job.company} · {job.title}
                        </span>
                        {(job.location || job.remote) && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {job.location ?? "—"}{job.remote ? " · Remote" : ""}
                          </span>
                        )}
                        {application && (
                          <Link
                            to="/jobs/$jobId"
                            params={{ jobId: (application as { job_id?: string }).job_id ?? "" }}
                            className="text-primary hover:underline"
                          >
                            Open job →
                          </Link>
                        )}
                      </div>
                    )}

                    {r.summary && (
                      <div className="mt-1 text-sm text-muted-foreground">
                        <ReactMarkdown>{r.summary}</ReactMarkdown>
                      </div>
                    )}
                    {sourceUrl && (
                      <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Application page
                      </a>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap justify-end gap-2">
                    {r.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => decideAndAutofill(r.id, "rejected", application?.id ?? null, sourceUrl)}
                        >
                          <ShieldX className="mr-1 h-4 w-4" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          disabled={isBusy}
                          onClick={() => decideAndAutofill(r.id, "approved", application?.id ?? null, sourceUrl)}
                        >
                          <ShieldCheck className="mr-1 h-4 w-4" />
                          {isBusy ? "Working…" : "Approve & auto-apply"}
                        </Button>
                      </>
                    )}
                    {r.status !== "pending" && sourceUrl && (
                      <Button
                        size="sm"
                        disabled={isBusy}
                        onClick={() => openWithExtension(sourceUrl)}
                      >
                        <Puzzle className="mr-1 h-4 w-4" />
                        Open & auto-fill
                      </Button>
                    )}
                    {applyHref && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={applyHref} target="_blank" rel="noreferrer">
                          <Send className="mr-1 h-4 w-4" />
                          {draftUrl ? "Open saved draft" : "Apply"}
                        </a>
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" asChild>
                      <Link to="/extension">
                        <Puzzle className="mr-1 h-4 w-4" />
                        Get extension
                      </Link>
                    </Button>

                  </div>
                </div>

                {fillRes && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/30 p-2 text-xs">
                    <span>Filled {fillRes.filled}/{fillRes.total} fields.</span>
                    {(fillRes.uploaded ?? 0) > 0 && <span>Uploaded resume.</span>}
                    {(fillRes.manualUploads ?? 0) > 0 && <span>Resume upload still needs review.</span>}
                    {fillRes.error && <span className="text-muted-foreground">Live fill issue: {fillRes.error}</span>}
                    {fillRes.liveViewUrl && (
                      <a
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        href={fillRes.liveViewUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open live browser <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {fillRes.directApplyUrl && (
                      <a
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        href={fillRes.directApplyUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Start fresh <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}

                {payload.warnings && payload.warnings.length > 0 && (
                  <ul className="mt-3 space-y-1 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                    {payload.warnings.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                )}

                {steps.length > 0 && (
                  <div className="mt-4">
                    <button
                      onClick={() => setExpanded((m) => ({ ...m, [r.id]: !isOpen }))}
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                      {steps.length} submission step{steps.length === 1 ? "" : "s"}
                    </button>
                    {isOpen && (
                      <ol className="mt-3 space-y-2">
                        {steps.map((s, i) => (
                          <li
                            key={i}
                            className="rounded-md border border-border bg-background p-3 text-xs"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary" className="font-mono">
                                {i + 1}. {s.action}
                              </Badge>
                              {s.field_label && (
                                <span className="font-medium">{s.field_label}</span>
                              )}
                            </div>
                            <div className="mt-2 font-mono text-[11px] text-muted-foreground break-all">
                              {s.selector}
                            </div>
                            {s.value && (
                              <div className="mt-2 line-clamp-3 whitespace-pre-wrap text-foreground/80">
                                {s.value}
                              </div>
                            )}
                            {s.note && (
                              <div className="mt-2 text-amber-600 dark:text-amber-400">
                                {s.note}
                              </div>
                            )}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
