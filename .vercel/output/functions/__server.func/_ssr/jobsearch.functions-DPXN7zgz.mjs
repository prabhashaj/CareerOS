import { c as createSsrRpc } from "./createSsrRpc-ZrE_UFSo.mjs";
import { a as createServerFn } from "./server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C6u9Brrq.mjs";
import { g as objectType, h as numberType, k as enumType, z as booleanType, i as stringType } from "../_libs/zod.mjs";
const searchJobsWeb = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  query: stringType().min(2).max(200).optional(),
  location: stringType().max(100).optional(),
  remoteOnly: booleanType().optional(),
  mode: enumType(["any", "entry_level"]).optional().default("any"),
  limit: numberType().int().min(1).max(100).default(40)
}).parse(input)).handler(createSsrRpc("88a23fd8ea2ce93d18ebdd701a87d4c4decf7b18fd0d26aee8ab06e06474b5f1"));
export {
  searchJobsWeb as s
};
