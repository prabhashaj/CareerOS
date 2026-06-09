import { c as createSsrRpc } from "./createSsrRpc-ZrE_UFSo.mjs";
import { a as createServerFn } from "./server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C6u9Brrq.mjs";
import { g as objectType, i as stringType, k as enumType } from "../_libs/zod.mjs";
const listApplications = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("1e9e3b335f696f04224ab187fa3131a6d38970d9a29a8de98e16b829548176a3"));
createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("8eeb7b9d8c0eae6b88e01fad3d05a5cc8b2c57ddd4ac41e3e3d7510463e66e3b"));
const getApplicationForJob = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  job_id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("8176261e07e3ac98995faae6ec3144ffb8b6e40cdef22e8e651ab0c3c453d8df"));
const statusEnum = enumType(["saved", "drafting", "ready_to_apply", "submitted", "interview", "offer", "rejected", "withdrawn"]);
const updateApplicationStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid(),
  status: statusEnum
}).parse(input)).handler(createSsrRpc("8b2d852cc98c70ec99a61c1119c48424001d661eff4ccaaf5dd0b1ccea5d7f57"));
const updateApplicationContent = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid(),
  tailored_resume: stringType().max(1e5).optional(),
  cover_letter: stringType().max(5e4).optional(),
  notes: stringType().max(1e4).optional()
}).parse(input)).handler(createSsrRpc("23b688b44de4177df4b9f4716c410814ed4d5b5b5dad74361c8742c1087bf984"));
const listReviewQueue = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("3ef7d8336e9731f3be3b89a712f7bd259c8a3f5c9a31a861788ee07efde7c522"));
const decideReview = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid(),
  decision: enumType(["approved", "rejected"]),
  notes: stringType().max(2e3).optional()
}).parse(input)).handler(createSsrRpc("925d6f20f4116bb43fc05bdd97894c4b9fc40c4021d2ff8ca736aeef71f639a7"));
export {
  listApplications as a,
  updateApplicationContent as b,
  decideReview as d,
  getApplicationForJob as g,
  listReviewQueue as l,
  updateApplicationStatus as u
};
