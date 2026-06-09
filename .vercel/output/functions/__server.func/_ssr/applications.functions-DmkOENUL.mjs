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
const listApplications_createServerFn_handler = createServerRpc({
  id: "1e9e3b335f696f04224ab187fa3131a6d38970d9a29a8de98e16b829548176a3",
  name: "listApplications",
  filename: "src/lib/applications.functions.ts"
}, (opts) => listApplications.__executeServer(opts));
const listApplications = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(listApplications_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase
  } = context;
  const {
    data,
    error
  } = await supabase.from("job_applications").select("id, job_id, status, match_score, match_breakdown, submitted_at, created_at, updated_at").order("updated_at", {
    ascending: false
  }).limit(200);
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((a) => a.job_id).filter(Boolean);
  if (ids.length === 0) return [];
  const {
    data: jobs
  } = await supabase.from("jobs").select("id, title, company, location, remote, source_url").in("id", ids);
  const jobMap = new Map((jobs ?? []).map((j) => [j.id, j]));
  return (data ?? []).map((a) => ({
    ...a,
    job: jobMap.get(a.job_id) ?? null
  }));
});
const getApplication_createServerFn_handler = createServerRpc({
  id: "8eeb7b9d8c0eae6b88e01fad3d05a5cc8b2c57ddd4ac41e3e3d7510463e66e3b",
  name: "getApplication",
  filename: "src/lib/applications.functions.ts"
}, (opts) => getApplication.__executeServer(opts));
const getApplication = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid()
}).parse(input)).handler(getApplication_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase
  } = context;
  const {
    data: app,
    error
  } = await supabase.from("job_applications").select("*").eq("id", data.id).single();
  if (error) throw new Error(error.message);
  const {
    data: job
  } = await supabase.from("jobs").select("*").eq("id", app.job_id).single();
  return {
    application: app,
    job
  };
});
const getApplicationForJob_createServerFn_handler = createServerRpc({
  id: "8176261e07e3ac98995faae6ec3144ffb8b6e40cdef22e8e651ab0c3c453d8df",
  name: "getApplicationForJob",
  filename: "src/lib/applications.functions.ts"
}, (opts) => getApplicationForJob.__executeServer(opts));
const getApplicationForJob = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  job_id: stringType().uuid()
}).parse(input)).handler(getApplicationForJob_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: app
  } = await supabase.from("job_applications").select("*").eq("user_id", userId).eq("job_id", data.job_id).maybeSingle();
  return app;
});
const statusEnum = enumType(["saved", "drafting", "ready_to_apply", "submitted", "interview", "offer", "rejected", "withdrawn"]);
const updateApplicationStatus_createServerFn_handler = createServerRpc({
  id: "8b2d852cc98c70ec99a61c1119c48424001d661eff4ccaaf5dd0b1ccea5d7f57",
  name: "updateApplicationStatus",
  filename: "src/lib/applications.functions.ts"
}, (opts) => updateApplicationStatus.__executeServer(opts));
const updateApplicationStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid(),
  status: statusEnum
}).parse(input)).handler(updateApplicationStatus_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const patch = {
    status: data.status
  };
  if (data.status === "submitted") patch.submitted_at = (/* @__PURE__ */ new Date()).toISOString();
  const {
    error
  } = await supabase.from("job_applications").update(patch).eq("id", data.id);
  if (error) throw new Error(error.message);
  await supabase.from("application_events").insert({
    user_id: userId,
    application_id: data.id,
    event_type: `status_${data.status}`,
    payload: {}
  });
  return {
    ok: true
  };
});
const updateApplicationContent_createServerFn_handler = createServerRpc({
  id: "23b688b44de4177df4b9f4716c410814ed4d5b5b5dad74361c8742c1087bf984",
  name: "updateApplicationContent",
  filename: "src/lib/applications.functions.ts"
}, (opts) => updateApplicationContent.__executeServer(opts));
const updateApplicationContent = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid(),
  tailored_resume: stringType().max(1e5).optional(),
  cover_letter: stringType().max(5e4).optional(),
  notes: stringType().max(1e4).optional()
}).parse(input)).handler(updateApplicationContent_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase
  } = context;
  const patch = {};
  if (data.tailored_resume !== void 0) patch.tailored_resume = data.tailored_resume;
  if (data.cover_letter !== void 0) patch.cover_letter = data.cover_letter;
  if (data.notes !== void 0) patch.notes = data.notes;
  if (Object.keys(patch).length === 0) return {
    ok: true
  };
  const {
    error
  } = await supabase.from("job_applications").update(patch).eq("id", data.id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const listReviewQueue_createServerFn_handler = createServerRpc({
  id: "3ef7d8336e9731f3be3b89a712f7bd259c8a3f5c9a31a861788ee07efde7c522",
  name: "listReviewQueue",
  filename: "src/lib/applications.functions.ts"
}, (opts) => listReviewQueue.__executeServer(opts));
const listReviewQueue = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(listReviewQueue_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase
  } = context;
  const {
    data,
    error
  } = await supabase.from("review_queue").select("*").order("created_at", {
    ascending: false
  }).limit(100);
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const appIds = Array.from(new Set(rows.map((r) => r.application_id).filter(Boolean)));
  if (appIds.length === 0) {
    return rows.map((r) => ({
      ...r,
      application: null,
      job: null
    }));
  }
  const {
    data: apps
  } = await supabase.from("job_applications").select("id, job_id, status, match_score, answers").in("id", appIds);
  const appMap = new Map((apps ?? []).map((a) => [a.id, a]));
  const jobIds = Array.from(new Set((apps ?? []).map((a) => a.job_id).filter(Boolean)));
  const {
    data: jobs
  } = jobIds.length ? await supabase.from("jobs").select("id, title, company, location, remote, source_url").in("id", jobIds) : {
    data: []
  };
  const jobMap = new Map((jobs ?? []).map((j) => [j.id, j]));
  return rows.map((r) => {
    const app = r.application_id ? appMap.get(r.application_id) ?? null : null;
    const job = app?.job_id ? jobMap.get(app.job_id) ?? null : null;
    return {
      ...r,
      application: app,
      job
    };
  });
});
const decideReview_createServerFn_handler = createServerRpc({
  id: "925d6f20f4116bb43fc05bdd97894c4b9fc40c4021d2ff8ca736aeef71f639a7",
  name: "decideReview",
  filename: "src/lib/applications.functions.ts"
}, (opts) => decideReview.__executeServer(opts));
const decideReview = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid(),
  decision: enumType(["approved", "rejected"]),
  notes: stringType().max(2e3).optional()
}).parse(input)).handler(decideReview_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    error
  } = await supabase.from("review_queue").update({
    status: data.decision,
    decided_at: (/* @__PURE__ */ new Date()).toISOString(),
    decided_by: userId,
    decision_notes: data.notes ?? null
  }).eq("id", data.id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
export {
  decideReview_createServerFn_handler,
  getApplicationForJob_createServerFn_handler,
  getApplication_createServerFn_handler,
  listApplications_createServerFn_handler,
  listReviewQueue_createServerFn_handler,
  updateApplicationContent_createServerFn_handler,
  updateApplicationStatus_createServerFn_handler
};
