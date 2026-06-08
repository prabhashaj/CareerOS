import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3 } from "lucide-react";
import { listApplications } from "@/lib/applications.functions";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — CareerOS" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const fn = useServerFn(listApplications);
  const { data, isLoading } = useQuery({ queryKey: ["applications"], queryFn: () => fn() });

  const stats = (() => {
    const apps = data ?? [];
    const total = apps.length;
    const by: Record<string, number> = {};
    let scoreSum = 0, scored = 0;
    apps.forEach((a) => {
      by[a.status] = (by[a.status] ?? 0) + 1;
      if (a.match_score != null) { scoreSum += Number(a.match_score); scored++; }
    });
    const submitted = (by.submitted ?? 0) + (by.interview ?? 0) + (by.offer ?? 0);
    const interviews = (by.interview ?? 0) + (by.offer ?? 0);
    return {
      total,
      avgScore: scored ? Math.round((scoreSum / scored) * 100) : null,
      submitted,
      interviewRate: submitted ? Math.round((interviews / submitted) * 100) : 0,
      by,
    };
  })();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Funnel and quality of your applications.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Stat label="Total applications" value={String(stats.total)} />
            <Stat label="Submitted" value={String(stats.submitted)} />
            <Stat label="Interview rate" value={`${stats.interviewRate}%`} />
            <Stat label="Avg match score" value={stats.avgScore == null ? "—" : `${stats.avgScore}%`} />
          </div>

          <div className="mt-8 rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-medium">Pipeline breakdown</h2>
            </div>
            <div className="space-y-3">
              {Object.entries(stats.by).map(([status, count]) => {
                const pct = stats.total ? (count / stats.total) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="capitalize">{status.replace("_", " ")}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {Object.keys(stats.by).length === 0 && (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </div>
  );
}
