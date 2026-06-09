import { c as createSsrRpc } from "./createSsrRpc-ZrE_UFSo.mjs";
import { a as createServerFn } from "./server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C6u9Brrq.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { g as objectType, k as enumType, i as stringType, h as numberType } from "../_libs/zod.mjs";
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
const tailorResume = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  job_id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("2bedff7eed0be97e66af26963ae224726d54d4a347dd9ef45cd5e6ef0d1d080a"));
const generateCoverLetter = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  job_id: stringType().uuid(),
  tone: enumType(["confident", "warm", "formal"]).default("confident")
}).parse(input)).handler(createSsrRpc("f1f540e1de87c3de8204f4f3fc4452e8eb4b1f18ea8e754ca50c092b9330d216"));
const generateAnswer = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  job_id: stringType().uuid(),
  question: stringType().min(3).max(2e3),
  max_words: numberType().int().min(20).max(800).optional()
}).parse(input)).handler(createSsrRpc("d19a487eddacfbec7f4c8538f89eab324875a5c6f0d23e74f9cb61206c545bce"));
export {
  generateAnswer,
  generateCoverLetter,
  tailorResume
};
