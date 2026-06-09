import { c as createServerRpc } from "./createServerRpc-DqGC0bE5.mjs";
import { a as createServerFn } from "./server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C6u9Brrq.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { g as objectType, z as booleanType, i as stringType, k as enumType, j as arrayType } from "../_libs/zod.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:stream";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
const ALLOWED_ACTIONS = ["fill", "select", "check", "click", "upload", "wait"];
const StepSchema = objectType({
  action: stringType().transform((s) => s.toLowerCase().trim()).pipe(enumType(ALLOWED_ACTIONS).catch("fill")),
  selector: stringType().min(1).max(500),
  field_label: stringType().max(200).optional().nullable(),
  value: stringType().max(8e3).optional().nullable(),
  note: stringType().max(500).optional().nullable(),
  required: booleanType().optional().default(false)
});
const PlanSchema = objectType({
  summary: stringType().max(2e3).default(""),
  detected_ats: stringType().max(80).optional().nullable(),
  steps: arrayType(StepSchema).max(60).default([]),
  warnings: arrayType(stringType().max(500)).max(20).default([])
});
async function fetchPageHtml(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "JobPilotAI/1.0 (+https://jobpilot.ai)"
      },
      signal: AbortSignal.timeout(15e3)
    });
    if (!res.ok) return "";
    const html = await res.text();
    return html.slice(0, 4e4);
  } catch {
    return "";
  }
}
const draftAutomationPlan_createServerFn_handler = createServerRpc({
  id: "509d86f3d83fdc12ec47488edc7eb1bb9dd98b7b5fb119bae813b55291605308",
  name: "draftAutomationPlan",
  filename: "src/lib/automation.functions.ts"
}, (opts) => draftAutomationPlan.__executeServer(opts));
const draftAutomationPlan = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  application_id: stringType().uuid()
}).parse(input)).handler(draftAutomationPlan_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    generateObject
  } = await import("../_libs/ai.mjs");
  const {
    getGateway
  } = await import("./ai-gateway.server-B3gvEtJS.mjs");
  const {
    data: app,
    error: appErr
  } = await supabase.from("job_applications").select("*").eq("id", data.application_id).eq("user_id", userId).single();
  if (appErr) throw new Error(appErr.message);
  const {
    data: job,
    error: jobErr
  } = await supabase.from("jobs").select("*").eq("id", app.job_id).single();
  if (jobErr) throw new Error(jobErr.message);
  const {
    data: profile
  } = await supabase.from("profiles").select("*").eq("id", userId).single();
  const html = job.source_url ? await fetchPageHtml(job.source_url) : "";
  const gateway = getGateway();
  const promptBody = `JOB: ${job.title} @ ${job.company}
URL: ${job.source_url ?? "(none)"}

CANDIDATE PROFILE:
${JSON.stringify({
    full_name: profile?.full_name,
    email: profile?.email,
    phone: profile?.phone,
    location: profile?.location,
    linkedin: profile?.linkedin_url,
    portfolio: profile?.portfolio_url,
    work_authorization: profile?.work_authorization,
    requires_sponsorship: profile?.requires_sponsorship
  }, null, 2)}

TAILORED RESUME (markdown, truncated):
${(app.tailored_resume ?? "").slice(0, 4e3)}

COVER LETTER (truncated):
${(app.cover_letter ?? "").slice(0, 3e3)}

STORED ANSWERS:
${JSON.stringify(app.answers ?? {}, null, 2).slice(0, 3e3)}

APPLICATION PAGE HTML (truncated, may be empty if blocked):
${html || "(unavailable — infer from common ATS patterns: Greenhouse, Lever, Workday, Ashby)"}`;
  const system = `You are an expert browser automation planner for job applications.
Produce a deterministic, ordered list of steps a browser agent should execute
to submit the candidate's application. Use the most stable CSS selectors you
can infer from the page HTML (prefer name=, id=, data-test attributes; fall
back to label text matches with [aria-label] or text= heuristics).

REQUIRED vs OPTIONAL fields:
- Set "required": true ONLY for fields the form marks as required (asterisk *,
  aria-required, "required" attribute, "(required)" text, or fields that
  obviously must be filled to submit — name, email, resume upload, work auth).
- Set "required": false (or omit) for nice-to-have fields like "How did you
  hear about us?", referral, pronouns, demographic/EEO questions, optional
  cover-letter text boxes, "anything else you'd like us to know", etc.
- If you don't have reliable source data for an OPTIONAL field, SKIP it
  entirely — do not emit a step. Never guess.
Never invent data — only use values from the candidate profile, tailored
resume, cover letter, and stored answers. If a REQUIRED field has no source
data, emit a warning instead of guessing. Mark sensitive actions (final
Submit click, file uploads) with a clear note.

Respond ONLY with a JSON object matching this shape:
{
  "summary": string,
  "detected_ats": string | null,
  "steps": [{ "action": "fill"|"select"|"check"|"click"|"upload"|"wait",
              "selector": string, "field_label"?: string, "value"?: string,
              "note"?: string, "required"?: boolean }],
  "warnings": string[]
}`;
  let object;
  try {
    const res = await generateObject({
      model: gateway("google/gemini-2.5-flash"),
      schema: PlanSchema,
      system,
      prompt: promptBody
    });
    object = res.object;
  } catch (err) {
    console.error("draftAutomationPlan: primary generateObject failed", err);
    const res = await generateObject({
      model: gateway("google/gemini-2.5-pro"),
      schema: PlanSchema,
      system,
      prompt: promptBody
    });
    object = res.object;
  }
  await supabase.from("job_applications").update({
    status: "drafting"
  }).eq("id", app.id);
  const {
    data: review,
    error: reviewErr
  } = await supabase.from("review_queue").insert({
    user_id: userId,
    application_id: app.id,
    action_type: "auto_fill_form",
    status: "pending",
    title: `Review submission plan for ${job.title} @ ${job.company}`,
    summary: object.summary,
    payload: {
      job_id: job.id,
      source_url: job.source_url,
      detected_ats: object.detected_ats,
      steps: object.steps,
      warnings: object.warnings
    }
  }).select("id").single();
  if (reviewErr) throw new Error(reviewErr.message);
  await supabase.from("application_events").insert({
    user_id: userId,
    application_id: app.id,
    job_id: app.job_id,
    event_type: "automation_plan_drafted",
    payload: {
      review_id: review.id,
      step_count: object.steps.length
    }
  });
  return {
    ok: true,
    plan: object,
    review_id: review.id
  };
});
const confirmSubmission_createServerFn_handler = createServerRpc({
  id: "b2eafea1a293ffbe23e02070d4ffdea7a746809aeeb74d3b7978189b4f5844f6",
  name: "confirmSubmission",
  filename: "src/lib/automation.functions.ts"
}, (opts) => confirmSubmission.__executeServer(opts));
const confirmSubmission = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  application_id: stringType().uuid(),
  external_reference: stringType().max(500).optional(),
  notes: stringType().max(2e3).optional()
}).parse(input)).handler(confirmSubmission_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const {
    error
  } = await supabase.from("job_applications").update({
    status: "submitted",
    submitted_at: now,
    notes: data.notes ?? null
  }).eq("id", data.application_id).eq("user_id", userId);
  if (error) throw new Error(error.message);
  await supabase.from("application_events").insert({
    user_id: userId,
    application_id: data.application_id,
    event_type: "application_submitted",
    payload: {
      external_reference: data.external_reference ?? null
    }
  });
  return {
    ok: true
  };
});
const cancelAutomation_createServerFn_handler = createServerRpc({
  id: "4c2e06485dea779ce3392ef39142f51566adab607c04c658cec264cee3ea1600",
  name: "cancelAutomation",
  filename: "src/lib/automation.functions.ts"
}, (opts) => cancelAutomation.__executeServer(opts));
const cancelAutomation = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  application_id: stringType().uuid(),
  reason: stringType().max(500).optional()
}).parse(input)).handler(cancelAutomation_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    error
  } = await supabase.from("job_applications").update({
    status: "ready_to_apply"
  }).eq("id", data.application_id).eq("user_id", userId);
  if (error) throw new Error(error.message);
  await supabase.from("application_events").insert({
    user_id: userId,
    application_id: data.application_id,
    event_type: "automation_cancelled",
    payload: {
      reason: data.reason ?? null
    }
  });
  return {
    ok: true
  };
});
export {
  cancelAutomation_createServerFn_handler,
  confirmSubmission_createServerFn_handler,
  draftAutomationPlan_createServerFn_handler
};
