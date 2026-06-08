import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ClipboardCheck,
  Bot,
  CheckCircle2,
  X,
  Bookmark,
  PenLine,
  Send,
  Rocket,
  CalendarCheck2,
  Trophy,
  XCircle,
  Building2,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { listApplications } from "@/lib/applications.functions";
import {
  draftAutomationPlan,
  confirmSubmission,
  cancelAutomation,
} from "@/lib/automation.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({ meta: [{ title: "Applications — CareerOS" }] }),
  component: ApplicationsPage,
});

type StatusKey =
  | "saved"
  | "drafting"
  | "ready_to_apply"
  | "submitted"
  | "interview"
  | "offer"
  | "rejected";

const STATUS_META: Record<
  StatusKey,
  { label: string; icon: typeof Bookmark; tone: string; description: string }
> = {
  saved: {
    label: "Saved",
    icon: Bookmark,
    tone: "text-muted-foreground",
    description: "Opportunities you've bookmarked.",
  },
  drafting: {
    label: "Drafting",
    icon: PenLine,
    tone: "text-accent-foreground",
    description: "Plans in progress — review before sending.",
  },
  ready_to_apply: {
    label: "Ready to apply",
    icon: Rocket,
    tone: "text-primary",
    description: "Polished and waiting on your green light.",
  },
  submitted: {
    label: "Submitted",
    icon: Send,
    tone: "text-primary",
    description: "Out the door. Waiting on a response.",
  },
  interview: {
    label: "Interview",
    icon: CalendarCheck2,
    tone: "text-success",
    description: "Conversations underway.",
  },
  offer: {
    label: "Offer",
    icon: Trophy,
    tone: "text-success",
    description: "The good stuff.",
  },
  rejected: {
    label: "Closed",
    icon: XCircle,
    tone: "text-muted-foreground",
    description: "Archived for the record.",
  },
};

const STATUS_ORDER: StatusKey[] = [
  "saved",
  "drafting",
  "ready_to_apply",
  "submitted",
  "interview",
  "offer",
  "rejected",
];

type AppRow = NonNullable<Awaited<ReturnType<typeof listApplications>>>[number];

