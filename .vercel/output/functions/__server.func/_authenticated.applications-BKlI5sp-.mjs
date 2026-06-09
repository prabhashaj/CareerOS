import { r as reactExports, j as jsxRuntimeExports } from "./_libs/react.mjs";
import { L as Link } from "./_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery, b as useMutation } from "./_libs/tanstack__react-query.mjs";
import { u as useServerFn } from "./_ssr/useServerFn-DL2oePlL.mjs";
import { t as toast } from "./_libs/sonner.mjs";
import { a as listApplications } from "./_ssr/applications.functions-D6FXcIIX.mjs";
import { c as createSsrRpc } from "./_ssr/createSsrRpc-ZrE_UFSo.mjs";
import { a as createServerFn } from "./_ssr/server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./_ssr/auth-middleware-C6u9Brrq.mjs";
import { B as Badge } from "./_ssr/badge-YM7oB01y.mjs";
import { B as Button, c as cn } from "./_ssr/button-DjOZMqFS.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, e as DialogDescription, d as DialogFooter } from "./_ssr/dialog-DxnQwSo9.mjs";
import { I as Input } from "./_ssr/input-D_U8fI25.mjs";
import { L as Label } from "./_ssr/label-C8WJLhmR.mjs";
import { T as Textarea } from "./_ssr/textarea-F69quoCd.mjs";
import "./_libs/seroval.mjs";
import { S as Sparkles, z as CircleX, H as Trophy, J as CalendarCheck2, b as Send, R as Rocket, K as PenLine, N as Bookmark, e as ClipboardCheck, O as ChevronRight, Q as Building2, V as Bot, u as CircleCheck, X } from "./_libs/lucide-react.mjs";
import { g as objectType, i as stringType } from "./_libs/zod.mjs";
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
import "./_libs/class-variance-authority.mjs";
import "./_libs/clsx.mjs";
import "./_libs/radix-ui__react-slot.mjs";
import "./_libs/radix-ui__react-compose-refs.mjs";
import "./_libs/tailwind-merge.mjs";
import "./_libs/radix-ui__react-dialog.mjs";
import "./_libs/radix-ui__primitive.mjs";
import "./_libs/radix-ui__react-context.mjs";
import "./_libs/radix-ui__react-id.mjs";
import "./_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "./_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "./_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "./_libs/radix-ui__react-primitive.mjs";
import "./_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "./_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "./_libs/radix-ui__react-focus-scope.mjs";
import "./_libs/radix-ui__react-portal.mjs";
import "./_libs/radix-ui__react-presence.mjs";
import "./_libs/radix-ui__react-focus-guards.mjs";
import "./_libs/react-remove-scroll.mjs";
import "./_libs/react-remove-scroll-bar.mjs";
import "./_libs/react-style-singleton.mjs";
import "./_libs/get-nonce.mjs";
import "./_libs/use-sidecar.mjs";
import "./_libs/use-callback-ref.mjs";
import "./_libs/aria-hidden.mjs";
import "./_libs/radix-ui__react-label.mjs";
const draftAutomationPlan = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  application_id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("509d86f3d83fdc12ec47488edc7eb1bb9dd98b7b5fb119bae813b55291605308"));
const confirmSubmission = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  application_id: stringType().uuid(),
  external_reference: stringType().max(500).optional(),
  notes: stringType().max(2e3).optional()
}).parse(input)).handler(createSsrRpc("b2eafea1a293ffbe23e02070d4ffdea7a746809aeeb74d3b7978189b4f5844f6"));
const cancelAutomation = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  application_id: stringType().uuid(),
  reason: stringType().max(500).optional()
}).parse(input)).handler(createSsrRpc("4c2e06485dea779ce3392ef39142f51566adab607c04c658cec264cee3ea1600"));
const STATUS_META = {
  saved: {
    label: "Saved",
    icon: Bookmark,
    tone: "text-muted-foreground",
    description: "Opportunities you've bookmarked."
  },
  drafting: {
    label: "Drafting",
    icon: PenLine,
    tone: "text-accent-foreground",
    description: "Plans in progress — review before sending."
  },
  ready_to_apply: {
    label: "Ready to apply",
    icon: Rocket,
    tone: "text-primary",
    description: "Polished and waiting on your green light."
  },
  submitted: {
    label: "Submitted",
    icon: Send,
    tone: "text-primary",
    description: "Out the door. Waiting on a response."
  },
  interview: {
    label: "Interview",
    icon: CalendarCheck2,
    tone: "text-success",
    description: "Conversations underway."
  },
  offer: {
    label: "Offer",
    icon: Trophy,
    tone: "text-success",
    description: "The good stuff."
  },
  rejected: {
    label: "Closed",
    icon: CircleX,
    tone: "text-muted-foreground",
    description: "Archived for the record."
  }
};
const STATUS_ORDER = ["saved", "drafting", "ready_to_apply", "submitted", "interview", "offer", "rejected"];
function ApplicationsPage() {
  const qc = useQueryClient();
  const fn = useServerFn(listApplications);
  const draftFn = useServerFn(draftAutomationPlan);
  const cancelFn = useServerFn(cancelAutomation);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["applications"],
    queryFn: () => fn()
  });
  const [confirmTarget, setConfirmTarget] = reactExports.useState(null);
  const [activeFilter, setActiveFilter] = reactExports.useState("all");
  const drafting = useMutation({
    mutationFn: (application_id) => draftFn({
      data: {
        application_id
      }
    }),
    onSuccess: (res) => {
      toast.success(`Plan ready: ${res.plan.steps.length} steps. Review and approve.`);
      qc.invalidateQueries({
        queryKey: ["applications"]
      });
      qc.invalidateQueries({
        queryKey: ["review-queue"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const cancelling = useMutation({
    mutationFn: (application_id) => cancelFn({
      data: {
        application_id
      }
    }),
    onSuccess: () => {
      toast.success("Automation cancelled");
      qc.invalidateQueries({
        queryKey: ["applications"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const grouped = reactExports.useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    STATUS_ORDER.forEach((s) => m.set(s, []));
    (data ?? []).forEach((a) => {
      const key = a.status ?? "saved";
      const list = m.get(key) ?? [];
      list.push(a);
      m.set(key, list);
    });
    return m;
  }, [data]);
  const total = data?.length ?? 0;
  const active = (grouped.get("drafting")?.length ?? 0) + (grouped.get("ready_to_apply")?.length ?? 0) + (grouped.get("submitted")?.length ?? 0) + (grouped.get("interview")?.length ?? 0);
  const wins = grouped.get("offer")?.length ?? 0;
  const responseRate = total > 0 ? Math.round(((grouped.get("interview")?.length ?? 0) + (grouped.get("offer")?.length ?? 0)) / total * 100) : 0;
  const visibleSections = activeFilter === "all" ? STATUS_ORDER : STATUS_ORDER.filter((s) => s === activeFilter);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl px-6 py-10 md:px-10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-end justify-between gap-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3 w-3 text-accent" }),
          "Pipeline"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-4xl tracking-tight", children: "Applications" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 max-w-xl text-sm text-muted-foreground", children: "Every opportunity, from bookmark to offer. Draft browser-assisted submissions and approve each step before anything goes out." })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Total", value: total }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "In flight", value: active, accent: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Offers", value: wins, tone: "success" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Response rate", value: `${responseRate}%` })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(FilterPill, { label: "All", count: total, active: activeFilter === "all", onClick: () => setActiveFilter("all") }),
      STATUS_ORDER.map((s) => {
        const count = grouped.get(s)?.length ?? 0;
        if (count === 0) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(FilterPill, { label: STATUS_META[s].label, count, active: activeFilter === s, onClick: () => setActiveFilter(s) }, s);
      })
    ] }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [0, 1, 2].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-24 animate-pulse rounded-2xl border border-border bg-card" }, i)) }) : !data || data.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardCheck, { className: "h-7 w-7 text-primary" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-xl", children: "No applications yet" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-2 max-w-sm text-sm text-muted-foreground", children: "Rank a job and draft an application to start tracking it here." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/jobs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "mt-5", size: "sm", children: [
        "Browse jobs",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "ml-1 h-4 w-4" })
      ] }) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-8", children: visibleSections.map((s) => {
      const items = grouped.get(s) ?? [];
      if (items.length === 0) return null;
      const meta = STATUS_META[s];
      const Icon = meta.icon;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex h-9 w-9 items-center justify-center rounded-lg bg-secondary", meta.tone), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg leading-none", children: meta.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: items.length })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: meta.description })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: items.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsx(ApplicationCard, { app: a, status: s, onDraft: () => drafting.mutate(a.id), onCancel: () => cancelling.mutate(a.id), onConfirm: () => setConfirmTarget(a), draftPending: drafting.isPending, cancelPending: cancelling.isPending }, a.id)) })
      ] }, s);
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ConfirmSubmissionDialog, { application: confirmTarget, onClose: () => setConfirmTarget(null), onDone: () => {
      qc.invalidateQueries({
        queryKey: ["applications"]
      });
      setConfirmTarget(null);
    } })
  ] });
}
function StatCard({
  label,
  value,
  accent,
  tone
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("rounded-xl border border-border bg-card p-4 transition-colors", accent && "border-accent/40 bg-accent/5"), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("mt-1 font-display text-2xl", tone === "success" && "text-success"), children: value })
  ] });
}
function FilterPill({
  label,
  count,
  active,
  onClick
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick, className: cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all", active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary"), children: [
    label,
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("rounded-full px-1.5 text-[10px]", active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"), children: count })
  ] });
}
function ApplicationCard({
  app,
  status,
  onDraft,
  onCancel,
  onConfirm,
  draftPending,
  cancelPending
}) {
  const match = app.match_score != null ? Math.round(Number(app.match_score) * 100) : null;
  const matchTone = match == null ? "text-muted-foreground" : match >= 80 ? "text-success" : match >= 60 ? "text-accent-foreground" : "text-muted-foreground";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group relative overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity group-hover:opacity-100", status === "offer" || status === "interview" ? "bg-success" : status === "rejected" ? "bg-muted-foreground/30" : "bg-primary") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/jobs/$jobId", params: {
        jobId: app.job_id
      }, className: "block", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary", children: app.job?.title ?? "Untitled role" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-center gap-1.5 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-3 w-3 shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "line-clamp-1", children: app.job?.company ?? "Unknown company" })
          ] })
        ] }),
        match != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("shrink-0 rounded-lg border border-border bg-background px-2 py-1 text-center", matchTone), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-display text-sm leading-none", children: match }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground", children: "match" })
        ] })
      ] }) }),
      (status === "saved" || status === "ready_to_apply" || status === "drafting") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center gap-1.5 border-t border-border pt-3", children: [
        (status === "saved" || status === "ready_to_apply") && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "h-7 flex-1 text-xs", disabled: draftPending, onClick: onDraft, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "mr-1 h-3 w-3" }),
          "Draft plan"
        ] }),
        status === "drafting" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "h-7 flex-1 text-xs", onClick: onConfirm, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "mr-1 h-3 w-3" }),
            "Mark submitted"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", className: "h-7 px-2 text-xs", onClick: onCancel, disabled: cancelPending, "aria-label": "Cancel automation", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" }) })
        ] })
      ] })
    ] })
  ] });
}
function ConfirmSubmissionDialog({
  application,
  onClose,
  onDone
}) {
  const confirmFn = useServerFn(confirmSubmission);
  const [ref, setRef] = reactExports.useState("");
  const [notes, setNotes] = reactExports.useState("");
  const submit = useMutation({
    mutationFn: () => confirmFn({
      data: {
        application_id: application.id,
        external_reference: ref || void 0,
        notes: notes || void 0
      }
    }),
    onSuccess: () => {
      toast.success("Marked as submitted");
      setRef("");
      setNotes("");
      onDone();
    },
    onError: (e) => toast.error(e.message)
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!application, onOpenChange: (o) => !o && onClose(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Confirm submission" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { children: [
        "Confirm that the application for ",
        application?.job?.title,
        " at",
        " ",
        application?.job?.company,
        " was submitted. This logs the event and moves it to the Submitted column."
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "ref", children: "External reference (optional)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "ref", placeholder: "e.g. Greenhouse application ID", value: ref, onChange: (e) => setRef(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "notes", children: "Notes (optional)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { id: "notes", rows: 3, placeholder: "Recruiter contact, follow-up date…", value: notes, onChange: (e) => setNotes(e.target.value) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", onClick: onClose, children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => submit.mutate(), disabled: submit.isPending, children: submit.isPending ? "Saving…" : "Confirm submitted" })
    ] })
  ] }) });
}
export {
  ApplicationsPage as component
};
