import { c as createSsrRpc } from "./createSsrRpc-ZrE_UFSo.mjs";
import { a as createServerFn } from "./server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C6u9Brrq.mjs";
import { g as objectType, i as stringType, z as booleanType, h as numberType, k as enumType } from "../_libs/zod.mjs";
const listDocuments = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("7bbe916d0c0b14b33e289192f7ab12893c0b8286759f1948b274b5c959369258"));
const createDocument = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  title: stringType().min(1).max(200),
  kind: enumType(["resume", "knowledge_base", "cover_letter", "other"]),
  storage_path: stringType().optional(),
  mime_type: stringType().optional(),
  size_bytes: numberType().int().nonnegative().optional(),
  extracted_text: stringType().max(2e5).optional(),
  is_primary: booleanType().optional()
}).parse(input)).handler(createSsrRpc("076f0d27c3d7b1fba7365afd1647231a0b13d6f0dd851a947be0c6d6c54fdc74"));
const deleteDocument = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("3aa19b2f79082c5ff1f5628e9f17c9b708bb5ffaa61831d8c1a2062fe799a8a2"));
const getDocument = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("1697f68c362f0f7295091ed4dfd426e28abdf8975e9ae613689d562bea4cd6c8"));
const downloadDocument = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("b747631a2578ddab2e0b51768b36dfc717c0fb527a2936a31201899f240b0ecb"));
export {
  downloadDocument as a,
  createDocument as c,
  deleteDocument as d,
  getDocument as g,
  listDocuments as l
};
