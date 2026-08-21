import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ClipboardCheck,
  CheckCircle2,
  Bookmark,
  Send,
  CalendarCheck2,
  Trophy,
  XCircle,
  Building2,
  Sparkles,
  ChevronRight,
  FileText,
  Mail,
  Mic,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { listApplications, updateApplicationStatus, type ApplicationStatus } from "@/lib/applications.functions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({ meta: [{ title: "Applications Pipeline — CareerOS" }] }),
  component: ApplicationsPage,
});

type StatusKey =
  | "saved"
  | "submitted"
  | "interview"
  | "offer"
  | "rejected";

const STATUS_META: Record<
  StatusKey,
  { label: string; icon: typeof Bookmark; tone: string; description: string }
> = {
  saved: {
    label: "Saved / Preparing",
    icon: Bookmark,
    tone: "text-muted-foreground",
    description: "Opportunities you're tailoring assets for.",
  },
  submitted: {
    label: "Submitted",
    icon: Send,
    tone: "text-primary",
    description: "Applied with tailored resume & cover letter.",
  },
  interview: {
    label: "Interview",
    icon: CalendarCheck2,
    tone: "text-success",
    description: "Conversations & rounds underway.",
  },
  offer: {
    label: "Offer",
    icon: Trophy,
    tone: "text-success",
    description: "Offers received and in negotiation.",
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
  "submitted",
  "interview",
  "offer",
  "rejected",
];

type AppRow = NonNullable<Awaited<ReturnType<typeof listApplications>>>[number];

function ApplicationsPage() {
  const qc = useQueryClient();
  const fn = useServerFn(listApplications);
  const updateStatusFn = useServerFn(updateApplicationStatus);

  const { data, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: () => fn(),
  });

  const [activeFilter, setActiveFilter] = useState<StatusKey | "all">("all");

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      updateStatusFn({ data: { id, status } }),
    onSuccess: () => {
      toast.success("Application status updated");
      void qc.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const grouped = useMemo(() => {
    const m = new Map<StatusKey, AppRow[]>();
    STATUS_ORDER.forEach((s) => m.set(s, []));
    (data ?? []).forEach((a) => {
      const rawStatus = (a.status || "saved") as string;
      const key: StatusKey = STATUS_ORDER.includes(rawStatus as StatusKey)
        ? (rawStatus as StatusKey)
        : "saved";
      const list = m.get(key) ?? [];
      list.push(a);
      m.set(key, list);
    });
    return m;
  }, [data]);

  const total = data?.length ?? 0;
  const active =
    (grouped.get("saved")?.length ?? 0) +
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
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-10 space-y-8">
      {/* Header */}
      <header>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <ClipboardCheck className="h-3 w-3 text-primary" />
              Pipeline
            </div>
            <h1 className="font-display text-4xl tracking-tight font-bold">
              Applications Tracker
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Track progress from initial JD tailoring to interview rounds and offers.
            </p>
          </div>

          <Link to="/jobs">
            <Button size="sm" className="font-bold text-xs gap-1.5 rounded-xl">
              <Plus className="size-4" /> Add Target Role
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Tracked" value={total} />
          <StatCard label="Active Pipeline" value={active} accent />
          <StatCard label="Offers" value={wins} tone="success" />
          <StatCard label="Interview Rate" value={`${responseRate}%`} />
        </div>
      </header>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
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
        <div className="rounded-3xl border border-dashed border-border bg-card/40 p-16 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <ClipboardCheck className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-display text-xl font-bold">No applications tracked yet</h3>
            <p className="text-sm text-muted-foreground">
              Add a target role and start tailoring your resume or cover letter to track it here.
            </p>
          </div>
          <Link to="/jobs">
            <Button size="sm" className="font-semibold text-xs rounded-xl">
              Add Target Role
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
                      "flex h-8 w-8 items-center justify-center rounded-lg bg-secondary",
                      meta.tone,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-lg font-bold leading-none">
                        {meta.label}
                      </h2>
                      <Badge variant="secondary" className="text-xs">
                        {items.length}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((a) => (
                    <div
                      key={a.id}
                      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-sm space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <Link
                            to="/jobs/$jobId"
                            params={{ jobId: a.job_id }}
                            className="font-display text-sm font-bold leading-snug group-hover:text-primary transition-colors line-clamp-1"
                          >
                            {a.job?.title ?? "Untitled role"}
                          </Link>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">{a.job?.company ?? "Unknown company"}</span>
                          </div>
                        </div>

                        {a.match_score != null && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0">
                            {Math.round(Number(a.match_score) * 100)}% match
                          </Badge>
                        )}
                      </div>

                      {/* 3 Pillar Shortcuts */}
                      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-border/60">
                        <Link
                          to="/studio"
                          search={{ jobId: a.job_id }}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-secondary/40 hover:bg-primary hover:text-primary-foreground text-[10px] font-semibold transition-colors"
                        >
                          <FileText className="size-3" /> Resume
                        </Link>
                        <Link
                          to="/cover-letter"
                          search={{ jobId: a.job_id }}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-secondary/40 hover:bg-primary hover:text-primary-foreground text-[10px] font-semibold transition-colors"
                        >
                          <Mail className="size-3" /> Letter
                        </Link>
                        <Link
                          to="/interview"
                          search={{ jobId: a.job_id }}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-secondary/40 hover:bg-primary hover:text-primary-foreground text-[10px] font-semibold transition-colors"
                        >
                          <Mic className="size-3" /> Prep
                        </Link>
                      </div>

                      {/* Status Selector */}
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Status:</span>
                        <Select
                          value={a.status}
                          onValueChange={(val) =>
                            updateStatus.mutate({ id: a.id, status: val as ApplicationStatus })
                          }
                        >
                          <SelectTrigger className="h-7 w-32 text-[10px] font-semibold rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl text-xs">
                            <SelectItem value="saved">Saved</SelectItem>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="interview">Interview</SelectItem>
                            <SelectItem value="offer">Offer</SelectItem>
                            <SelectItem value="rejected">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
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
        "rounded-2xl border border-border bg-card p-4 transition-colors",
        accent && "border-accent/40 bg-accent/5",
      )}
    >
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-display text-2xl font-bold",
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
          ? "border-primary bg-primary text-primary-foreground font-semibold"
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
