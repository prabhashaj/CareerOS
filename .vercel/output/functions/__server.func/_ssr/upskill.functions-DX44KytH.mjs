import { c as createServerRpc } from "./createServerRpc-DqGC0bE5.mjs";
import { a as createServerFn } from "./server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C6u9Brrq.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { g as objectType, i as stringType, j as arrayType, h as numberType } from "../_libs/zod.mjs";
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
const upskillPlan_createServerFn_handler = createServerRpc({
  id: "d6f1ff7a9c62b7e29465d826fd20e715cc05210149163e23115112b4ec60bd68",
  name: "upskillPlan",
  filename: "src/lib/upskill.functions.ts"
}, (opts) => upskillPlan.__executeServer(opts));
const upskillPlan = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  job_id: stringType().uuid()
}).parse(input)).handler(upskillPlan_createServerFn_handler, async ({
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
    loadCandidateText
  } = await import("./candidate-context.server-BNx_PXHO.mjs");
  const {
    UPSKILL_SYSTEM
  } = await import("./prompts.server-BIZ-_0Sl.mjs");
  const {
    data: job,
    error
  } = await supabase.from("jobs").select("*").eq("id", data.job_id).single();
  if (error) throw new Error(error.message);
  const candidateContext = await loadCandidateText(supabase, userId, 12e3);
  const gateway = getGateway();
  const {
    object: output
  } = await generateObject({
    model: gateway("google/gemini-2.5-flash"),
    system: UPSKILL_SYSTEM,
    prompt: `JOB:
${job.title} at ${job.company}
Skills: ${(job.skills ?? []).join(", ")}
Requirements:
- ${(job.requirements ?? []).join("\n- ")}

Description:
${(job.description ?? "").slice(0, 5e3)}

CANDIDATE CONTEXT:
${candidateContext}`,
    schema: objectType({
      summary: stringType(),
      gaps: arrayType(objectType({
        skill: stringType(),
        severity: stringType(),
        current_level: stringType(),
        target_level: stringType(),
        why: stringType()
      })),
      plan: arrayType(objectType({
        week: numberType(),
        focus: stringType(),
        actions: arrayType(stringType())
      })),
      resources: arrayType(objectType({
        title: stringType(),
        kind: stringType(),
        url: stringType().optional(),
        why: stringType()
      }))
    })
  });
  const clean = {
    summary: output.summary,
    gaps: output.gaps.slice(0, 12).map((g) => ({
      ...g,
      severity: ["nice_to_have", "important", "critical"].includes(g.severity) ? g.severity : "important",
      current_level: ["none", "basic", "intermediate", "advanced"].includes(g.current_level) ? g.current_level : "basic",
      target_level: ["basic", "intermediate", "advanced"].includes(g.target_level) ? g.target_level : "intermediate"
    })),
    plan: output.plan.slice(0, 8).map((p, i) => ({
      ...p,
      week: Math.max(1, Math.min(12, Math.round(p.week || i + 1))),
      actions: p.actions.slice(0, 6)
    })),
    resources: output.resources.slice(0, 12).map((r) => ({
      ...r,
      kind: ["course", "doc", "book", "video", "project", "article"].includes(r.kind) ? r.kind : "article"
    }))
  };
  await supabase.from("application_events").insert({
    user_id: userId,
    job_id: job.id,
    event_type: "upskill_plan_generated",
    payload: {
      gaps: clean.gaps.length
    }
  });
  return clean;
});
export {
  upskillPlan_createServerFn_handler
};
