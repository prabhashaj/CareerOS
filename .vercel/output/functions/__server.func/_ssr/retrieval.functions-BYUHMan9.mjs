import { c as createSsrRpc } from "./createSsrRpc-ZrE_UFSo.mjs";
import { a as createServerFn } from "./server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C6u9Brrq.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { g as objectType, i as stringType, h as numberType } from "../_libs/zod.mjs";
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
createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  document_id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("60bc63d67da2557155a54c56e049de622992706fc1afc6032348a487a646cb5f"));
const indexJob = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  job_id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("8ab2a590b3b7ba633c11fe9bc3218a03173e193411fe57c1639d53327d3cf6d3"));
createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  query: stringType().min(1).max(8e3),
  match_count: numberType().int().min(1).max(20).default(8),
  min_similarity: numberType().min(0).max(1).default(0.15),
  per_document: numberType().int().min(1).max(10).default(3)
}).parse(input)).handler(createSsrRpc("3e68dde561eaf36e8a569002652d2000d70d8a9fa7d54e5c5a234566e56b1bf1"));
export {
  indexJob
};