function ApplicationsPage() {
  const qc = useQueryClient();
  const fn = useServerFn(listApplications);
  const draftFn = useServerFn(draftAutomationPlan);
  const cancelFn = useServerFn(cancelAutomation);
  const { data, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: () => fn(),
  });

  const [confirmTarget, setConfirmTarget] = useState<AppRow | null>(null);
  const [activeFilter, setActiveFilter] = useState<StatusKey | "all">("all");

  const drafting = useMutation({
    mutationFn: (application_id: string) =>
      draftFn({ data: { application_id } }),
    onSuccess: (res) => {
      toast.success(
        `Plan ready: ${res.plan.steps.length} steps. Review and approve.`,
      );
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["review-queue"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelling = useMutation({
    mutationFn: (application_id: string) =>
      cancelFn({ data: { application_id } }),
    onSuccess: () => {
      toast.success("Automation cancelled");
      qc.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const grouped = useMemo(() => {
    const m = new Map<StatusKey, AppRow[]>();
    STATUS_ORDER.forEach((s) => m.set(s, []));
    (data ?? []).forEach((a) => {
      const key = (a.status as StatusKey) ?? "saved";
      const list = m.get(key) ?? [];
      list.push(a);
      m.set(key, list);
    });
    return m;
  }, [data]);

  const total = data?.length ?? 0;
  const active =
    (grouped.get("drafting")?.length ?? 0) +
    (grouped.get("ready_to_apply")?.length ?? 0) +
    (grouped.get("submitted")?.length ?? 0) +
    (grouped.get("interview")?.length ?? 0);
  const wins = grouped.get("offer")?.length ?? 0;
  const responseRate =
    total > 0
      ? Math.round(
          (((grouped.get("interview")?.length ?? 0) +
            (grouped.get("offer")?.length ?? 0)) /
            total) *
            100,
        )
      : 0;

  const visibleSections =
    activeFilter === "all"
      ? STATUS_ORDER
      : STATUS_ORDER.filter((s) => s === activeFilter);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-accent" />
              Pipeline
            </div>
            <h1 className="font-display text-4xl tracking-tight">
              Applications
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Every opportunity, from bookmark to offer. Draft browser-assisted
              submissions and approve each step before anything goes out.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={total} />
          <StatCard label="In flight" value={active} accent />
          <StatCard label="Offers" value={wins} tone="success" />
          <StatCard label="Response rate" value={`${responseRate}%`} />
        </div>
      </header>

      {/* Filter pills */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <FilterPill
          label="All"
          count={total}
          active={activeFilter === "all"}
          onClick={() => setActiveFilter("all")}
        />
        {STATUS_ORDER.map((s) => {
          const count = grouped.get(s)?.length ?? 0;
          if (count === 0) return null;
          return (
            <FilterPill
              key={s}
              label={STATUS_META[s].label}
              count={count}
              active={activeFilter === s}
              onClick={() => setActiveFilter(s)}
            />
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-border bg-card"
            />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <ClipboardCheck className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-display text-xl">No applications yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Rank a job and draft an application to start tracking it here.
          </p>
          <Link to="/jobs">
            <Button className="mt-5" size="sm">
              Browse jobs
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {visibleSections.map((s) => {
            const items = grouped.get(s) ?? [];
            if (items.length === 0) return null;
            const meta = STATUS_META[s];
            const Icon = meta.icon;
            return (
              <section key={s}>
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg bg-secondary",
                      meta.tone,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-lg leading-none">
                        {meta.label}
                      </h2>
                      <Badge variant="secondary" className="text-xs">
                        {items.length}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {meta.description}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((a) => (
                    <ApplicationCard
                      key={a.id}
                      app={a}
                      status={s}
                      onDraft={() => drafting.mutate(a.id)}
                      onCancel={() => cancelling.mutate(a.id)}
                      onConfirm={() => setConfirmTarget(a)}
                      draftPending={drafting.isPending}
                      cancelPending={cancelling.isPending}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <ConfirmSubmissionDialog
        application={confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onDone={() => {
          qc.invalidateQueries({ queryKey: ["applications"] });
          setConfirmTarget(null);
        }}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  tone,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
  tone?: "success";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 transition-colors",
        accent && "border-accent/40 bg-accent/5",
      )}
    >
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-display text-2xl",
          tone === "success" && "text-success",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary",
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 text-[10px]",
          active
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function ApplicationCard({
  app,
  status,
  onDraft,
  onCancel,
  onConfirm,
  draftPending,
  cancelPending,
}: {
  app: AppRow;
  status: StatusKey;
  onDraft: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  draftPending: boolean;
  cancelPending: boolean;
}) {
  const match =
    app.match_score != null ? Math.round(Number(app.match_score) * 100) : null;
  const matchTone =
    match == null
      ? "text-muted-foreground"
      : match >= 80
        ? "text-success"
        : match >= 60
          ? "text-accent-foreground"
          : "text-muted-foreground";

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-sm">
      {/* accent bar */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity group-hover:opacity-100",
          status === "offer" || status === "interview"
            ? "bg-success"
            : status === "rejected"
              ? "bg-muted-foreground/30"
              : "bg-primary",
        )}
      />

      <div className="p-4">
        <Link
          to="/jobs/$jobId"
          params={{ jobId: app.job_id }}
          className="block"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">
                {app.job?.title ?? "Untitled role"}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="line-clamp-1">
                  {app.job?.company ?? "Unknown company"}
                </span>
              </div>
            </div>
            {match != null && (
              <div
                className={cn(
                  "shrink-0 rounded-lg border border-border bg-background px-2 py-1 text-center",
                  matchTone,
                )}
              >
                <div className="font-display text-sm leading-none">
                  {match}
                </div>
                <div className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                  match
                </div>
              </div>
            )}
          </div>
        </Link>

        {(status === "saved" ||
          status === "ready_to_apply" ||
          status === "drafting") && (
          <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3">
            {(status === "saved" || status === "ready_to_apply") && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 flex-1 text-xs"
                disabled={draftPending}
                onClick={onDraft}
              >
                <Bot className="mr-1 h-3 w-3" />
                Draft plan
              </Button>
            )}
            {status === "drafting" && (
              <>
                <Button
                  size="sm"
                  className="h-7 flex-1 text-xs"
                  onClick={onConfirm}
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Mark submitted
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={onCancel}
                  disabled={cancelPending}
                  aria-label="Cancel automation"
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ConfirmSubmissionDialog({
  application,
  onClose,
  onDone,
}: {
  application: AppRow | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const confirmFn = useServerFn(confirmSubmission);
  const [ref, setRef] = useState("");
  const [notes, setNotes] = useState("");

  const submit = useMutation({
    mutationFn: () =>
      confirmFn({
        data: {
          application_id: application!.id,
          external_reference: ref || undefined,
          notes: notes || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Marked as submitted");
      setRef("");
      setNotes("");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={!!application} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm submission</DialogTitle>
          <DialogDescription>
            Confirm that the application for {application?.job?.title} at{" "}
            {application?.job?.company} was submitted. This logs the event and
            moves it to the Submitted column.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ref">External reference (optional)</Label>
            <Input
              id="ref"
              placeholder="e.g. Greenhouse application ID"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Recruiter contact, follow-up date…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
            {submit.isPending ? "Saving…" : "Confirm submitted"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
