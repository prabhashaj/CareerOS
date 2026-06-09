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
const analyzeWritingStyle_createServerFn_handler = createServerRpc({
  id: "5338d6b9abfa7a069fd74e45d68179783053f7a1c3e900169a6e1492876aaf6c",
  name: "analyzeWritingStyle",
  filename: "src/lib/style.functions.ts"
}, (opts) => analyzeWritingStyle.__executeServer(opts));
const analyzeWritingStyle = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  samples: stringType().min(80).max(4e4)
}).parse(input)).handler(analyzeWritingStyle_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    generateText,
    Output
  } = await import("../_libs/ai.mjs");
  const {
    getGateway
  } = await import("./ai-gateway.server-B3gvEtJS.mjs");
  const {
    STYLE_ANALYZE_SYSTEM
  } = await import("./prompts.server-BIZ-_0Sl.mjs");
  const gateway = getGateway();
  const {
    output
  } = await generateText({
    model: gateway("google/gemini-2.5-flash"),
    system: STYLE_ANALYZE_SYSTEM,
    prompt: data.samples,
    output: Output.object({
      schema: objectType({
        tone: arrayType(stringType()).max(6),
        perspective: stringType(),
        sentence_length: stringType(),
        vocabulary: stringType(),
        signature_moves: arrayType(stringType()).max(8),
        avoids: arrayType(stringType()).max(8),
        formatting_habits: arrayType(stringType()).max(6),
        summary: stringType()
      })
    })
  });
  const {
    data: profile
  } = await supabase.from("profiles").select("preferences").eq("id", userId).single();
  const prefs = profile?.preferences ?? {};
  prefs.writing_style = output;
  await supabase.from("profiles").update({
    preferences: prefs
  }).eq("id", userId);
  return {
    style: output
  };
});
const clearWritingStyle_createServerFn_handler = createServerRpc({
  id: "c32e556bbcd544a5672e7210ea6de6da53c48087e7a3bc7eaaf7f8939506dd45",
  name: "clearWritingStyle",
  filename: "src/lib/style.functions.ts"
}, (opts) => clearWritingStyle.__executeServer(opts));
const clearWritingStyle = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(clearWritingStyle_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: profile
  } = await supabase.from("profiles").select("preferences").eq("id", userId).single();
  const prefs = profile?.preferences ?? {};
  delete prefs.writing_style;
  await supabase.from("profiles").update({
    preferences: prefs
  }).eq("id", userId);
  return {
    ok: true
  };
});
export {
  analyzeWritingStyle_createServerFn_handler,
  clearWritingStyle_createServerFn_handler
};
