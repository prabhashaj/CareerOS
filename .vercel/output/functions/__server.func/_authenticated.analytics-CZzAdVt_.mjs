import { j as jsxRuntimeExports } from "./_libs/react.mjs";
import { a as useQuery } from "./_libs/tanstack__react-query.mjs";
import { u as useServerFn } from "./_ssr/useServerFn-DL2oePlL.mjs";
import { a as listApplications } from "./_ssr/applications.functions-D6FXcIIX.mjs";
import "./_libs/seroval.mjs";
import { g as ChartColumn } from "./_libs/lucide-react.mjs";
import "./_libs/tanstack__query-core.mjs";
import "./_libs/tanstack__react-router.mjs";
import "./_libs/tanstack__router-core.mjs";
import "./_libs/tanstack__history.mjs";
import "./_libs/cookie-es.mjs";
import "./_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "./_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "./_libs/isbot.mjs";
import "./_ssr/createSsrRpc-ZrE_UFSo.mjs";
import "./_ssr/server-BD-sNUlq.mjs";
import "node:async_hooks";
import "./_libs/h3-v2.mjs";
import "./_libs/rou3.mjs";
import "./_libs/srvx.mjs";
import "./_ssr/auth-middleware-C6u9Brrq.mjs";
import "./_libs/supabase__supabase-js.mjs";
import "./_libs/supabase__postgrest-js.mjs";
import "./_libs/supabase__realtime-js.mjs";
import "./_libs/supabase__phoenix.mjs";
import "./_libs/supabase__storage-js.mjs";
import "./_libs/iceberg-js.mjs";
import "./_libs/supabase__auth-js.mjs";
import "tslib";
import "./_libs/supabase__functions-js.mjs";
import "./_libs/zod.mjs";
function AnalyticsPage() {
  const fn = useServerFn(listApplications);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["applications"],
    queryFn: () => fn()
  });
  const stats = (() => {
    const apps = data ?? [];
    const total = apps.length;
    const by = {};
    let scoreSum = 0, scored = 0;
    apps.forEach((a) => {
      by[a.status] = (by[a.status] ?? 0) + 1;
      if (a.match_score != null) {
        scoreSum += Number(a.match_score);
        scored++;
      }
    });
    const submitted = (by.submitted ?? 0) + (by.interview ?? 0) + (by.offer ?? 0);
    const interviews = (by.interview ?? 0) + (by.offer ?? 0);
    return {
      total,
      avgScore: scored ? Math.round(scoreSum / scored * 100) : null,
      submitted,
      interviewRate: submitted ? Math.round(interviews / submitted * 100) : 0,
      by
    };
  })();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-semibold tracking-tight", children: "Analytics" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Funnel and quality of your applications." })
    ] }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading…" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Total applications", value: String(stats.total) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Submitted", value: String(stats.submitted) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Interview rate", value: `${stats.interviewRate}%` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Avg match score", value: stats.avgScore == null ? "—" : `${stats.avgScore}%` })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 rounded-xl border border-border bg-card p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { className: "h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-medium", children: "Pipeline breakdown" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          Object.entries(stats.by).map(([status, count]) => {
            const pct = stats.total ? count / stats.total * 100 : 0;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-1 flex justify-between text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "capitalize", children: status.replace("_", " ") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: count })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full bg-primary", style: {
                width: `${pct}%`
              } }) })
            ] }, status);
          }),
          Object.keys(stats.by).length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No data yet." })
        ] })
      ] })
    ] })
  ] });
}
function Stat({
  label,
  value
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-3xl font-semibold", children: value })
  ] });
}
export {
  AnalyticsPage as component
};
