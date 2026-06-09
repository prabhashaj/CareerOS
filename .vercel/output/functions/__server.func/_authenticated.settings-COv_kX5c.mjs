import { r as reactExports, j as jsxRuntimeExports } from "./_libs/react.mjs";
import { u as useQueryClient, a as useQuery } from "./_libs/tanstack__react-query.mjs";
import { u as useServerFn } from "./_ssr/useServerFn-DL2oePlL.mjs";
import { t as toast } from "./_libs/sonner.mjs";
import { c as createSsrRpc } from "./_ssr/createSsrRpc-ZrE_UFSo.mjs";
import { a as createServerFn } from "./_ssr/server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./_ssr/auth-middleware-C6u9Brrq.mjs";
import { B as Button } from "./_ssr/button-DjOZMqFS.mjs";
import { I as Input } from "./_ssr/input-D_U8fI25.mjs";
import { L as Label } from "./_ssr/label-C8WJLhmR.mjs";
import { T as Textarea } from "./_ssr/textarea-F69quoCd.mjs";
import { B as Badge } from "./_ssr/badge-YM7oB01y.mjs";
import "./_libs/seroval.mjs";
import { S as Sparkles, W as WandSparkles, n as Trash2, o as TriangleAlert } from "./_libs/lucide-react.mjs";
import { g as objectType, h as numberType, z as booleanType, i as stringType, j as arrayType, A as literalType, k as enumType } from "./_libs/zod.mjs";
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
const getMyProfile = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("5dbf46616266e7bfe81c82694a91090a42de6200b3efc1b9d156faf41ac3a479"));
const updateMyProfile = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  full_name: stringType().max(200).optional(),
  headline: stringType().max(300).optional(),
  location: stringType().max(200).optional(),
  phone: stringType().max(50).optional(),
  linkedin_url: stringType().url().max(500).optional().or(literalType("")),
  portfolio_url: stringType().url().max(500).optional().or(literalType("")),
  target_roles: arrayType(stringType().max(100)).max(20).optional(),
  target_locations: arrayType(stringType().max(100)).max(20).optional(),
  work_authorization: stringType().max(200).optional(),
  requires_sponsorship: booleanType().optional(),
  min_salary: numberType().int().nonnegative().optional()
}).parse(input)).handler(createSsrRpc("af00eb763dce352dc2f42ef901ef426a138feb40fdc7f79166552837a77fae5f"));
const expandProfile = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  urls: arrayType(stringType().url()).min(1).max(8),
  title: stringType().min(1).max(120).default("Profile enrichment")
}).parse(input)).handler(createSsrRpc("f9e29a34087db992df181049503dcac8fd3c6cdc6c2285fa73657c0a51ef0011"));
const analyzeWritingStyle = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  samples: stringType().min(80).max(4e4)
}).parse(input)).handler(createSsrRpc("5338d6b9abfa7a069fd74e45d68179783053f7a1c3e900169a6e1492876aaf6c"));
const clearWritingStyle = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("c32e556bbcd544a5672e7210ea6de6da53c48087e7a3bc7eaaf7f8939506dd45"));
const resetWorkspace = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  confirm: literalType("RESET"),
  scopes: arrayType(enumType(["jobs", "applications", "documents", "chunks", "review_queue", "events", "profile_extras"])).min(1)
}).parse(input)).handler(createSsrRpc("219c7d168b9edf21559b9f8e09fd26118970dedcf6b2b018d00a5896d272f461"));
function ExpandSection() {
  const expand = useServerFn(expandProfile);
  const [urls, setUrls] = reactExports.useState("");
  const [busy, setBusy] = reactExports.useState(false);
  const [result, setResult] = reactExports.useState(null);
  const run = async () => {
    const list = urls.split(/[\s,]+/).map((u) => u.trim()).filter(Boolean);
    if (list.length === 0) return toast.error("Add at least one URL");
    setBusy(true);
    try {
      const res = await expand({
        data: {
          urls: list,
          title: "Profile enrichment"
        }
      });
      setResult(res);
      toast.success(`Enriched profile · ${res.chunks} chunks indexed`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 max-w-2xl space-y-4 rounded-xl border border-border bg-card p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-medium", children: "Expand profile from the web" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Paste LinkedIn, GitHub, portfolio, Scholar, or personal-site URLs. We'll scrape them, extract a clean knowledge base, and index it so tailoring uses richer context." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 4, value: urls, onChange: (e) => setUrls(e.target.value), placeholder: "https://github.com/you\nhttps://your-portfolio.com\nhttps://scholar.google.com/citations?user=..." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: run, disabled: busy, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "mr-2 h-4 w-4" }),
      " ",
      busy ? "Enriching…" : "Expand profile"
    ] }),
    result && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1 rounded-md border border-border p-3 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-medium", children: [
        "Done — ",
        result.enriched_chars.toLocaleString(),
        " chars, ",
        result.chunks,
        " chunks"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "text-xs text-muted-foreground", children: result.sources.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
        s.ok ? "✓" : "✗",
        " ",
        s.url,
        s.error ? ` — ${s.error}` : ""
      ] }, i)) })
    ] })
  ] });
}
function WritingStyleSection({
  currentStyle
}) {
  const qc = useQueryClient();
  const analyze = useServerFn(analyzeWritingStyle);
  const clear = useServerFn(clearWritingStyle);
  const [samples, setSamples] = reactExports.useState("");
  const [busy, setBusy] = reactExports.useState(false);
  const run = async () => {
    if (samples.trim().length < 80) return toast.error("Paste at least ~80 chars of your writing");
    setBusy(true);
    try {
      await analyze({
        data: {
          samples
        }
      });
      toast.success("Style profile saved — tailoring will now match your voice");
      qc.invalidateQueries({
        queryKey: ["profile"]
      });
      setSamples("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 max-w-2xl space-y-4 rounded-xl border border-border bg-card p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-medium", children: "Writing style" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Paste 2–4 samples of your own writing (cover letters, blog posts, emails). AI extracts a voice profile that steers every tailoring task." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 5, value: samples, onChange: (e) => setSamples(e.target.value), placeholder: "Paste a few paragraphs you wrote in your natural voice…" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: run, disabled: busy, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(WandSparkles, { className: "mr-2 h-4 w-4" }),
        " ",
        busy ? "Analyzing…" : currentStyle ? "Re-analyze" : "Analyze style"
      ] }),
      currentStyle && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: async () => {
        await clear();
        qc.invalidateQueries({
          queryKey: ["profile"]
        });
        toast.success("Writing style cleared");
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-2 h-4 w-4" }),
        " Clear"
      ] })
    ] }),
    currentStyle && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded-md border border-border p-3 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: currentStyle.summary }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1", children: currentStyle.tone.map((t, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: t }, i)) }),
      currentStyle.signature_moves.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Signature moves:" }),
        " ",
        currentStyle.signature_moves.join(" · ")
      ] }),
      currentStyle.avoids.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Avoids:" }),
        " ",
        currentStyle.avoids.join(" · ")
      ] })
    ] })
  ] });
}
const RESET_SCOPES = [{
  key: "jobs",
  label: "Saved jobs"
}, {
  key: "applications",
  label: "Job applications"
}, {
  key: "documents",
  label: "Uploaded documents"
}, {
  key: "chunks",
  label: "Indexed knowledge chunks"
}, {
  key: "review_queue",
  label: "Review queue"
}, {
  key: "events",
  label: "Application events / history"
}, {
  key: "profile_extras",
  label: "Targets & preferences (keeps your identity)"
}];
function DangerZone() {
  const reset = useServerFn(resetWorkspace);
  const qc = useQueryClient();
  const [scopes, setScopes] = reactExports.useState(() => Object.fromEntries(RESET_SCOPES.map((s) => [s.key, false])));
  const [confirm, setConfirm] = reactExports.useState("");
  const [busy, setBusy] = reactExports.useState(false);
  const toggle = (k) => setScopes((s) => ({
    ...s,
    [k]: !s[k]
  }));
  const selected = Object.keys(scopes).filter((k) => scopes[k]);
  const run = async () => {
    if (confirm !== "RESET") return toast.error("Type RESET to confirm");
    if (selected.length === 0) return toast.error("Pick at least one scope");
    setBusy(true);
    try {
      const res = await reset({
        data: {
          confirm: "RESET",
          scopes: selected
        }
      });
      toast.success("Workspace reset");
      qc.invalidateQueries();
      setConfirm("");
      setScopes(Object.fromEntries(RESET_SCOPES.map((s) => [s.key, false])));
      console.info("reset counts", res.counts);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 max-w-2xl space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4 text-destructive" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-medium text-destructive", children: "Danger zone — reset workspace" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Permanently delete the selected data. Your account and profile identity remain. This cannot be undone." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-2 sm:grid-cols-2", children: RESET_SCOPES.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: scopes[s.key], onChange: () => toggle(s.key) }),
      s.label
    ] }, s.key)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "confirm", children: "Type RESET to confirm" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "confirm", value: confirm, onChange: (e) => setConfirm(e.target.value), placeholder: "RESET" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "destructive", onClick: run, disabled: busy || confirm !== "RESET" || selected.length === 0, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-2 h-4 w-4" }),
      " ",
      busy ? "Resetting…" : "Reset selected data"
    ] })
  ] });
}
function SettingsPage() {
  const qc = useQueryClient();
  const get = useServerFn(getMyProfile);
  const update = useServerFn(updateMyProfile);
  const {
    data
  } = useQuery({
    queryKey: ["profile"],
    queryFn: () => get()
  });
  const [form, setForm] = reactExports.useState({
    full_name: "",
    headline: "",
    location: "",
    phone: "",
    linkedin_url: "",
    portfolio_url: "",
    work_authorization: "",
    target_roles_text: "",
    target_locations_text: "",
    min_salary: "",
    requires_sponsorship: false
  });
  reactExports.useEffect(() => {
    if (data) {
      setForm({
        full_name: data.full_name ?? "",
        headline: data.headline ?? "",
        location: data.location ?? "",
        phone: data.phone ?? "",
        linkedin_url: data.linkedin_url ?? "",
        portfolio_url: data.portfolio_url ?? "",
        work_authorization: data.work_authorization ?? "",
        target_roles_text: (data.target_roles ?? []).join(", "),
        target_locations_text: (data.target_locations ?? []).join(", "),
        min_salary: data.min_salary ?? "",
        requires_sponsorship: data.requires_sponsorship ?? false
      });
    }
  }, [data]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await update({
        data: {
          full_name: form.full_name,
          headline: form.headline,
          location: form.location,
          phone: form.phone,
          linkedin_url: form.linkedin_url,
          portfolio_url: form.portfolio_url,
          work_authorization: form.work_authorization,
          target_roles: form.target_roles_text.split(",").map((s) => s.trim()).filter(Boolean),
          target_locations: form.target_locations_text.split(",").map((s) => s.trim()).filter(Boolean),
          min_salary: form.min_salary ? Number(form.min_salary) : void 0,
          requires_sponsorship: form.requires_sponsorship
        }
      });
      toast.success("Profile saved");
      qc.invalidateQueries({
        queryKey: ["profile"]
      });
    } catch (e2) {
      toast.error(e2 instanceof Error ? e2.message : "Failed to save");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-semibold tracking-tight", children: "Settings" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Profile and job preferences power AI matching." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "mt-8 max-w-2xl space-y-4 rounded-xl border border-border bg-card p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "fn", children: "Full name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "fn", value: form.full_name, onChange: (e) => setForm({
            ...form,
            full_name: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "h", children: "Headline" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "h", value: form.headline, onChange: (e) => setForm({
            ...form,
            headline: e.target.value
          }), placeholder: "Senior Frontend Engineer" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "loc", children: "Current location" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "loc", value: form.location, onChange: (e) => setForm({
            ...form,
            location: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "ph", children: "Phone" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "ph", value: form.phone, onChange: (e) => setForm({
            ...form,
            phone: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "li", children: "LinkedIn URL" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "li", type: "url", value: form.linkedin_url, onChange: (e) => setForm({
            ...form,
            linkedin_url: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pf", children: "Portfolio URL" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "pf", type: "url", value: form.portfolio_url, onChange: (e) => setForm({
            ...form,
            portfolio_url: e.target.value
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "roles", children: "Target roles (comma-separated)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "roles", value: form.target_roles_text, onChange: (e) => setForm({
          ...form,
          target_roles_text: e.target.value
        }), placeholder: "Frontend Engineer, Full Stack Engineer" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "locs", children: "Target locations (comma-separated)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "locs", value: form.target_locations_text, onChange: (e) => setForm({
          ...form,
          target_locations_text: e.target.value
        }), placeholder: "Remote, New York, London" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "wa", children: "Work authorization" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "wa", value: form.work_authorization, onChange: (e) => setForm({
            ...form,
            work_authorization: e.target.value
          }), placeholder: "US citizen / EU work permit / etc." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "ms", children: "Minimum salary (annual)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "ms", type: "number", value: form.min_salary, onChange: (e) => setForm({
            ...form,
            min_salary: e.target.value
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: form.requires_sponsorship, onChange: (e) => setForm({
          ...form,
          requires_sponsorship: e.target.checked
        }) }),
        "I require visa sponsorship"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", children: "Save profile" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ExpandSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(WritingStyleSection, { currentStyle: data?.preferences?.writing_style ?? null }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DangerZone, {})
  ] });
}
export {
  SettingsPage as component
};
