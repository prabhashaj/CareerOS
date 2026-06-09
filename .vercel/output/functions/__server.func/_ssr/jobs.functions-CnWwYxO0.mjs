import { c as createSsrRpc } from "./createSsrRpc-ZrE_UFSo.mjs";
import { a as createServerFn } from "./server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C6u9Brrq.mjs";
import { g as objectType, i as stringType, k as enumType, h as numberType, j as arrayType, z as booleanType } from "../_libs/zod.mjs";
const employmentType = enumType(["full_time", "part_time", "contract", "internship", "temporary"]);
const listJobs = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("0f6b44b459f0f5a7154aecdbd6de5f39fc93825d0d32caf19f26936089e5a107"));
const getJob = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("432b934c493a65b20930541aa425464f2c52d0a8716794775211fc250ec5a8e5"));
createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  title: stringType().min(1).max(200),
  company: stringType().min(1).max(200),
  location: stringType().max(200).optional(),
  remote: booleanType().optional(),
  employment_type: employmentType.optional(),
  source_url: stringType().url().max(2e3).optional(),
  description: stringType().max(5e4).optional(),
  requirements: arrayType(stringType().max(500)).max(50).optional(),
  skills: arrayType(stringType().max(100)).max(50).optional(),
  salary_min: numberType().int().nonnegative().optional(),
  salary_max: numberType().int().nonnegative().optional()
}).parse(input)).handler(createSsrRpc("ab0e7c09b47d7ada2f8e5674d2a34621a0be302c11db7c58ae029c8e93152a4c"));
const ingestJobFromUrl = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  url: stringType().url().max(2e3).optional(),
  rawText: stringType().max(5e4).optional()
}).refine((v) => !!(v.url || v.rawText), {
  message: "Provide a URL or paste the job description."
}).parse(input)).handler(createSsrRpc("0f48f63a16bd9a3856b3e79fbdc4867b20aaa2fb8c6db0c89be1c1971f16e886"));
const deleteJob = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("0b6eaaf0affa05d8406d489ac99eda00e3421778cab940e69680df0823f93f94"));
export {
  deleteJob as d,
  getJob as g,
  ingestJobFromUrl as i,
  listJobs as l
};
