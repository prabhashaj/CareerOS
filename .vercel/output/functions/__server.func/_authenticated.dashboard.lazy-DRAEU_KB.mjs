import { r as reactExports, j as jsxRuntimeExports } from "./_libs/react.mjs";
import { f as createLazyFileRoute, d as useNavigate, L as Link } from "./_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery } from "./_libs/tanstack__react-query.mjs";
import { u as useServerFn } from "./_ssr/useServerFn-DL2oePlL.mjs";
import { t as toast } from "./_libs/sonner.mjs";
import { B as Badge } from "./_ssr/badge-YM7oB01y.mjs";
import { B as Button } from "./_ssr/button-DjOZMqFS.mjs";
import { I as Input } from "./_ssr/input-D_U8fI25.mjs";
import { a as listApplications, l as listReviewQueue } from "./_ssr/applications.functions-D6FXcIIX.mjs";
import { l as listDocuments } from "./_ssr/documents.functions-CY_Z-ixU.mjs";
import { l as listJobs } from "./_ssr/jobs.functions-CnWwYxO0.mjs";
import { s as searchJobsWeb } from "./_ssr/jobsearch.functions-DPXN7zgz.mjs";
import "./_libs/seroval.mjs";
import { S as Sparkles, c as Search, X, a9 as BookOpen, aa as User, A as ArrowRight, Y as Globe, ab as FilePlus, ac as PenTool, ad as CircleQuestionMark, y as TrendingUp, f as ShieldCheck } from "./_libs/lucide-react.mjs";
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
import "./_libs/tanstack__query-core.mjs";
import "./_libs/class-variance-authority.mjs";
import "./_libs/clsx.mjs";
import "./_libs/radix-ui__react-slot.mjs";
import "./_libs/radix-ui__react-compose-refs.mjs";
import "./_libs/tailwind-merge.mjs";
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
const Route = createLazyFileRoute("/_authenticated/dashboard")({
  component: Dashboard
});
function Dashboard() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const jobsFn = useServerFn(listJobs);
  const docsFn = useServerFn(listDocuments);
  const appsFn = useServerFn(listApplications);
  const reviewFn = useServerFn(listReviewQueue);
  const searchFn = useServerFn(searchJobsWeb);
  const [q, setQ] = reactExports.useState("");
  const [loc, setLoc] = reactExports.useState("");
  const [searching, setSearching] = reactExports.useState(false);
  const [showGuide, setShowGuide] = reactExports.useState(true);
  reactExports.useEffect(() => {
    const saved = localStorage.getItem("career_os_onboarding_guide");
    if (saved === "false") {
      setShowGuide(false);
    }
  }, []);
  const handleDismissGuide = () => {
    setShowGuide(false);
    localStorage.setItem("career_os_onboarding_guide", "false");
  };
  const handleShowGuide = () => {
    setShowGuide(true);
    localStorage.removeItem("career_os_onboarding_guide");
  };
  useQuery({ queryKey: ["jobs"], queryFn: () => jobsFn() });
  useQuery({ queryKey: ["documents"], queryFn: () => docsFn() });
  const apps = useQuery({ queryKey: ["applications"], queryFn: () => appsFn() });
  const reviews = useQuery({ queryKey: ["review_queue"], queryFn: () => reviewFn() });
  const pendingReviews = (reviews.data ?? []).filter((r) => r.status === "pending").length;
  const scoredApps = (apps.data ?? []).filter((a) => a.match_score != null);
  const avgScore = scoredApps.length ? Math.round(
    scoredApps.reduce((sum, a) => sum + Number(a.match_score), 0) / scoredApps.length * 100
  ) : null;
  const topMatches = [...apps.data ?? []].filter((a) => a.match_score != null).sort((a, b) => Number(b.match_score) - Number(a.match_score)).slice(0, 5);
  const handleDiscover = async () => {
    setSearching(true);
    try {
      const res = await searchFn({
        data: { query: q.trim() || void 0, location: loc.trim() || void 0, limit: 30 }
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (res.ingested > 0) {
        toast.success(`Found ${res.ingested} new job${res.ingested === 1 ? "" : "s"}`);
        qc.invalidateQueries({ queryKey: ["jobs"] });
        navigate({ to: "/jobs" });
      } else {
        toast.info("No new jobs found. Try a different query.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl space-y-10 p-6 md:p-10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative overflow-hidden rounded-3xl border border-border bg-gradient-primary p-8 text-primary-foreground shadow-lift md:p-14", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/25 blur-3xl" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-accent/10 blur-3xl" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative max-w-2xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-accent", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3 w-3" }),
          " AI Discovery"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "mt-5 font-display text-5xl leading-[1.02] md:text-6xl", children: [
          "Find your next role,",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("em", { className: "text-accent", children: "tailored" }),
          " to you."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 max-w-xl text-base text-primary-foreground/75", children: "Search Naukri, LinkedIn India, Instahyre, Cutshort and other top Indian job boards. We rank every match against your profile and draft a tailored application." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-7 flex flex-col gap-2 rounded-2xl bg-background/95 p-2 text-foreground shadow-lift sm:flex-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 items-center gap-2 px-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: q,
                onChange: (e) => setQ(e.target.value),
                placeholder: "Role, skill or keywords",
                className: "border-0 px-0 shadow-none focus-visible:ring-0",
                disabled: searching,
                onKeyDown: (e) => {
                  if (e.key === "Enter") handleDiscover();
                }
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden h-8 w-px self-center bg-border sm:block" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: loc,
              onChange: (e) => setLoc(e.target.value),
              placeholder: "Location (optional)",
              className: "border-0 shadow-none focus-visible:ring-0 sm:max-w-[220px]",
              disabled: searching,
              onKeyDown: (e) => {
                if (e.key === "Enter") handleDiscover();
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleDiscover, disabled: searching, size: "lg", className: "bg-gradient-accent text-accent-foreground hover:opacity-90", children: searching ? "Searching…" : "Discover jobs" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap gap-2 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/upload", className: "rounded-full bg-background/10 px-3 py-1.5 text-primary-foreground/80 transition-colors hover:bg-background/20", children: "Paste a URL →" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/jobs", className: "rounded-full bg-background/10 px-3 py-1.5 text-primary-foreground/80 transition-colors hover:bg-background/20", children: "Browse pipeline →" })
        ] })
      ] })
    ] }),
    showGuide ? /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft md:p-8 animate-fade-in-up", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute right-4 top-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "ghost",
          size: "icon",
          onClick: handleDismissGuide,
          className: "text-muted-foreground hover:text-foreground h-8 w-8",
          title: "Dismiss onboarding guide",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" })
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-5 w-5 text-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-2xl md:text-3xl text-foreground", children: "Getting Started: How to effectively use CareerOS" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-6 max-w-3xl", children: "CareerOS matches and tailors applications by grounding AI actions in your real background. Follow these steps to build your master knowledge base and generate high-impact career assets." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col justify-between space-y-3 rounded-xl border border-border bg-muted/10 p-4 transition-all hover:bg-muted/20", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary", children: "1" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-medium text-sm flex items-center gap-1.5 text-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-4 w-4 text-muted-foreground" }),
                " Profile details"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs leading-relaxed text-muted-foreground", children: "Fill in your target roles, locations, and personal info in Settings. This defines the target parameters for all matching." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Link,
            {
              to: "/settings",
              className: "inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline pt-2",
              children: [
                "Configure details ",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-3 w-3" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col justify-between space-y-3 rounded-xl border border-border bg-muted/10 p-4 transition-all hover:bg-muted/20", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary", children: "2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-medium text-sm flex items-center gap-1.5 text-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "h-4 w-4 text-muted-foreground" }),
                " Connect URLs"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs leading-relaxed text-muted-foreground", children: "Enrich your profile by pasting links to your GitHub, LinkedIn, portfolio, or blogs. Our AI indexes them automatically." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Link,
            {
              to: "/settings",
              className: "inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline pt-2",
              children: [
                "Expand profile ",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-3 w-3" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col justify-between space-y-3 rounded-xl border border-border bg-muted/10 p-4 transition-all hover:bg-muted/20", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary", children: "3" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-medium text-sm flex items-center gap-1.5 text-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FilePlus, { className: "h-4 w-4 text-muted-foreground" }),
                " Add Documents"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs leading-relaxed text-muted-foreground", children: "Upload your master resumes, past cover letters, transcripts, or experience letters to act as the source of truth for applications." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Link,
            {
              to: "/upload",
              className: "inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline pt-2",
              children: [
                "Upload resumes ",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-3 w-3" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col justify-between space-y-3 rounded-xl border border-border bg-muted/10 p-4 transition-all hover:bg-muted/20", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary", children: "4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-medium text-sm flex items-center gap-1.5 text-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(PenTool, { className: "h-4 w-4 text-muted-foreground" }),
                " Writing Style"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs leading-relaxed text-muted-foreground", children: "Paste writing samples in Settings. The AI builds a style print so tailored applications speak in your genuine voice." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Link,
            {
              to: "/settings",
              className: "inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline pt-2",
              children: [
                "Train writing style ",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-3 w-3" })
              ]
            }
          )
        ] })
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        variant: "ghost",
        size: "sm",
        onClick: handleShowGuide,
        className: "text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 h-8 px-3 rounded-full border border-border bg-card/50",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleQuestionMark, { className: "h-3.5 w-3.5" }),
          " Show setup guide"
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-2xl", children: "Top matches" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Highest-scoring applications" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "ghost", size: "sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/jobs", children: [
            "All jobs ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "ml-1 h-3 w-3" })
          ] }) })
        ] }),
        topMatches.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y divide-border", children: topMatches.map((a) => {
          const pct = Math.round(Number(a.match_score) * 100);
          return /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/jobs/$jobId", params: { jobId: a.job_id }, className: "flex items-center justify-between gap-4 rounded-lg px-2 py-1 -mx-2 transition-colors hover:bg-muted/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate font-medium", children: a.job?.title ?? "Untitled" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-sm text-muted-foreground", children: a.job?.company ?? "" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: pct >= 75 ? "default" : pct >= 50 ? "secondary" : "outline", className: "shrink-0", children: [
              pct,
              "%"
            ] })
          ] }) }, a.id);
        }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-dashed border-border p-10 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No ranked jobs yet. Open a job and click Rank." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, className: "mt-4", size: "sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/jobs", children: "Go to jobs" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/20 blur-2xl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-2xl", children: "Quality" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-display text-6xl", children: avgScore == null ? "—" : `${avgScore}%` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Average AI match score across your applications." }),
          pendingReviews > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "outline", className: "mt-6 w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/review", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "mr-2 h-4 w-4" }),
            " ",
            pendingReviews,
            " pending review",
            pendingReviews === 1 ? "" : "s"
          ] }) })
        ] })
      ] })
    ] })
  ] });
}
export {
  Route
};
