import { r as reactExports, j as jsxRuntimeExports } from "./_libs/react.mjs";
import { u as useServerFn } from "./_ssr/useServerFn-DL2oePlL.mjs";
import { t as toast } from "./_libs/sonner.mjs";
import { c as createSsrRpc } from "./_ssr/createSsrRpc-ZrE_UFSo.mjs";
import { a as createServerFn } from "./_ssr/server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./_ssr/auth-middleware-C6u9Brrq.mjs";
import { B as Button } from "./_ssr/button-DjOZMqFS.mjs";
import { B as Badge } from "./_ssr/badge-YM7oB01y.mjs";
import { L as Label } from "./_ssr/label-C8WJLhmR.mjs";
import "./_libs/seroval.mjs";
import { C as Compass, a as LoaderCircle, S as Sparkles, R as Rocket, y as TrendingUp, T as Target, A as ArrowRight } from "./_libs/lucide-react.mjs";
import { g as objectType, k as enumType, h as numberType, j as arrayType, i as stringType } from "./_libs/zod.mjs";
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
import "node:async_hooks";
import "./_libs/h3-v2.mjs";
import "./_libs/rou3.mjs";
import "./_libs/srvx.mjs";
import "./_libs/supabase__supabase-js.mjs";
import "./_libs/supabase__postgrest-js.mjs";
import "./_libs/supabase__realtime-js.mjs";
import "./_libs/supabase__phoenix.mjs";
import "./_libs/supabase__storage-js.mjs";
import "./_libs/iceberg-js.mjs";
import "./_libs/supabase__auth-js.mjs";
import "tslib";
import "./_libs/supabase__functions-js.mjs";
import "./_libs/radix-ui__react-slot.mjs";
import "./_libs/radix-ui__react-compose-refs.mjs";
import "./_libs/class-variance-authority.mjs";
import "./_libs/clsx.mjs";
import "./_libs/tailwind-merge.mjs";
import "./_libs/radix-ui__react-label.mjs";
import "./_libs/radix-ui__react-primitive.mjs";
const SuggestionSchema = objectType({
  role: stringType(),
  track: enumType(["adjacent", "lateral", "stretch"]),
  why_it_fits: stringType(),
  transferable_strengths: arrayType(stringType()).default([]),
  gaps_to_close: arrayType(stringType()).default([]),
  first_step: stringType(),
  example_titles: arrayType(stringType()).default([]),
  example_companies: arrayType(stringType()).default([])
});
objectType({
  summary: stringType(),
  suggestions: arrayType(SuggestionSchema),
  long_term_themes: arrayType(stringType()).default([])
});
const discoverCareerPaths = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  horizon_months: numberType().int().min(3).max(36).default(18),
  risk_appetite: enumType(["safe", "balanced", "stretch"]).default("balanced")
}).parse(input)).handler(createSsrRpc("9e23ea56720f0d68b8abba550b4704d12b4392ba344e9f7b1518c5dcbb091e90"));
const trackMeta = {
  adjacent: {
    icon: Target,
    label: "Adjacent",
    color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300"
  },
  lateral: {
    icon: TrendingUp,
    label: "Lateral",
    color: "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-300"
  },
  stretch: {
    icon: Rocket,
    label: "Stretch",
    color: "bg-accent/15 text-accent-foreground border-accent/40"
  }
};
function CareerPage() {
  const discover = useServerFn(discoverCareerPaths);
  const [busy, setBusy] = reactExports.useState(false);
  const [horizon, setHorizon] = reactExports.useState(18);
  const [risk, setRisk] = reactExports.useState("balanced");
  const [result, setResult] = reactExports.useState(null);
  const run = async () => {
    setBusy(true);
    try {
      const r = await discover({
        data: {
          horizon_months: horizon,
          risk_appetite: risk
        }
      });
      setResult(r);
      toast.success("Career paths ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };
  const grouped = result ? {
    adjacent: result.suggestions.filter((s) => s.track === "adjacent"),
    lateral: result.suggestions.filter((s) => s.track === "lateral"),
    stretch: result.suggestions.filter((s) => s.track === "stretch")
  } : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl p-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Compass, { className: "h-3 w-3 text-accent" }),
      " Discovery"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-4xl tracking-tight", children: "Career discovery" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 max-w-2xl text-sm text-muted-foreground", children: "Adjacent, lateral, and stretch roles you could realistically pursue — grounded in your profile and resume." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 rounded-2xl border border-border bg-gradient-to-br from-card to-card/50 p-6 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-[200px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "h", className: "text-xs uppercase tracking-wider text-muted-foreground", children: "Horizon" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { id: "h", type: "range", min: 3, max: 36, step: 3, value: horizon, onChange: (e) => setHorizon(Number(e.target.value)), className: "flex-1 accent-accent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "w-20 text-sm font-medium tabular-nums", children: [
            horizon,
            " mo"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs uppercase tracking-wider text-muted-foreground", children: "Risk appetite" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 flex gap-1 rounded-lg border border-border bg-background p-1", children: ["safe", "balanced", "stretch"].map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setRisk(r), className: `rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${risk === r ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`, children: r }, r)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { disabled: busy, onClick: run, size: "lg", className: "ml-auto", children: [
        busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "mr-2 h-4 w-4" }),
        busy ? "Thinking…" : result ? "Regenerate" : "Generate paths"
      ] })
    ] }) }),
    !result && !busy && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-12 rounded-2xl border border-dashed border-border p-12 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Compass, { className: "mx-auto h-10 w-10 text-muted-foreground/50" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "Generate paths to see tailored suggestions." })
    ] }),
    busy && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-12 rounded-2xl border border-border p-12 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mx-auto h-8 w-8 animate-spin text-accent" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "Analyzing your background…" })
    ] }),
    result && grouped && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 space-y-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase tracking-wider text-muted-foreground", children: "Summary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm leading-relaxed", children: result.summary })
      ] }),
      ["adjacent", "lateral", "stretch"].map((track) => {
        const items = grouped[track];
        if (items.length === 0) return null;
        const meta = trackMeta[track];
        const Icon = meta.icon;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4 text-accent" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-display text-xl", children: [
              meta.label,
              " moves"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
              "(",
              items.length,
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2", children: items.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "group rounded-2xl border border-border bg-card p-5 transition hover:border-accent/40 hover:shadow-md", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-lg leading-tight", children: s.role }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: meta.color, children: meta.label })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm leading-relaxed text-foreground/80", children: s.why_it_fits }),
            s.transferable_strengths.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-medium uppercase tracking-wider text-muted-foreground", children: "Transferable strengths" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1.5 flex flex-wrap gap-1", children: s.transferable_strengths.map((x, j) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs font-normal", children: x }, j)) })
            ] }),
            s.gaps_to_close.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-medium uppercase tracking-wider text-muted-foreground", children: "Gaps to close" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1.5 flex flex-wrap gap-1", children: s.gaps_to_close.map((x, j) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs font-normal", children: x }, j)) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-start gap-2 rounded-lg bg-accent/5 p-3 text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "First step:" }),
                " ",
                s.first_step
              ] })
            ] }),
            (s.example_titles.length > 0 || s.example_companies.length > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground", children: [
              s.example_titles.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Titles:" }),
                " ",
                s.example_titles.join(" · ")
              ] }),
              s.example_companies.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Companies:" }),
                " ",
                s.example_companies.join(" · ")
              ] })
            ] })
          ] }, i)) })
        ] }, track);
      }),
      result.long_term_themes.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-gradient-to-br from-accent/5 to-transparent p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4 text-accent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase tracking-wider text-muted-foreground", children: "Long-term themes" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-3 space-y-2", children: result.long_term_themes.map((t, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" }),
          t
        ] }, i)) })
      ] })
    ] })
  ] });
}
export {
  CareerPage as component
};
