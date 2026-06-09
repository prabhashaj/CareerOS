import { c as createServerRpc } from "./createServerRpc-DqGC0bE5.mjs";
import { a as createServerFn } from "./server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C6u9Brrq.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { g as objectType, i as stringType, j as arrayType } from "../_libs/zod.mjs";
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
const behavioralDrills_createServerFn_handler = createServerRpc({
  id: "4d5cf242359c128d3e6be9c2ef541689853138323c62cc268fef541c202ac144",
  name: "behavioralDrills",
  filename: "src/lib/behavioral.functions.ts"
}, (opts) => behavioralDrills.__executeServer(opts));
const behavioralDrills = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  job_id: stringType().uuid()
}).parse(input)).handler(behavioralDrills_createServerFn_handler, async ({
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
    BEHAVIORAL_SYSTEM
  } = await import("./prompts.server-BIZ-_0Sl.mjs");
  const {
    data: job,
    error
  } = await supabase.from("jobs").select("*").eq("id", data.job_id).single();
  if (error) throw new Error(error.message);
  const ctx = await retrieveCandidateContext(supabase, userId, `${job.title} behavioral leadership conflict ownership impact`, 14e3);
  const gateway = getGateway();
  const {
    object: output
  } = await generateObject({
    model: gateway("google/gemini-2.5-flash"),
    system: BEHAVIORAL_SYSTEM,
    prompt: `JOB:
${job.title} at ${job.company}
${(job.description ?? "").slice(0, 3500)}

CANDIDATE CONTEXT:
${ctx}`,
    schema: objectType({
      drills: arrayType(objectType({
        prompt: stringType(),
        probing_for: stringType(),
        common_failures: arrayType(stringType()).max(4),
        model_answer: objectType({
          situation: stringType(),
          task: stringType(),
          action: stringType(),
          result: stringType()
        }),
        follow_ups: arrayType(stringType())
      })),
      coaching_notes: arrayType(stringType())
    })
  });
  const clean = {
    drills: output.drills.slice(0, 8).map((d) => ({
      ...d,
      common_failures: d.common_failures.slice(0, 4),
      follow_ups: d.follow_ups.slice(0, 4)
    })),
    coaching_notes: output.coaching_notes.slice(0, 6)
  };
  await supabase.from("application_events").insert({
    user_id: userId,
    job_id: job.id,
    event_type: "behavioral_drills_generated",
    payload: {
      drills: clean.drills.length
    }
  });
  return clean;
});
export {
  behavioralDrills_createServerFn_handler
};
