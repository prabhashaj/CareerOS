import { c as createServerRpc } from "./createServerRpc-DqGC0bE5.mjs";
import { a as createServerFn } from "./server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C6u9Brrq.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { g as objectType, i as stringType, k as enumType } from "../_libs/zod.mjs";
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
const refineDraft_createServerFn_handler = createServerRpc({
  id: "393606eba184695eb40436bbb807614c9b6a75144b3c631e359a10cd1740f944",
  name: "refineDraft",
  filename: "src/lib/refine.functions.ts"
}, (opts) => refineDraft.__executeServer(opts));
const refineDraft = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  application_id: stringType().uuid(),
  target: enumType(["resume", "cover_letter"]),
  instruction: stringType().min(3).max(2e3)
}).parse(input)).handler(refineDraft_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    generateText
  } = await import("../_libs/ai.mjs");
  const {
    getGateway
  } = await import("./ai-gateway.server-B3gvEtJS.mjs");
  const {
    REFINE_SYSTEM
  } = await import("./prompts.server-BIZ-_0Sl.mjs");
  const {
    data: app,
    error
  } = await supabase.from("job_applications").select("id, job_id, tailored_resume, cover_letter").eq("id", data.application_id).eq("user_id", userId).single();
  if (error) throw new Error(error.message);
  const current = data.target === "resume" ? app.tailored_resume : app.cover_letter;
  if (!current) throw new Error("Nothing to refine — generate the draft first.");
  const gateway = getGateway();
  const {
    text
  } = await generateText({
    model: gateway("google/gemini-2.5-flash"),
    system: REFINE_SYSTEM,
    prompt: `TARGET: ${data.target}

INSTRUCTION:
${data.instruction}

CURRENT DRAFT:
${current}

Return the revised document only.`
  });
  const patch = data.target === "resume" ? {
    tailored_resume: text
  } : {
    cover_letter: text
  };
  await supabase.from("job_applications").update(patch).eq("id", app.id);
  await supabase.from("application_events").insert({
    user_id: userId,
    job_id: app.job_id,
    application_id: app.id,
    event_type: "draft_refined",
    payload: {
      target: data.target,
      instruction: data.instruction.slice(0, 200)
    }
  });
  return {
    text
  };
});
export {
  refineDraft_createServerFn_handler
};
