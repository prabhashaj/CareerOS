import { c as createServerRpc } from "./createServerRpc-DqGC0bE5.mjs";
import { a as createServerFn } from "./server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C6u9Brrq.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { g as objectType, k as enumType, i as stringType, j as arrayType } from "../_libs/zod.mjs";
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
const prepInterview_createServerFn_handler = createServerRpc({
  id: "82af261b5992109314eb96680e7a19b247ce284134c511d57226d5b6c94ecee9",
  name: "prepInterview",
  filename: "src/lib/interview.functions.ts"
}, (opts) => prepInterview.__executeServer(opts));
const prepInterview = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  job_id: stringType().uuid(),
  focus: enumType(["behavioral", "technical", "mixed"]).default("mixed")
}).parse(input)).handler(prepInterview_createServerFn_handler, async ({
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
    retrieveCandidateContext
  } = await import("./candidate-context.server-BNx_PXHO.mjs");
  const {
    INTERVIEW_SYSTEM
  } = await import("./prompts.server-BIZ-_0Sl.mjs");
  const {
    data: job,
    error
  } = await supabase.from("jobs").select("*").eq("id", data.job_id).single();
  if (error) throw new Error(error.message);
  const ctx = await retrieveCandidateContext(supabase, userId, `${job.title} ${job.company} interview behavioral examples`, 14e3);
  const gateway = getGateway();
  const {
    object: output
  } = await generateObject({
    model: gateway("google/gemini-2.5-flash"),
    system: INTERVIEW_SYSTEM,
    prompt: `JOB:
${job.title} at ${job.company}
${(job.description ?? "").slice(0, 4e3)}

FOCUS: ${data.focus}

CANDIDATE CONTEXT:
${ctx}`,
    schema: objectType({
      questions: arrayType(objectType({
        q: stringType(),
        category: stringType(),
        why_asked: stringType()
      })),
      star_stories: arrayType(objectType({
        title: stringType(),
        situation: stringType(),
        task: stringType(),
        action: stringType(),
        result: stringType(),
        covers_questions: arrayType(stringType())
      })),
      questions_to_ask: arrayType(stringType()),
      red_flags_to_address: arrayType(stringType())
    })
  });
  const validCategories = ["behavioral", "technical", "company_fit", "role_specific"];
  const clean = {
    questions: output.questions.slice(0, 10).map((q) => ({
      ...q,
      category: validCategories.includes(q.category) ? q.category : "role_specific"
    })),
    star_stories: output.star_stories.slice(0, 6).map((s) => ({
      ...s,
      covers_questions: s.covers_questions.slice(0, 4)
    })),
    questions_to_ask: output.questions_to_ask.slice(0, 6),
    red_flags_to_address: output.red_flags_to_address.slice(0, 5)
  };
  await supabase.from("application_events").insert({
    user_id: userId,
    job_id: job.id,
    event_type: "interview_prep_generated",
    payload: {
      questions: clean.questions.length,
      stories: clean.star_stories.length
    }
  });
  return clean;
});
export {
  prepInterview_createServerFn_handler
};
