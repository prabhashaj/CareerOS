import { c as createServerRpc } from "./createServerRpc-DqGC0bE5.mjs";
import { a as createServerFn } from "./server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C6u9Brrq.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { g as objectType, h as numberType, z as booleanType, i as stringType, j as arrayType, A as literalType } from "../_libs/zod.mjs";
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
const getMyProfile_createServerFn_handler = createServerRpc({
  id: "5dbf46616266e7bfe81c82694a91090a42de6200b3efc1b9d156faf41ac3a479",
  name: "getMyProfile",
  filename: "src/lib/profile.functions.ts"
}, (opts) => getMyProfile.__executeServer(opts));
const getMyProfile = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getMyProfile_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data,
    error
  } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
});
const updateMyProfile_createServerFn_handler = createServerRpc({
  id: "af00eb763dce352dc2f42ef901ef426a138feb40fdc7f79166552837a77fae5f",
  name: "updateMyProfile",
  filename: "src/lib/profile.functions.ts"
}, (opts) => updateMyProfile.__executeServer(opts));
const updateMyProfile = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  full_name: stringType().max(200).optional(),
  headline: stringType().max(300).optional(),
  location: stringType().max(200).optional(),
  phone: stringType().max(50).optional(),
  linkedin_url: stringType().url().max(500).optional().or(literalType("")),
  portfolio_url: stringType().url().max(500).optional().or(literalType("")),
  target_roles: arrayType(stringType().max(100)).max(20).optional(),
  target_locations: arrayType(stringType().max(100)).max(20).optional(),
  work_authorization: stringType().max(200).optional(),
  requires_sponsorship: booleanType().optional(),
  min_salary: numberType().int().nonnegative().optional()
}).parse(input)).handler(updateMyProfile_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: row,
    error
  } = await supabase.from("profiles").update(data).eq("id", userId).select().single();
  if (error) throw new Error(error.message);
  return row;
});
export {
  getMyProfile_createServerFn_handler,
  updateMyProfile_createServerFn_handler
};
