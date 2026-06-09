import { j as jsxRuntimeExports, r as reactExports } from "./_libs/react.mjs";
import { u as useQueryClient } from "./_libs/tanstack__react-query.mjs";
import { u as useServerFn } from "./_ssr/useServerFn-DL2oePlL.mjs";
import { t as toast } from "./_libs/sonner.mjs";
import { s as supabase } from "./_ssr/client-CCMK3uGO.mjs";
import { u as useAuth } from "./_ssr/router-ClvJc2re.mjs";
import { c as createDocument } from "./_ssr/documents.functions-CY_Z-ixU.mjs";
import { c as createSsrRpc } from "./_ssr/createSsrRpc-ZrE_UFSo.mjs";
import { a as createServerFn } from "./_ssr/server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./_ssr/auth-middleware-C6u9Brrq.mjs";
import { B as Button } from "./_ssr/button-DjOZMqFS.mjs";
import { I as Input } from "./_ssr/input-D_U8fI25.mjs";
import { L as Label } from "./_ssr/label-C8WJLhmR.mjs";
import { T as Textarea } from "./_ssr/textarea-F69quoCd.mjs";
import { B as Badge } from "./_ssr/badge-YM7oB01y.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./_ssr/tabs-DySssl3_.mjs";
import "./_libs/seroval.mjs";
import { M as MessageCircle, F as FileText, l as Award, G as Github, a as LoaderCircle, S as Sparkles, U as Upload, X, m as Linkedin } from "./_libs/lucide-react.mjs";
import { g as objectType, j as arrayType, i as stringType } from "./_libs/zod.mjs";
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
import "./_libs/supabase__supabase-js.mjs";
import "./_libs/supabase__postgrest-js.mjs";
import "./_libs/supabase__realtime-js.mjs";
import "./_libs/supabase__phoenix.mjs";
import "./_libs/supabase__storage-js.mjs";
import "./_libs/iceberg-js.mjs";
import "./_libs/supabase__auth-js.mjs";
import "tslib";
import "./_libs/supabase__functions-js.mjs";
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
import "node:async_hooks";
import "./_libs/h3-v2.mjs";
import "./_libs/rou3.mjs";
import "./_libs/srvx.mjs";
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
const importProfile = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  github: stringType().max(200).optional(),
  linkedin: stringType().max(500).optional()
}).refine((v) => !!(v.github || v.linkedin), {
  message: "Provide a GitHub or LinkedIn URL."
}).parse(input)).handler(createSsrRpc("830957613f44908f187c8f6dfab3ee897f532826ac1ea82889f3ad23f34fac4b"));
const Turn = objectType({
  question: stringType().max(1e3),
  answer: stringType().max(5e3)
});
const nextUnderstandingQuestion = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  history: arrayType(Turn).max(40).default([])
}).parse(input)).handler(createSsrRpc("40d7cd55085c4973af863a47ae050ad4a2716c1f242b685dd258cd60ef721dd4"));
const saveUnderstanding = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  history: arrayType(Turn).min(1).max(40)
}).parse(input)).handler(createSsrRpc("9e256d631e8cea9a27f8fa10731bb32fc04277b0f8c4de8450b160a1dd3221a5"));
const saveSkillsAndCerts = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  skills: arrayType(stringType().min(1).max(100)).max(80).default([]),
  certifications: arrayType(stringType().min(1).max(200)).max(40).default([]),
  achievements: stringType().max(8e3).optional()
}).refine((v) => v.skills.length || v.certifications.length || v.achievements && v.achievements.trim().length > 10, {
  message: "Add at least one skill, certification, or achievement."
}).parse(input)).handler(createSsrRpc("3e581435ed25a770e4e5fa2c3e68f08aad53ec3e29b97af82f7e372ee23e71c8"));
function UploadPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-semibold tracking-tight", children: "Add content" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "The more we know about you, the better every agent performs — matching, tailoring, interviews, all of it." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "understand", className: "max-w-3xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "flex flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "understand", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "mr-2 h-4 w-4" }),
          " Understand me"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "resume", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "mr-2 h-4 w-4" }),
          " Resume / docs"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "skills", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { className: "mr-2 h-4 w-4" }),
          " Skills & certs"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "profile", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Github, { className: "mr-2 h-4 w-4" }),
          " Import profile"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "understand", children: /* @__PURE__ */ jsxRuntimeExports.jsx(UnderstandMe, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "resume", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResumeUploader, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "skills", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SkillsAndCerts, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "profile", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ProfileImport, {}) })
    ] })
  ] });
}
function UnderstandMe() {
  const qc = useQueryClient();
  const nextQ = useServerFn(nextUnderstandingQuestion);
  const save = useServerFn(saveUnderstanding);
  const [history, setHistory] = reactExports.useState([]);
  const [current, setCurrent] = reactExports.useState(null);
  const [answer, setAnswer] = reactExports.useState("");
  const [busy, setBusy] = reactExports.useState(false);
  const [done, setDone] = reactExports.useState(false);
  const start = async () => {
    setBusy(true);
    try {
      const res = await nextQ({
        data: {
          history: []
        }
      });
      if (res.done) setDone(true);
      else setCurrent(res.question);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start interview");
    } finally {
      setBusy(false);
    }
  };
  const submitAnswer = async () => {
    if (!current || !answer.trim()) return;
    const turn = {
      question: current,
      answer: answer.trim()
    };
    const updated = [...history, turn];
    setHistory(updated);
    setAnswer("");
    setCurrent(null);
    setBusy(true);
    try {
      const res = await nextQ({
        data: {
          history: updated
        }
      });
      if (res.done) setDone(true);
      else setCurrent(res.question);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load next question");
    } finally {
      setBusy(false);
    }
  };
  const finish = async () => {
    setBusy(true);
    try {
      await save({
        data: {
          history
        }
      });
      toast.success("Saved to your knowledge base");
      qc.invalidateQueries({
        queryKey: ["documents"]
      });
      setHistory([]);
      setCurrent(null);
      setDone(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-4 rounded-xl border border-border bg-card p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold", children: "Let the AI get to know you" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "A short guided interview about your skills, projects, goals, and preferences. Answers are saved to your knowledge base and used by every agent — matching, tailoring, interview prep." })
    ] }),
    history.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm", children: history.map((t, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-medium text-foreground", children: [
        "Q: ",
        t.question
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-muted-foreground whitespace-pre-wrap", children: [
        "A: ",
        t.answer
      ] })
    ] }, i)) }),
    !current && !done && history.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: start, disabled: busy, children: [
      busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "mr-2 h-4 w-4" }),
      "Start interview"
    ] }),
    current && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-primary/30 bg-primary/5 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: current }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: answer, onChange: (e) => setAnswer(e.target.value), rows: 4, placeholder: "Your answer…" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: submitAnswer, disabled: busy || !answer.trim(), children: [
          busy && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
          "Next question"
        ] }),
        history.length >= 3 && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: finish, disabled: busy, children: "Finish & save" })
      ] })
    ] }),
    done && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
        "All done — ready to save ",
        history.length,
        " answers to your knowledge base."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: finish, disabled: busy, children: [
        busy && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
        "Save to knowledge base"
      ] })
    ] })
  ] });
}
function ResumeUploader() {
  const {
    user
  } = useAuth();
  const qc = useQueryClient();
  const createDoc = useServerFn(createDocument);
  const [file, setFile] = reactExports.useState(null);
  const [title, setTitle] = reactExports.useState("");
  const [kind, setKind] = reactExports.useState("resume");
  const [extractedText, setExtractedText] = reactExports.useState("");
  const [busy, setBusy] = reactExports.useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      let storagePath;
      let mimeType;
      let sizeBytes;
      if (file) {
        storagePath = `${user.id}/${Date.now()}-${file.name}`;
        const {
          error
        } = await supabase.storage.from("jobpilot-documents").upload(storagePath, file);
        if (error) throw error;
        mimeType = file.type;
        sizeBytes = file.size;
      }
      await createDoc({
        data: {
          title: title || file?.name || "Untitled",
          kind,
          storage_path: storagePath,
          mime_type: mimeType,
          size_bytes: sizeBytes,
          extracted_text: extractedText || void 0,
          is_primary: kind === "resume"
        }
      });
      toast.success("Document saved");
      qc.invalidateQueries({
        queryKey: ["documents"]
      });
      setFile(null);
      setTitle("");
      setExtractedText("");
    } catch (e2) {
      toast.error(e2 instanceof Error ? e2.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "mt-6 space-y-4 rounded-xl border border-border bg-card p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Document type" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: kind, onChange: (e) => setKind(e.target.value), className: "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "resume", children: "Resume" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "knowledge_base", children: "Knowledge base (achievements, projects)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "cover_letter", children: "Cover letter template" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "other", children: "Other" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "title", children: "Title" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "title", value: title, onChange: (e) => setTitle(e.target.value), placeholder: "e.g. Engineering resume 2026" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "file", children: "File (PDF, DOCX, TXT)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "file", type: "file", accept: ".pdf,.docx,.txt,.md", onChange: (e) => setFile(e.target.files?.[0] ?? null) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "text", children: "Or paste text content" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { id: "text", rows: 8, value: extractedText, onChange: (e) => setExtractedText(e.target.value), placeholder: "Paste resume content here so the AI can use it for matching and tailoring…" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "submit", disabled: busy, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "mr-2 h-4 w-4" }),
      " ",
      busy ? "Saving…" : "Save document"
    ] })
  ] });
}
function SkillsAndCerts() {
  const qc = useQueryClient();
  const save = useServerFn(saveSkillsAndCerts);
  const [skills, setSkills] = reactExports.useState([]);
  const [certs, setCerts] = reactExports.useState([]);
  const [skillInput, setSkillInput] = reactExports.useState("");
  const [certInput, setCertInput] = reactExports.useState("");
  const [achievements, setAchievements] = reactExports.useState("");
  const [busy, setBusy] = reactExports.useState(false);
  const addItem = (val, list, set, clear) => {
    const parts = val.split(",").map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const next = Array.from(/* @__PURE__ */ new Set([...list, ...parts]));
    set(next);
    clear();
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await save({
        data: {
          skills,
          certifications: certs,
          achievements: achievements || void 0
        }
      });
      toast.success("Saved to your knowledge base");
      qc.invalidateQueries({
        queryKey: ["documents"]
      });
      setSkills([]);
      setCerts([]);
      setAchievements("");
    } catch (e2) {
      toast.error(e2 instanceof Error ? e2.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "mt-6 space-y-5 rounded-xl border border-border bg-card p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold", children: "Skills & certifications" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "The matcher uses every skill and credential here. Add freely — more is better." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Skills" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: skillInput, onChange: (e) => setSkillInput(e.target.value), onKeyDown: (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addItem(skillInput, skills, setSkills, () => setSkillInput(""));
          }
        }, placeholder: "e.g. Python, React, AWS  (comma-separate or press Enter)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => addItem(skillInput, skills, setSkills, () => setSkillInput("")), children: "Add" })
      ] }),
      skills.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: skills.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", className: "gap-1", children: [
        s,
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setSkills(skills.filter((x) => x !== s)), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" }) })
      ] }, s)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Certifications" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: certInput, onChange: (e) => setCertInput(e.target.value), onKeyDown: (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addItem(certInput, certs, setCerts, () => setCertInput(""));
          }
        }, placeholder: "e.g. AWS Solutions Architect — Associate (2024)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => addItem(certInput, certs, setCerts, () => setCertInput("")), children: "Add" })
      ] }),
      certs.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: certs.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", className: "gap-1", children: [
        c,
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setCerts(certs.filter((x) => x !== c)), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" }) })
      ] }, c)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "ach", children: "Achievements, projects, anything else" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { id: "ach", rows: 6, value: achievements, onChange: (e) => setAchievements(e.target.value), placeholder: "Awards, open-source projects, side projects, languages, publications, hackathon wins…" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: busy || !skills.length && !certs.length && !achievements.trim(), children: busy ? "Saving…" : "Save to knowledge base" })
  ] });
}
function ProfileImport() {
  const qc = useQueryClient();
  const importFn = useServerFn(importProfile);
  const [github, setGithub] = reactExports.useState("");
  const [linkedin, setLinkedin] = reactExports.useState("");
  const [busy, setBusy] = reactExports.useState(false);
  const [preview, setPreview] = reactExports.useState(null);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setPreview(null);
    try {
      const res = await importFn({
        data: {
          github: github.trim() || void 0,
          linkedin: linkedin.trim() || void 0
        }
      });
      toast.success(`Imported: ${res.title}`);
      setPreview(res.preview);
      qc.invalidateQueries({
        queryKey: ["documents"]
      });
      setGithub("");
      setLinkedin("");
    } catch (e2) {
      toast.error(e2 instanceof Error ? e2.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "mt-6 space-y-4 rounded-xl border border-border bg-card p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold", children: "Import from GitHub or LinkedIn" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "We pull your public profile, distill it into a clean knowledge-base entry, and feed it into every match." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: "gh", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Github, { className: "mr-1 inline h-4 w-4" }),
        " GitHub username or URL"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "gh", value: github, onChange: (e) => setGithub(e.target.value), placeholder: "e.g. octocat or https://github.com/octocat" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: "li", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Linkedin, { className: "mr-1 inline h-4 w-4" }),
        " LinkedIn profile URL"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "li", value: linkedin, onChange: (e) => setLinkedin(e.target.value), placeholder: "https://www.linkedin.com/in/yourname" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: 'LinkedIn sometimes blocks scrapers. If import fails, paste your profile text in the Resume / docs tab as "knowledge base".' })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "submit", disabled: busy || !github.trim() && !linkedin.trim(), children: [
      busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "mr-2 h-4 w-4" }),
      busy ? "Importing…" : "Import & save"
    ] }),
    preview && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 rounded-lg border border-border bg-muted/40 p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground", children: "Preview" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("pre", { className: "whitespace-pre-wrap text-sm text-foreground", children: [
        preview,
        "…"
      ] })
    ] })
  ] });
}
export {
  UploadPage as component
};
