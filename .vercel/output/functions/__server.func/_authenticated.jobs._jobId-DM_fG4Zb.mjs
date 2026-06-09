import { r as reactExports, j as jsxRuntimeExports } from "./_libs/react.mjs";
import { L as Link } from "./_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery } from "./_libs/tanstack__react-query.mjs";
import { u as useServerFn } from "./_ssr/useServerFn-DL2oePlL.mjs";
import { t as toast } from "./_libs/sonner.mjs";
import { g as getJob } from "./_ssr/jobs.functions-CnWwYxO0.mjs";
import { rankJob } from "./_ssr/ranking.functions-C1pVUIEt.mjs";
import { tailorResume, generateCoverLetter, generateAnswer } from "./_ssr/tailoring.functions-DNZs2Uhg.mjs";
import { c as createSsrRpc } from "./_ssr/createSsrRpc-ZrE_UFSo.mjs";
import { a as createServerFn } from "./_ssr/server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./_ssr/auth-middleware-C6u9Brrq.mjs";
import { g as getApplicationForJob, u as updateApplicationStatus, b as updateApplicationContent } from "./_ssr/applications.functions-D6FXcIIX.mjs";
import { B as Button } from "./_ssr/button-DjOZMqFS.mjs";
import { I as Input } from "./_ssr/input-D_U8fI25.mjs";
import { T as Textarea } from "./_ssr/textarea-F69quoCd.mjs";
import { L as Label } from "./_ssr/label-C8WJLhmR.mjs";
import { B as Badge } from "./_ssr/badge-YM7oB01y.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./_ssr/tabs-DySssl3_.mjs";
import { R as Route$2 } from "./_ssr/router-ClvJc2re.mjs";
import "./_libs/seroval.mjs";
import { a4 as ArrowLeft, E as ExternalLink, S as Sparkles, W as WandSparkles, F as FileText, a5 as MessageSquare, f as ShieldCheck, a0 as GraduationCap, k as Mic, a6 as Brain, a7 as Save, D as Download, a8 as RefreshCw, b as Send } from "./_libs/lucide-react.mjs";
import { g as objectType, i as stringType, z as booleanType, k as enumType, h as numberType } from "./_libs/zod.mjs";
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
import "./_libs/radix-ui__react-slot.mjs";
import "./_libs/radix-ui__react-compose-refs.mjs";
import "./_libs/class-variance-authority.mjs";
import "./_libs/clsx.mjs";
import "./_libs/tailwind-merge.mjs";
import "./_libs/radix-ui__react-label.mjs";
import "./_libs/radix-ui__react-primitive.mjs";
import "./_libs/radix-ui__react-tabs.mjs";
import "./_libs/radix-ui__primitive.mjs";
import "./_libs/radix-ui__react-context.mjs";
import "./_libs/radix-ui__react-roving-focus.mjs";
import "./_libs/radix-ui__react-collection.mjs";
import "./_libs/radix-ui__react-id.mjs";
import "./_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "./_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "./_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "./_libs/radix-ui__react-direction.mjs";
import "./_libs/radix-ui__react-presence.mjs";
import "./_ssr/client-CCMK3uGO.mjs";
import "./_libs/ai.mjs";
import "./_libs/ai-sdk__gateway.mjs";
import "./_libs/ai-sdk__provider-utils.mjs";
import "./_libs/ai-sdk__provider.mjs";
import "./_libs/eventsource-parser.mjs";
import "./_libs/@vercel/oidc.mjs";
import "os";
import "path";
import "fs";
import "./_libs/opentelemetry__api.mjs";
import "./_ssr/ai-gateway.server-B3gvEtJS.mjs";
import "./_libs/ai-sdk__mistral.mjs";
const runApplyPipeline = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  job_id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("4b0245ea64aa59557a509a17c883ce6db228d217d2e0976abb229b07105beabd"));
createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  count: numberType().int().min(1).max(20).default(5)
}).parse(input)).handler(createSsrRpc("dd290c8647d12012d1fbf65822ceb90717b2367355b4abc18b06013d749afc22"));
const reviewApplicationDraft = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  application_id: stringType().uuid(),
  enqueue: booleanType().default(true)
}).parse(input)).handler(createSsrRpc("811332b57d5b8a07c9b10f493bec8b16d51c3020dff36e88983be63a9b8d795d"));
const upskillPlan = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  job_id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("d6f1ff7a9c62b7e29465d826fd20e715cc05210149163e23115112b4ec60bd68"));
const prepInterview = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  job_id: stringType().uuid(),
  focus: enumType(["behavioral", "technical", "mixed"]).default("mixed")
}).parse(input)).handler(createSsrRpc("82af261b5992109314eb96680e7a19b247ce284134c511d57226d5b6c94ecee9"));
const behavioralDrills = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  job_id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("4d5cf242359c128d3e6be9c2ef541689853138323c62cc268fef541c202ac144"));
const refineDraft = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  application_id: stringType().uuid(),
  target: enumType(["resume", "cover_letter"]),
  instruction: stringType().min(3).max(2e3)
}).parse(input)).handler(createSsrRpc("393606eba184695eb40436bbb807614c9b6a75144b3c631e359a10cd1740f944"));
function parseInline(line) {
  const out = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let i = 0;
  let m;
  while (m = re.exec(line)) {
    if (m.index > i) out.push({ text: line.slice(i, m.index) });
    if (m[2] != null) out.push({ text: m[2], bold: true });
    else if (m[3] != null) out.push({ text: m[3], italic: true });
    else if (m[4] != null) out.push({ text: m[4], mono: true });
    i = re.lastIndex;
  }
  if (i < line.length) out.push({ text: line.slice(i) });
  return out;
}
function parseMarkdown(src) {
  const blocks = [];
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, "");
    if (line.trim().length === 0) {
      blocks.push({ kind: "space" });
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      blocks.push({ kind: "hr" });
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      blocks.push({ kind: "h", level: h[1].length, runs: parseInline(h[2]) });
      continue;
    }
    const bullet = /^(\s*)[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      blocks.push({ kind: "li", marker: "•", indent: Math.min(bullet[1].length / 2, 3), runs: parseInline(bullet[2]) });
      continue;
    }
    const num = /^(\s*)(\d+)\.\s+(.*)$/.exec(line);
    if (num) {
      blocks.push({ kind: "li", marker: `${num[2]}.`, indent: Math.min(num[1].length / 2, 3), runs: parseInline(num[3]) });
      continue;
    }
    blocks.push({ kind: "p", runs: parseInline(line) });
  }
  return blocks;
}
async function downloadTextAsPdf(opts) {
  let safeFilename = opts.filename.replace(/[\/\\?%*:|"<>]/g, "-").replace(/\s+/g, "_").replace(/__+/g, "_").trim();
  if (!/\.pdf$/i.test(safeFilename)) {
    safeFilename += ".pdf";
  }
  if (!safeFilename || safeFilename === ".pdf") {
    safeFilename = "document.pdf";
  }
  const { jsPDF } = await import("./_libs/jspdf.mjs").then(function(n) {
    return n.j;
  });
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 54;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;
  const ensureSpace = (h) => {
    if (y + h > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };
  const setFontFor = (run, base = "normal") => {
    const family = run.mono ? "courier" : "helvetica";
    let weight = base;
    if (run.bold && run.italic) weight = "bolditalic";
    else if (run.bold || base === "bold") weight = "bold";
    else if (run.italic) weight = "italic";
    doc.setFont(family, weight);
  };
  const drawRuns = (runs, x, width, lineHeight, baseBold = false) => {
    const tokens = [];
    for (const r of runs) {
      const parts = r.text.split(/(\s+)/);
      for (const w of parts) if (w.length > 0) tokens.push({ run: r, word: w });
    }
    let cursor = x;
    const right = x + width;
    for (const { run, word } of tokens) {
      setFontFor(run, baseBold ? "bold" : "normal");
      const w = doc.getTextWidth(word);
      if (cursor + w > right && !/^\s+$/.test(word)) {
        y += lineHeight;
        ensureSpace(lineHeight);
        cursor = x;
        if (/^\s+$/.test(word)) continue;
      }
      doc.text(word, cursor, y);
      cursor += w;
    }
    y += lineHeight;
  };
  if (opts.title) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    const lines = doc.splitTextToSize(opts.title, maxWidth);
    for (const ln of lines) {
      ensureSpace(22);
      doc.text(ln, margin, y);
      y += 22;
    }
    y += 6;
  }
  const blocks = parseMarkdown(opts.body);
  for (const b of blocks) {
    if (b.kind === "space") {
      y += 6;
      continue;
    }
    if (b.kind === "hr") {
      ensureSpace(12);
      doc.setDrawColor(180);
      doc.line(margin, y, margin + maxWidth, y);
      y += 10;
      continue;
    }
    if (b.kind === "h") {
      const size = b.level === 1 ? 16 : b.level === 2 ? 13 : 11.5;
      const lh = size + 4;
      y += b.level === 1 ? 6 : 4;
      ensureSpace(lh);
      doc.setFontSize(size);
      drawRuns(b.runs, margin, maxWidth, lh, true);
      doc.setFontSize(10.5);
      continue;
    }
    if (b.kind === "li") {
      const lh = 14;
      const indent = 14 + b.indent * 12;
      ensureSpace(lh);
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "normal");
      doc.text(b.marker, margin + indent - 12, y);
      drawRuns(b.runs, margin + indent, maxWidth - indent, lh);
      continue;
    }
    ensureSpace(14);
    doc.setFontSize(10.5);
    drawRuns(b.runs, margin, maxWidth, 14);
  }
  doc.save(safeFilename);
}
function ScoreBadge({
  score
}) {
  if (score == null) return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: "Not scored" });
  const pct = Math.round(score * 100);
  const variant = pct >= 75 ? "default" : pct >= 50 ? "secondary" : "outline";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant, children: [
    pct,
    "% match"
  ] });
}
function JobDetail() {
  const {
    jobId
  } = Route$2.useParams();
  const qc = useQueryClient();
  const getJobFn = useServerFn(getJob);
  const getAppFn = useServerFn(getApplicationForJob);
  const rank = useServerFn(rankJob);
  const tailor = useServerFn(tailorResume);
  const cover = useServerFn(generateCoverLetter);
  const answerFn = useServerFn(generateAnswer);
  const pipeline = useServerFn(runApplyPipeline);
  const setStatus = useServerFn(updateApplicationStatus);
  const saveContent = useServerFn(updateApplicationContent);
  const reviewFn = useServerFn(reviewApplicationDraft);
  const upskillFn = useServerFn(upskillPlan);
  const interviewFn = useServerFn(prepInterview);
  const behavioralFn = useServerFn(behavioralDrills);
  const refineFn = useServerFn(refineDraft);
  const job = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJobFn({
      data: {
        id: jobId
      }
    })
  });
  const app = useQuery({
    queryKey: ["app-for-job", jobId],
    queryFn: () => getAppFn({
      data: {
        job_id: jobId
      }
    })
  });
  const [busy, setBusy] = reactExports.useState(null);
  const [question, setQuestion] = reactExports.useState("");
  const [resumeDraft, setResumeDraft] = reactExports.useState("");
  const [coverDraft, setCoverDraft] = reactExports.useState("");
  const [resumeRefine, setResumeRefine] = reactExports.useState("");
  const [coverRefine, setCoverRefine] = reactExports.useState("");
  const [review, setReview] = reactExports.useState(null);
  const [upskill, setUpskill] = reactExports.useState(null);
  const [interview, setInterview] = reactExports.useState(null);
  const [behavioral, setBehavioral] = reactExports.useState(null);
  const validTabs = ["overview", "resume", "cover", "answers", "review", "upskill", "interview", "behavioral"];
  const [tab, setTab] = reactExports.useState(() => {
    if (typeof window === "undefined") return "overview";
    const h = window.location.hash.replace("#", "");
    return validTabs.includes(h) ? h : "overview";
  });
  reactExports.useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace("#", "");
      if (validTabs.includes(h)) setTab(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  reactExports.useEffect(() => {
    setResumeDraft(app.data?.tailored_resume ?? "");
    setCoverDraft(app.data?.cover_letter ?? "");
  }, [app.data?.id, app.data?.tailored_resume, app.data?.cover_letter]);
  const invalidate = () => {
    qc.invalidateQueries({
      queryKey: ["app-for-job", jobId]
    });
    qc.invalidateQueries({
      queryKey: ["applications"]
    });
  };
  const run = async (key, fn, ok) => {
    setBusy(key);
    try {
      await fn();
      toast.success(ok);
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };
  if (job.isLoading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-sm text-muted-foreground", children: "Loading…" });
  if (!job.data) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8", children: "Not found." });
  const j = job.data;
  const a = app.data;
  const breakdown = a?.match_breakdown ?? null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/jobs", className: "mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "mr-1 h-4 w-4" }),
      " Back to jobs"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-semibold tracking-tight", children: j.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-muted-foreground", children: [
          j.company,
          j.location ? ` · ${j.location}` : "",
          j.remote ? " · Remote" : ""
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ScoreBadge, { score: a?.match_score ?? null }),
          a?.status && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: a.status }),
          j.source_url && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: j.source_url, target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-1 text-sm text-primary hover:underline", children: [
            "Source ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", disabled: !!busy, onClick: () => run("rank", () => rank({
          data: {
            job_id: jobId,
            persist: true
          }
        }), "Ranked"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "mr-2 h-4 w-4" }),
          " ",
          busy === "rank" ? "Ranking…" : "Rank"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { disabled: !!busy, onClick: () => run("pipeline", () => pipeline({
          data: {
            job_id: jobId
          }
        }), "Application drafted"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(WandSparkles, { className: "mr-2 h-4 w-4" }),
          " ",
          busy === "pipeline" ? "Working…" : "Draft full application"
        ] })
      ] })
    ] }),
    breakdown && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 grid gap-4 md:grid-cols-4", children: ["skills", "semantic", "location", "eligibility"].map((k) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase text-muted-foreground", children: k }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-2xl font-semibold", children: [
        Math.round(breakdown[k] * 100),
        "%"
      ] })
    ] }, k)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: tab, onValueChange: (v) => {
      setTab(v);
      if (typeof window !== "undefined") history.replaceState(null, "", `#${v}`);
    }, className: "mt-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "flex w-full flex-wrap gap-1 h-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "overview", children: "Overview" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "resume", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "mr-1 h-3 w-3" }),
          " Resume"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "cover", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "mr-1 h-3 w-3" }),
          " Cover letter"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "answers", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "mr-1 h-3 w-3" }),
          " Answers"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "review", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "mr-1 h-3 w-3" }),
          " Review"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "upskill", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(GraduationCap, { className: "mr-1 h-3 w-3" }),
          " Upskill"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "interview", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { className: "mr-1 h-3 w-3" }),
          " Interview"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "behavioral", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Brain, { className: "mr-1 h-3 w-3" }),
          " Behavioral"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "overview", className: "mt-4 space-y-4", children: [
        breakdown && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium", children: "AI reasoning" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: breakdown.reasoning }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid gap-3 md:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Matched skills" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 flex flex-wrap gap-1", children: breakdown.matched_skills.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: s }, s)) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Missing skills" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 flex flex-wrap gap-1", children: breakdown.missing_skills.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: s }, s)) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium", children: "Description" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "mt-3 whitespace-pre-wrap text-sm text-muted-foreground", children: j.description ?? "—" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "resume", className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium", children: "Tailored resume" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", disabled: !!busy, onClick: () => run("resume", () => tailor({
              data: {
                job_id: jobId
              }
            }), "Resume tailored"), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "mr-2 h-4 w-4" }),
              " ",
              busy === "resume" ? "Generating…" : a?.tailored_resume ? "Regenerate" : "Generate"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", disabled: !a || !resumeDraft.trim() || resumeDraft === (a?.tailored_resume ?? ""), onClick: () => a && run("save-resume", () => saveContent({
              data: {
                id: a.id,
                tailored_resume: resumeDraft
              }
            }), "Resume saved"), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-2 h-4 w-4" }),
              " ",
              busy === "save-resume" ? "Saving…" : "Save"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", disabled: !resumeDraft.trim(), onClick: () => downloadTextAsPdf({
              filename: `resume-${j.company}-${j.title}.pdf`.replace(/\s+/g, "_"),
              body: resumeDraft
            }), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "mr-2 h-4 w-4" }),
              " PDF"
            ] })
          ] })
        ] }),
        a?.tailored_resume || resumeDraft ? /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { className: "mt-4 min-h-[60vh] font-mono text-sm", value: resumeDraft, onChange: (e) => setResumeDraft(e.target.value), placeholder: "Your tailored resume will appear here. Edit freely before saving or exporting." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "Generate an ATS-friendly resume grounded in your profile and KB, then edit and export." }),
        a?.tailored_resume && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "flex-1 min-w-[240px]", placeholder: "Refine instruction — e.g. shorten to one page, emphasize React leadership", value: resumeRefine, onChange: (e) => setResumeRefine(e.target.value) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", disabled: !!busy || !a || resumeRefine.trim().length < 3, onClick: () => a && run("refine-resume", async () => {
            const r = await refineFn({
              data: {
                application_id: a.id,
                target: "resume",
                instruction: resumeRefine.trim()
              }
            });
            setResumeDraft(r.text);
            setResumeRefine("");
          }, "Resume refined"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
            " ",
            busy === "refine-resume" ? "Refining…" : "Refine"
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "cover", className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium", children: "Cover letter" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", disabled: !!busy, onClick: () => run("cover", () => cover({
              data: {
                job_id: jobId,
                tone: "confident"
              }
            }), "Cover letter ready"), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "mr-2 h-4 w-4" }),
              " ",
              busy === "cover" ? "Generating…" : a?.cover_letter ? "Regenerate" : "Generate"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", disabled: !a || !coverDraft.trim() || coverDraft === (a?.cover_letter ?? ""), onClick: () => a && run("save-cover", () => saveContent({
              data: {
                id: a.id,
                cover_letter: coverDraft
              }
            }), "Cover letter saved"), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-2 h-4 w-4" }),
              " ",
              busy === "save-cover" ? "Saving…" : "Save"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", disabled: !coverDraft.trim(), onClick: () => downloadTextAsPdf({
              filename: `cover-${j.company}-${j.title}.pdf`.replace(/\s+/g, "_"),
              title: `Cover Letter — ${j.title} at ${j.company}`,
              body: coverDraft
            }), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "mr-2 h-4 w-4" }),
              " PDF"
            ] })
          ] })
        ] }),
        a?.cover_letter || coverDraft ? /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { className: "mt-4 min-h-[50vh] font-mono text-sm", value: coverDraft, onChange: (e) => setCoverDraft(e.target.value), placeholder: "Your cover letter will appear here. Edit freely before saving or exporting." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "A concise, grounded letter tailored to this job — fully editable before export." }),
        a?.cover_letter && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "flex-1 min-w-[240px]", placeholder: "Refine instruction — e.g. warmer opener, drop the third paragraph", value: coverRefine, onChange: (e) => setCoverRefine(e.target.value) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", disabled: !!busy || !a || coverRefine.trim().length < 3, onClick: () => a && run("refine-cover", async () => {
            const r = await refineFn({
              data: {
                application_id: a.id,
                target: "cover_letter",
                instruction: coverRefine.trim()
              }
            });
            setCoverDraft(r.text);
            setCoverRefine("");
          }, "Cover letter refined"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
            " ",
            busy === "refine-cover" ? "Refining…" : "Refine"
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "answers", className: "mt-4 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "q", children: "Application question" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { id: "q", rows: 3, className: "mt-1", value: question, onChange: (e) => setQuestion(e.target.value), placeholder: "e.g. Why are you interested in this role?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "mt-3", disabled: !!busy || question.trim().length < 3, onClick: () => run("answer", () => answerFn({
            data: {
              job_id: jobId,
              question: question.trim()
            }
          }), "Answer generated").then(() => setQuestion("")), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "mr-2 h-4 w-4" }),
            " ",
            busy === "answer" ? "Thinking…" : "Generate answer"
          ] })
        ] }),
        a?.answers && Object.keys(a.answers).length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: Object.entries(a.answers).map(([q, ans]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: q }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "mt-2 whitespace-pre-wrap text-sm text-muted-foreground", children: ans })
        ] }, q)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Saved answers will appear here." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "review", className: "mt-4 space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium", children: "Reviewer agent pass" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "A second AI critiques the resume + cover letter and queues it for your approval." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", disabled: !a || !!busy, onClick: () => a && run("review", async () => {
            const res = await reviewFn({
              data: {
                application_id: a.id,
                enqueue: true
              }
            });
            setReview(res.review);
          }, "Review complete"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "mr-2 h-4 w-4" }),
            " ",
            busy === "review" ? "Reviewing…" : review ? "Re-review" : "Run reviewer"
          ] })
        ] }),
        review && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-4 animate-fade-in", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Overall" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-semibold", children: review.overall_score })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Resume" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-semibold", children: review.resume_score ?? "—" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Cover" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-semibold", children: review.cover_score ?? "—" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: review.summary }),
          review.strengths.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Strengths" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-1 list-disc pl-5 text-sm", children: review.strengths.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: s }, i)) })
          ] }),
          review.issues.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Issues" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 space-y-2", children: review.issues.map((iss, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-border p-2 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: iss.severity === "high" ? "destructive" : iss.severity === "med" ? "default" : "outline", children: iss.severity }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: iss.area })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-muted-foreground", children: iss.message }),
              iss.suggested_fix && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Fix:" }),
                " ",
                iss.suggested_fix
              ] })
            ] }, i)) })
          ] }),
          review.rewrite_suggestions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Rewrite suggestions" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 space-y-2", children: review.rewrite_suggestions.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-border p-2 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: r.target }),
              r.before && /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "mt-2 whitespace-pre-wrap text-xs text-muted-foreground line-through", children: r.before }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "mt-1 whitespace-pre-wrap text-xs", children: r.after }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: r.reason })
            ] }, i)) })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "upskill", className: "mt-4 space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium", children: "Skill-gap heatmap & learning plan" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Find what's missing for this role and a focused weekly plan to close it." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", disabled: !!busy, onClick: () => run("upskill", async () => {
            const res = await upskillFn({
              data: {
                job_id: jobId
              }
            });
            setUpskill(res);
          }, "Plan ready"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(GraduationCap, { className: "mr-2 h-4 w-4" }),
            " ",
            busy === "upskill" ? "Analyzing…" : upskill ? "Regenerate" : "Generate plan"
          ] })
        ] }),
        upskill && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-4 animate-fade-in", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: upskill.summary }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Gaps" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 grid gap-2 sm:grid-cols-2", children: upskill.gaps.map((g, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-border p-2 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: g.skill }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: g.severity === "critical" ? "destructive" : g.severity === "important" ? "default" : "outline", children: g.severity })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
                g.current_level,
                " → ",
                g.target_level
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs", children: g.why })
            ] }, i)) })
          ] }),
          upskill.plan.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Weekly plan" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "mt-1 space-y-2", children: upskill.plan.map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "rounded-md border border-border p-2 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-medium", children: [
                "Week ",
                p.week,
                " — ",
                p.focus
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-1 list-disc pl-5 text-xs text-muted-foreground", children: p.actions.map((a2, j2) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: a2 }, j2)) })
            ] }, i)) })
          ] }),
          upskill.resources.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Resources" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-1 space-y-1 text-sm", children: upskill.resources.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "rounded-md border border-border p-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: r.kind }),
                r.url ? /* @__PURE__ */ jsxRuntimeExports.jsx("a", { className: "font-medium text-primary hover:underline", href: r.url, target: "_blank", rel: "noreferrer", children: r.title }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: r.title })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: r.why })
            ] }, i)) })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "interview", className: "mt-4 space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium", children: "Interview prep — STAR stories" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Likely questions plus STAR-format stories grounded in your real experience." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", disabled: !!busy, onClick: () => run("interview", async () => {
            const res = await interviewFn({
              data: {
                job_id: jobId,
                focus: "mixed"
              }
            });
            setInterview(res);
          }, "Prep ready"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { className: "mr-2 h-4 w-4" }),
            " ",
            busy === "interview" ? "Preparing…" : interview ? "Regenerate" : "Generate prep"
          ] })
        ] }),
        interview && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-4 animate-fade-in", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Likely questions" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-1 space-y-1 text-sm", children: interview.questions.map((q, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "rounded-md border border-border p-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: q.category }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: q.q })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: q.why_asked })
            ] }, i)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "STAR stories" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 space-y-2", children: interview.star_stories.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-border p-3 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: s.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "S:" }),
                " ",
                s.situation
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "T:" }),
                " ",
                s.task
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "A:" }),
                " ",
                s.action
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "R:" }),
                " ",
                s.result
              ] }),
              s.covers_questions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 flex flex-wrap gap-1", children: s.covers_questions.map((q, j2) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-[10px]", children: q }, j2)) })
            ] }, i)) })
          ] }),
          interview.questions_to_ask.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Smart questions to ask them" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-1 list-disc pl-5 text-sm", children: interview.questions_to_ask.map((q, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: q }, i)) })
          ] }),
          interview.red_flags_to_address.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Address proactively" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-1 list-disc pl-5 text-sm", children: interview.red_flags_to_address.map((q, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: q }, i)) })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "behavioral", className: "mt-4 space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium", children: "Behavioral drills" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Predicted prompts, what they're probing for, and a model STAR answer from your real experience." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", disabled: !!busy, onClick: () => run("behavioral", async () => {
            const res = await behavioralFn({
              data: {
                job_id: jobId
              }
            });
            setBehavioral(res);
          }, "Drills ready"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Brain, { className: "mr-2 h-4 w-4" }),
            " ",
            busy === "behavioral" ? "Building…" : behavioral ? "Regenerate" : "Generate drills"
          ] })
        ] }),
        behavioral && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-3 animate-fade-in", children: [
          behavioral.drills.map((d, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-border p-3 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: d.prompt }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
              "Probing for: ",
              d.probing_for
            ] }),
            d.common_failures.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Common failures:" }),
              " ",
              d.common_failures.join(" · ")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 rounded-md bg-muted/40 p-2 text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "S:" }),
                " ",
                d.model_answer.situation
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "T:" }),
                " ",
                d.model_answer.task
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "A:" }),
                " ",
                d.model_answer.action
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "R:" }),
                " ",
                d.model_answer.result
              ] })
            ] }),
            d.follow_ups.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Likely follow-ups:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "ml-4 list-disc", children: d.follow_ups.map((f, j2) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: f }, j2)) })
            ] })
          ] }, i)),
          behavioral.coaching_notes.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Coaching notes" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-1 list-disc pl-5 text-sm", children: behavioral.coaching_notes.map((n, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: n }, i)) })
          ] })
        ] })
      ] }) })
    ] }),
    a && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 space-y-3 rounded-xl border border-border bg-card p-5", children: [
      j.source_url && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-lg bg-primary/5 p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: "Apply on the company site" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Open the original posting in a new tab and apply with your tailored resume and cover letter." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: j.source_url, target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90", children: [
          "Open posting ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-4 w-4" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mr-2 text-sm text-muted-foreground", children: "Status:" }),
        ["saved", "drafting", "ready_to_apply", "submitted", "interview", "offer", "rejected"].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: a.status === s ? "default" : "outline", onClick: () => run(`status-${s}`, () => setStatus({
          data: {
            id: a.id,
            status: s
          }
        }), "Status updated"), children: s.replace("_", " ") }, s))
      ] })
    ] })
  ] });
}
export {
  JobDetail as component
};
