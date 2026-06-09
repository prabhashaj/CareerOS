import { r as reactExports, j as jsxRuntimeExports } from "./_libs/react.mjs";
import { L as Link } from "./_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery } from "./_libs/tanstack__react-query.mjs";
import { u as useServerFn } from "./_ssr/useServerFn-DL2oePlL.mjs";
import { t as toast } from "./_libs/sonner.mjs";
import { l as listReviewQueue, d as decideReview } from "./_ssr/applications.functions-D6FXcIIX.mjs";
import { B as Button } from "./_ssr/button-DjOZMqFS.mjs";
import { B as Badge } from "./_ssr/badge-YM7oB01y.mjs";
import "./_libs/seroval.mjs";
import { I as Inbox, B as Briefcase, p as MapPin, E as ExternalLink, q as ShieldX, f as ShieldCheck, h as Puzzle, b as Send, r as ChevronDown } from "./_libs/lucide-react.mjs";
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
import "./_libs/radix-ui__react-slot.mjs";
import "./_libs/radix-ui__react-compose-refs.mjs";
import "./_libs/class-variance-authority.mjs";
import "./_libs/clsx.mjs";
import "./_libs/tailwind-merge.mjs";
function ReviewPage() {
  const qc = useQueryClient();
  const fn = useServerFn(listReviewQueue);
  const decide = useServerFn(decideReview);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["review_queue"],
    queryFn: () => fn()
  });
  const [expanded, setExpanded] = reactExports.useState({});
  const [busy, setBusy] = reactExports.useState(null);
  const [filled] = reactExports.useState({});
  const openWithExtension = (sourceUrl) => {
    if (!sourceUrl) {
      toast.error("No application URL on this job.");
      return;
    }
    window.open(sourceUrl, "_blank", "noopener,noreferrer");
    toast.success("Opened application — click the CareerOS extension icon to auto-fill.");
  };
  const decideAndAutofill = async (rowId, decision, _applicationId, sourceUrl) => {
    setBusy(rowId);
    try {
      await decide({
        data: {
          id: rowId,
          decision
        }
      });
      qc.invalidateQueries({
        queryKey: ["review_queue"]
      });
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-semibold tracking-tight", children: "Review queue" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Human-in-the-loop checkpoints before any sensitive AI action." })
    ] }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading…" }) : !data || data.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-dashed border-border p-12 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Inbox, { className: "mx-auto h-10 w-10 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "Nothing to review." })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: data.map((r) => {
      const payload = r.payload ?? {};
      const steps = payload.steps ?? [];
      const isOpen = expanded[r.id] ?? false;
      const job = r.job ?? null;
      const application = r.application ?? null;
      const sourceUrl = payload.source_url ?? job?.source_url ?? void 0;
      const fillRes = filled[r.id];
      const draftUrl = fillRes?.draftUrl ?? application?.answers?.draft_url ?? null;
      const applyHref = draftUrl ?? sourceUrl;
      const isBusy = busy === r.id;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium", children: r.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: r.status === "pending" ? "secondary" : r.status === "approved" ? "default" : "outline", children: r.status }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: r.action_type }),
              payload.detected_ats && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: payload.detected_ats }),
              application?.status && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", children: [
                "app: ",
                application.status
              ] })
            ] }),
            job && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Briefcase, { className: "h-3.5 w-3.5" }),
                job.company,
                " · ",
                job.title
              ] }),
              (job.location || job.remote) && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3.5 w-3.5" }),
                job.location ?? "—",
                job.remote ? " · Remote" : ""
              ] }),
              application && /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/jobs/$jobId", params: {
                jobId: application.job_id ?? ""
              }, className: "text-primary hover:underline", children: "Open job →" })
            ] }),
            r.summary && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: r.summary }),
            sourceUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: sourceUrl, target: "_blank", rel: "noreferrer", className: "mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" }),
              "Application page"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 flex-wrap justify-end gap-2", children: [
            r.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", disabled: isBusy, onClick: () => decideAndAutofill(r.id, "rejected", application?.id ?? null, sourceUrl), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldX, { className: "mr-1 h-4 w-4" }),
                " Reject"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", disabled: isBusy, onClick: () => decideAndAutofill(r.id, "approved", application?.id ?? null, sourceUrl), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "mr-1 h-4 w-4" }),
                isBusy ? "Working…" : "Approve & auto-apply"
              ] })
            ] }),
            r.status !== "pending" && sourceUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", disabled: isBusy, onClick: () => openWithExtension(sourceUrl), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Puzzle, { className: "mr-1 h-4 w-4" }),
              "Open & auto-fill"
            ] }),
            applyHref && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: applyHref, target: "_blank", rel: "noreferrer", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "mr-1 h-4 w-4" }),
              draftUrl ? "Open saved draft" : "Apply"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/extension", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Puzzle, { className: "mr-1 h-4 w-4" }),
              "Get extension"
            ] }) })
          ] })
        ] }),
        fillRes && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/30 p-2 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "Filled ",
            fillRes.filled,
            "/",
            fillRes.total,
            " fields."
          ] }),
          (fillRes.uploaded ?? 0) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Uploaded resume." }),
          (fillRes.manualUploads ?? 0) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Resume upload still needs review." }),
          fillRes.error && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
            "Live fill issue: ",
            fillRes.error
          ] }),
          fillRes.liveViewUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { className: "inline-flex items-center gap-1 text-primary hover:underline", href: fillRes.liveViewUrl, target: "_blank", rel: "noreferrer", children: [
            "Open live browser ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" })
          ] }),
          fillRes.directApplyUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { className: "inline-flex items-center gap-1 text-primary hover:underline", href: fillRes.directApplyUrl, target: "_blank", rel: "noreferrer", children: [
            "Start fresh ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" })
          ] })
        ] }),
        payload.warnings && payload.warnings.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-3 space-y-1 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive", children: payload.warnings.map((w, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          "• ",
          w
        ] }, i)) }),
        steps.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setExpanded((m) => ({
            ...m,
            [r.id]: !isOpen
          })), className: "flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: `h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}` }),
            steps.length,
            " submission step",
            steps.length === 1 ? "" : "s"
          ] }),
          isOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "mt-3 space-y-2", children: steps.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "rounded-md border border-border bg-background p-3 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", className: "font-mono", children: [
                i + 1,
                ". ",
                s.action
              ] }),
              s.field_label && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: s.field_label })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 font-mono text-[11px] text-muted-foreground break-all", children: s.selector }),
            s.value && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 line-clamp-3 whitespace-pre-wrap text-foreground/80", children: s.value }),
            s.note && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-amber-600 dark:text-amber-400", children: s.note })
          ] }, i)) })
        ] })
      ] }, r.id);
    }) })
  ] });
}
export {
  ReviewPage as component
};
