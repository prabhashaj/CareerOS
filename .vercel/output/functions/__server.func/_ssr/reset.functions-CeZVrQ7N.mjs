import { c as createServerRpc } from "./createServerRpc-DqGC0bE5.mjs";
import { a as createServerFn } from "./server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C6u9Brrq.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { g as objectType, j as arrayType, k as enumType, A as literalType } from "../_libs/zod.mjs";
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
const resetWorkspace_createServerFn_handler = createServerRpc({
  id: "219c7d168b9edf21559b9f8e09fd26118970dedcf6b2b018d00a5896d272f461",
  name: "resetWorkspace",
  filename: "src/lib/reset.functions.ts"
}, (opts) => resetWorkspace.__executeServer(opts));
const resetWorkspace = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  confirm: literalType("RESET"),
  scopes: arrayType(enumType(["jobs", "applications", "documents", "chunks", "review_queue", "events", "profile_extras"])).min(1)
}).parse(input)).handler(resetWorkspace_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const counts = {};
  const wipe = async (table) => {
    const {
      count,
      error
    } = await supabase.from(table).delete({
      count: "exact"
    }).eq("user_id", userId);
    if (error) throw new Error(`${table}: ${error.message}`);
    counts[table] = count ?? 0;
  };
  if (data.scopes.includes("events")) await wipe("application_events");
  if (data.scopes.includes("review_queue")) await wipe("review_queue");
  if (data.scopes.includes("applications")) await wipe("job_applications");
  if (data.scopes.includes("chunks")) await wipe("document_chunks");
  if (data.scopes.includes("documents")) await wipe("documents");
  if (data.scopes.includes("jobs")) await wipe("jobs");
  if (data.scopes.includes("profile_extras")) {
    await supabase.from("profiles").update({
      preferences: {},
      target_roles: [],
      target_locations: []
    }).eq("id", userId);
    counts.profile_extras = 1;
  }
  return {
    ok: true,
    counts
  };
});
export {
  resetWorkspace_createServerFn_handler
};
