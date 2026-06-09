import { c as createServerRpc } from "./createServerRpc-DqGC0bE5.mjs";
import { a as createServerFn } from "./server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C6u9Brrq.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { g as objectType, z as booleanType, i as stringType, j as arrayType, h as numberType } from "../_libs/zod.mjs";
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
const reviewApplicationDraft_createServerFn_handler = createServerRpc({
  id: "811332b57d5b8a07c9b10f493bec8b16d51c3020dff36e88983be63a9b8d795d",
  name: "reviewApplicationDraft",
  filename: "src/lib/reviewer.functions.ts"
}, (opts) => reviewApplicationDraft.__executeServer(opts));
const reviewApplicationDraft = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  application_id: stringType().uuid(),
  enqueue: booleanType().default(true)
}).parse(input)).handler(reviewApplicationDraft_createServerFn_handler, async ({
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
    REVIEWER_SYSTEM
  } = await import("./prompts.server-BIZ-_0Sl.mjs");
  const {
    data: app,
    error
  } = await supabase.from("job_applications").select("id, job_id, tailored_resume, cover_letter, match_score").eq("id", data.application_id).eq("user_id", userId).single();
  if (error) throw new Error(error.message);
  if (!app.tailored_resume && !app.cover_letter) throw new Error("Nothing to review yet — generate a resume or cover letter first.");
  const {
    data: job
  } = await supabase.from("jobs").select("title, company, description, skills, requirements").eq("id", app.job_id).single();
  const prompt = `JOB:
Title: ${job?.title}
Company: ${job?.company}
Skills: ${(job?.skills ?? []).join(", ")}
Requirements:
- ${(job?.requirements ?? []).join("\n- ")}
Description:
${(job?.description ?? "").slice(0, 4e3)}

RESUME DRAFT:
${app.tailored_resume ?? "(none)"}

COVER LETTER DRAFT:
${app.cover_letter ?? "(none)"}

Critique strictly. Return JSON only.`;
  const gateway = getGateway();
  const {
    object: output
  } = await generateObject({
    model: gateway("google/gemini-2.5-flash"),
    system: REVIEWER_SYSTEM,
    prompt,
    schema: objectType({
      overall_score: numberType(),
      resume_score: numberType().nullable(),
      cover_score: numberType().nullable(),
      summary: stringType(),
      strengths: arrayType(stringType()),
      issues: arrayType(objectType({
        severity: stringType(),
        area: stringType(),
        message: stringType(),
        suggested_fix: stringType().optional()
      })),
      rewrite_suggestions: arrayType(objectType({
        target: stringType(),
        before: stringType().optional(),
        after: stringType(),
        reason: stringType()
      }))
    })
  });
  const clampScore = (n) => n == null ? null : Math.max(0, Math.min(100, Math.round(n)));
  const review = {
    overall_score: clampScore(output.overall_score) ?? 0,
    resume_score: clampScore(output.resume_score),
    cover_score: clampScore(output.cover_score),
    summary: output.summary,
    strengths: output.strengths.slice(0, 8),
    issues: output.issues.slice(0, 15).map((issue) => ({
      ...issue,
      severity: ["low", "med", "high"].includes(issue.severity) ? issue.severity : "med"
    })),
    rewrite_suggestions: output.rewrite_suggestions.slice(0, 8).map((suggestion) => ({
      ...suggestion,
      target: suggestion.target === "cover_letter" ? "cover_letter" : "resume"
    }))
  };
  let review_id = null;
  if (data.enqueue) {
    const {
      data: rq
    } = await supabase.from("review_queue").insert({
      user_id: userId,
      application_id: app.id,
      action_type: "submit_application",
      status: "pending",
      title: `Reviewer pass: ${job?.title ?? "application"} @ ${job?.company ?? ""}`.trim(),
      summary: review.summary,
      payload: {
        review
      }
    }).select("id").single();
    review_id = rq?.id ?? null;
  }
  await supabase.from("application_events").insert({
    user_id: userId,
    job_id: app.job_id,
    application_id: app.id,
    event_type: "application_reviewed",
    payload: {
      overall_score: review.overall_score,
      issues: review.issues.length
    }
  });
  return {
    review,
    review_id
  };
});
export {
  reviewApplicationDraft_createServerFn_handler
};
