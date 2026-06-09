import { r as reactExports, j as jsxRuntimeExports } from "./_libs/react.mjs";
import { L as Link } from "./_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery } from "./_libs/tanstack__react-query.mjs";
import { u as useServerFn } from "./_ssr/useServerFn-DL2oePlL.mjs";
import { t as toast } from "./_libs/sonner.mjs";
import { R as Root2$1, T as Trigger, P as Portal2, C as Content2$1, I as Item2, S as Separator2, a as SubTrigger2, b as SubContent2, c as CheckboxItem2, d as ItemIndicator2, e as RadioItem2, L as Label2 } from "./_libs/radix-ui__react-dropdown-menu.mjs";
import { B as Button, c as cn } from "./_ssr/button-DjOZMqFS.mjs";
import { l as listJobs, d as deleteJob, i as ingestJobFromUrl } from "./_ssr/jobs.functions-CnWwYxO0.mjs";
import { s as searchJobsWeb } from "./_ssr/jobsearch.functions-DPXN7zgz.mjs";
import { rankAllJobs } from "./_ssr/ranking.functions-C1pVUIEt.mjs";
import { a as listApplications } from "./_ssr/applications.functions-D6FXcIIX.mjs";
import { B as Badge } from "./_ssr/badge-YM7oB01y.mjs";
import { I as Input } from "./_ssr/input-D_U8fI25.mjs";
import { T as Textarea } from "./_ssr/textarea-F69quoCd.mjs";
import { L as Label } from "./_ssr/label-C8WJLhmR.mjs";
import { R as Root2, V as Value, T as Trigger$1, I as Icon, P as Portal, C as Content2, a as Viewport, b as Item, c as ItemIndicator, d as ItemText, S as ScrollUpButton, e as ScrollDownButton, L as Label$1, f as Separator } from "./_libs/radix-ui__react-select.mjs";
import "./_libs/seroval.mjs";
import { W as WandSparkles, w as Plus, Y as Globe, Z as Sprout, a as LoaderCircle, S as Sparkles, t as Link2, _ as Funnel, X, E as ExternalLink, $ as Ellipsis, x as Eye, a0 as GraduationCap, k as Mic, n as Trash2, r as ChevronDown, a1 as Check, a2 as ChevronUp, O as ChevronRight, a3 as Circle } from "./_libs/lucide-react.mjs";
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
import "./_libs/radix-ui__primitive.mjs";
import "./_libs/radix-ui__react-compose-refs.mjs";
import "./_libs/radix-ui__react-context.mjs";
import "./_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "./_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "./_libs/radix-ui__react-primitive.mjs";
import "./_libs/radix-ui__react-slot.mjs";
import "./_libs/radix-ui__react-menu.mjs";
import "./_libs/radix-ui__react-collection.mjs";
import "./_libs/radix-ui__react-direction.mjs";
import "./_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "./_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "./_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "./_libs/radix-ui__react-focus-guards.mjs";
import "./_libs/radix-ui__react-focus-scope.mjs";
import "./_libs/radix-ui__react-popper.mjs";
import "./_libs/floating-ui__react-dom.mjs";
import "./_libs/floating-ui__dom.mjs";
import "./_libs/floating-ui__core.mjs";
import "./_libs/floating-ui__utils.mjs";
import "./_libs/radix-ui__react-arrow.mjs";
import "./_libs/radix-ui__react-use-size.mjs";
import "./_libs/radix-ui__react-portal.mjs";
import "./_libs/radix-ui__react-presence.mjs";
import "./_libs/radix-ui__react-roving-focus.mjs";
import "./_libs/radix-ui__react-id.mjs";
import "./_libs/aria-hidden.mjs";
import "./_libs/react-remove-scroll.mjs";
import "tslib";
import "./_libs/react-remove-scroll-bar.mjs";
import "./_libs/react-style-singleton.mjs";
import "./_libs/get-nonce.mjs";
import "./_libs/use-sidecar.mjs";
import "./_libs/use-callback-ref.mjs";
import "./_libs/class-variance-authority.mjs";
import "./_libs/clsx.mjs";
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
import "./_libs/supabase__functions-js.mjs";
import "./_libs/zod.mjs";
import "./_libs/radix-ui__react-label.mjs";
import "./_libs/radix-ui__number.mjs";
import "./_libs/radix-ui__react-use-previous.mjs";
import "./_libs/@radix-ui/react-visually-hidden+[...].mjs";
const DropdownMenu = Root2$1;
const DropdownMenuTrigger = Trigger;
const DropdownMenuSubTrigger = reactExports.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  SubTrigger2,
  {
    ref,
    className: cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "ml-auto" })
    ]
  }
));
DropdownMenuSubTrigger.displayName = SubTrigger2.displayName;
const DropdownMenuSubContent = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  SubContent2,
  {
    ref,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)",
      className
    ),
    ...props
  }
));
DropdownMenuSubContent.displayName = SubContent2.displayName;
const DropdownMenuContent = reactExports.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Portal2, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
  Content2$1,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)",
      className
    ),
    ...props
  }
) }));
DropdownMenuContent.displayName = Content2$1.displayName;
const DropdownMenuItem = reactExports.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Item2,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuItem.displayName = Item2.displayName;
const DropdownMenuCheckboxItem = reactExports.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  CheckboxItem2,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ItemIndicator2, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
DropdownMenuCheckboxItem.displayName = CheckboxItem2.displayName;
const DropdownMenuRadioItem = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  RadioItem2,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ItemIndicator2, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
DropdownMenuRadioItem.displayName = RadioItem2.displayName;
const DropdownMenuLabel = reactExports.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Label2,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
    ...props
  }
));
DropdownMenuLabel.displayName = Label2.displayName;
const DropdownMenuSeparator = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Separator2,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
DropdownMenuSeparator.displayName = Separator2.displayName;
const Select = Root2;
const SelectValue = Value;
const SelectTrigger = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  Trigger$1,
  {
    ref,
    className: cn(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = Trigger$1.displayName;
const SelectScrollUpButton = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  ScrollUpButton,
  {
    ref,
    className: cn("flex cursor-default items-center justify-center py-1", className),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = ScrollUpButton.displayName;
const SelectScrollDownButton = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  ScrollDownButton,
  {
    ref,
    className: cn("flex cursor-default items-center justify-center py-1", className),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = ScrollDownButton.displayName;
const SelectContent = reactExports.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Portal, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
  Content2,
  {
    ref,
    className: cn(
      "relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-select-content-transform-origin)",
      position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      className
    ),
    position,
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectScrollUpButton, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Viewport,
        {
          className: cn(
            "p-1",
            position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = Content2.displayName;
const SelectLabel = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Label$1,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold", className),
    ...props
  }
));
SelectLabel.displayName = Label$1.displayName;
const SelectItem = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  Item,
  {
    ref,
    className: cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ItemIndicator, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ItemText, { children })
    ]
  }
));
SelectItem.displayName = Item.displayName;
const SelectSeparator = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
SelectSeparator.displayName = Separator.displayName;
const SOURCES = [{
  name: "Naukri",
  domain: "naukri.com"
}, {
  name: "LinkedIn India",
  domain: "linkedin.com"
}, {
  name: "Instahyre",
  domain: "instahyre.com"
}, {
  name: "Cutshort",
  domain: "cutshort.io"
}, {
  name: "Foundit",
  domain: "foundit.in"
}, {
  name: "Hirist",
  domain: "hirist.tech"
}, {
  name: "Internshala",
  domain: "internshala.com"
}];
function SearchingOverlay({
  query,
  location
}) {
  const target = `${query || "your target roles"}${location ? ` near ${location}` : ""}`;
  const phases = reactExports.useMemo(() => [`Building search for ${target}…`, ...SOURCES.map((s) => `Querying ${s.name}…`), "Scoring against your profile…", "Filtering duplicates & low-signal posts…", "Ingesting into your jobs list…"], [target]);
  const [i, setI] = reactExports.useState(0);
  reactExports.useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % phases.length), 1400);
    return () => clearInterval(t);
  }, [phases.length]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center gap-3 rounded-lg border border-primary/30 bg-background/60 px-3 py-2 text-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 shrink-0 animate-spin text-primary" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-muted-foreground animate-fade-in", children: phases[i] }, i)
  ] });
}
function JobsPage() {
  const qc = useQueryClient();
  const fn = useServerFn(listJobs);
  const del = useServerFn(deleteJob);
  const rankAll = useServerFn(rankAllJobs);
  const ingest = useServerFn(ingestJobFromUrl);
  const search = useServerFn(searchJobsWeb);
  const appsFn = useServerFn(listApplications);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => fn()
  });
  const apps = useQuery({
    queryKey: ["applications"],
    queryFn: () => appsFn()
  });
  const [url, setUrl] = reactExports.useState("");
  const [rawText, setRawText] = reactExports.useState("");
  const [showPaste, setShowPaste] = reactExports.useState(false);
  const [ingesting, setIngesting] = reactExports.useState(false);
  const [searchQ, setSearchQ] = reactExports.useState("");
  const [searchLoc, setSearchLoc] = reactExports.useState("");
  const [remoteOnly, setRemoteOnly] = reactExports.useState(false);
  const [searchMode, setSearchMode] = reactExports.useState("any");
  const [searching, setSearching] = reactExports.useState(false);
  const [showFilters, setShowFilters] = reactExports.useState(false);
  const [filterText, setFilterText] = reactExports.useState("");
  const [filterLoc, setFilterLoc] = reactExports.useState("");
  const [filterRemote, setFilterRemote] = reactExports.useState("any");
  const [filterType, setFilterType] = reactExports.useState("any");
  const [minMatch, setMinMatch] = reactExports.useState("");
  const [sortBy, setSortBy] = reactExports.useState("rank");
  const scoreMap = reactExports.useMemo(() => new Map((apps.data ?? []).map((a) => [a.job_id, {
    score: a.match_score,
    status: a.status
  }])), [apps.data]);
  const filteredJobs = reactExports.useMemo(() => {
    let rows = data ?? [];
    const q = filterText.trim().toLowerCase();
    const loc = filterLoc.trim().toLowerCase();
    if (q) rows = rows.filter((j) => `${j.title} ${j.company}`.toLowerCase().includes(q));
    if (loc) rows = rows.filter((j) => (j.location ?? "").toLowerCase().includes(loc));
    if (filterRemote === "remote") rows = rows.filter((j) => j.remote);
    if (filterRemote === "onsite") rows = rows.filter((j) => !j.remote);
    if (filterType !== "any") rows = rows.filter((j) => j.employment_type === filterType);
    const minPct = Number(minMatch);
    if (!Number.isNaN(minPct) && minMatch !== "") {
      rows = rows.filter((j) => {
        const s = scoreMap.get(j.id)?.score;
        return s != null && Math.round(Number(s) * 100) >= minPct;
      });
    }
    const sorted = [...rows];
    sorted.sort((a, b) => {
      if (sortBy === "rank") {
        const sa = Number(scoreMap.get(a.id)?.score ?? -1);
        const sb = Number(scoreMap.get(b.id)?.score ?? -1);
        return sb - sa;
      }
      if (sortBy === "newest") return +new Date(b.created_at) - +new Date(a.created_at);
      if (sortBy === "oldest") return +new Date(a.created_at) - +new Date(b.created_at);
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "company") return a.company.localeCompare(b.company);
      return 0;
    });
    return sorted;
  }, [data, scoreMap, filterText, filterLoc, filterRemote, filterType, minMatch, sortBy]);
  const activeFilterCount = (filterText ? 1 : 0) + (filterLoc ? 1 : 0) + (filterRemote !== "any" ? 1 : 0) + (filterType !== "any" ? 1 : 0) + (minMatch !== "" ? 1 : 0);
  const clearFilters = () => {
    setFilterText("");
    setFilterLoc("");
    setFilterRemote("any");
    setFilterType("any");
    setMinMatch("");
  };
  const handleDelete = async (id) => {
    await del({
      data: {
        id
      }
    });
    toast.success("Job removed");
    qc.invalidateQueries({
      queryKey: ["jobs"]
    });
  };
  const handleRankAll = async () => {
    toast.info("Ranking all jobs…");
    try {
      const res = await rankAll();
      toast.success(`Scored ${res.scored} jobs`);
      qc.invalidateQueries({
        queryKey: ["applications"]
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };
  const handleIngest = async () => {
    const u = url.trim();
    const t = rawText.trim();
    if (!u && t.length < 50) {
      toast.error("Enter a URL or paste the job description.");
      return;
    }
    setIngesting(true);
    try {
      await ingest({
        data: {
          url: u || void 0,
          rawText: t || void 0
        }
      });
      toast.success("Job imported");
      setUrl("");
      setRawText("");
      setShowPaste(false);
      qc.invalidateQueries({
        queryKey: ["jobs"]
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to import");
    } finally {
      setIngesting(false);
    }
  };
  const handleWebSearch = async () => {
    setSearching(true);
    try {
      const res = await search({
        data: {
          query: searchQ.trim() || void 0,
          location: searchLoc.trim() || void 0,
          remoteOnly,
          mode: searchMode,
          limit: 40
        }
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (res.ingested > 0) {
        toast.success(`Found ${res.ingested} new job${res.ingested === 1 ? "" : "s"}${res.skipped ? ` (skipped ${res.skipped})` : ""}`);
      } else {
        toast.info("No new jobs found. Try a different query or location.");
      }
      qc.invalidateQueries({
        queryKey: ["jobs"]
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex flex-wrap items-end justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-semibold tracking-tight", children: "Jobs" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "All discovered opportunities, ranked against your profile." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: handleRankAll, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(WandSparkles, { className: "mr-2 h-4 w-4" }),
          " Rank all"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/upload", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-2 h-4 w-4" }),
          " Add manually"
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 rounded-xl border border-border bg-gradient-to-br from-primary/5 to-card p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex flex-wrap items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm font-medium", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "h-4 w-4 text-primary" }),
          " Find jobs on the web"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex rounded-lg border border-border bg-background p-0.5 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setSearchMode("any"), disabled: searching, className: `inline-flex items-center gap-1 rounded-md px-3 py-1.5 transition ${searchMode === "any" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "h-3 w-3" }),
            " All roles"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setSearchMode("entry_level"), disabled: searching, className: `inline-flex items-center gap-1 rounded-md px-3 py-1.5 transition ${searchMode === "entry_level" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sprout, { className: "h-3 w-3" }),
            " Entry-level"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2 sm:grid-cols-[1fr_1fr_auto]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Role or keywords (defaults to your target roles)", value: searchQ, onChange: (e) => setSearchQ(e.target.value), disabled: searching }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Location (optional)", value: searchLoc, onChange: (e) => setSearchLoc(e.target.value), disabled: searching }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleWebSearch, disabled: searching, children: [
          searching ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "mr-2 h-4 w-4" }),
          searching ? "Searching…" : "Search the web"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mt-2 flex items-center gap-2 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: remoteOnly, onChange: (e) => setRemoteOnly(e.target.checked), disabled: searching }),
        "Remote only"
      ] }),
      searching && /* @__PURE__ */ jsxRuntimeExports.jsx(SearchingOverlay, { query: searchQ, location: searchLoc })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8 rounded-xl border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center gap-2 text-sm font-medium", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { className: "h-4 w-4 text-primary" }),
        " Import from URL"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 sm:flex-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "url", placeholder: "https://company.com/careers/role", value: url, onChange: (e) => setUrl(e.target.value), disabled: ingesting, onKeyDown: (e) => {
          if (e.key === "Enter") handleIngest();
        } }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleIngest, disabled: ingesting || !url.trim() && rawText.trim().length < 50, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "mr-2 h-4 w-4" }),
          " ",
          ingesting ? "Parsing…" : "Import"
        ] })
      ] }),
      showPaste && /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { className: "mt-2", rows: 6, placeholder: "Paste the full job description here if the URL is blocked…", value: rawText, onChange: (e) => setRawText(e.target.value), disabled: ingesting }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "We fetch the page server-side and use AI to extract the details. Some sites block bots — paste the text instead." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "text-xs text-primary hover:underline", onClick: () => setShowPaste((s) => !s), children: showPaste ? "Hide paste" : "Paste description instead" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: showFilters ? "default" : "outline", size: "sm", onClick: () => setShowFilters((s) => !s), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Funnel, { className: "mr-2 h-4 w-4" }),
        " Filters",
        activeFilterCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "ml-2", variant: "secondary", children: activeFilterCount })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Sort by" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: sortBy, onValueChange: (v) => setSortBy(v), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-8 w-[150px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "rank", children: "Match rank" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "newest", children: "Newest" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "oldest", children: "Oldest" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "title", children: "Title (A→Z)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "company", children: "Company (A→Z)" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-auto text-xs text-muted-foreground", children: [
        filteredJobs.length,
        " of ",
        data?.length ?? 0,
        " jobs"
      ] })
    ] }),
    showFilters && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 grid gap-3 rounded-xl border border-border bg-card p-4 animate-fade-in sm:grid-cols-2 lg:grid-cols-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Title / company" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "mt-1", placeholder: "e.g. backend, Stripe", value: filterText, onChange: (e) => setFilterText(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Location" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "mt-1", placeholder: "e.g. Berlin, NYC", value: filterLoc, onChange: (e) => setFilterLoc(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Remote" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: filterRemote, onValueChange: (v) => setFilterRemote(v), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "mt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "any", children: "Any" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "remote", children: "Remote only" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "onsite", children: "On-site only" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Type" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: filterType, onValueChange: setFilterType, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "mt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "any", children: "Any" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "full_time", children: "Full-time" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "part_time", children: "Part-time" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "contract", children: "Contract" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "internship", children: "Internship" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "temporary", children: "Temporary" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Min match %" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "mt-1", inputMode: "numeric", placeholder: "e.g. 60", value: minMatch, onChange: (e) => setMinMatch(e.target.value.replace(/[^\d]/g, "").slice(0, 3)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sm:col-span-2 lg:col-span-5 flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", onClick: clearFilters, disabled: activeFilterCount === 0, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "mr-1 h-3 w-3" }),
        " Clear filters"
      ] }) })
    ] }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading…" }) : filteredJobs.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-xl border border-border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "border-b border-border bg-muted/30 text-left text-xs uppercase text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-medium", children: "Match" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-medium", children: "Title" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-medium", children: "Company" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-medium", children: "Location" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-medium", children: "Status" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-border", children: filteredJobs.map((j) => {
        const meta = scoreMap.get(j.id);
        const pct = meta?.score != null ? Math.round(Number(meta.score) * 100) : null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/30", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: pct == null ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "—" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: pct >= 75 ? "default" : pct >= 50 ? "secondary" : "outline", children: [
            pct,
            "%"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-medium", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/jobs/$jobId", params: {
            jobId: j.id
          }, className: "hover:underline", children: j.title }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-muted-foreground", children: j.company }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-muted-foreground", children: j.remote ? "Remote" : j.location || "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-muted-foreground", children: meta?.status ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: meta.status }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: "—" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-1", children: [
            j.source_url && /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: j.source_url, target: "_blank", rel: "noreferrer", className: "rounded-md p-2 hover:bg-muted", title: "Original posting", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", title: "More actions", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ellipsis, { className: "h-4 w-4" }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { align: "end", className: "w-48", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/jobs/$jobId", params: {
                  jobId: j.id
                }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "mr-2 h-4 w-4" }),
                  " Open details"
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/jobs/$jobId", params: {
                  jobId: j.id
                }, hash: "upskill", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(GraduationCap, { className: "mr-2 h-4 w-4" }),
                  " Upskill plan"
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/jobs/$jobId", params: {
                  jobId: j.id
                }, hash: "interview", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { className: "mr-2 h-4 w-4" }),
                  " Interview prep"
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuSeparator, {}),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onSelect: () => handleDelete(j.id), className: "text-destructive focus:text-destructive", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-2 h-4 w-4" }),
                  " Delete"
                ] })
              ] })
            ] })
          ] }) })
        ] }, j.id);
      }) })
    ] }) }) : (data?.length ?? 0) > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-dashed border-border p-12 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No jobs match your filters." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", className: "mt-4", onClick: clearFilters, children: "Clear filters" })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-dashed border-border p-12 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No jobs yet." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/upload", children: "Add your first job" }) })
    ] })
  ] });
}
export {
  JobsPage as component
};
