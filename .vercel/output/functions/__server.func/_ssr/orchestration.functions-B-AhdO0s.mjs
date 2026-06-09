import { c as createServerRpc } from "./createServerRpc-DqGC0bE5.mjs";
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
const runApplyPipeline_createServerFn_handler = createServerRpc({
  id: "4b0245ea64aa59557a509a17c883ce6db228d217d2e0976abb229b07105beabd",
  name: "runApplyPipeline",
  filename: "src/lib/orchestration.functions.ts"
}, (opts) => runApplyPipeline.__executeServer(opts));
const runApplyPipeline = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  job_id: stringType().uuid()
}).parse(input)).handler(runApplyPipeline_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    indexJob
  } = await import("./retrieval.functions-BYUHMan9.mjs");
  const {
    rankJob
  } = await import("./ranking.functions-C1pVUIEt.mjs");
  const {
    tailorResume,
    generateCoverLetter
  } = await import("./tailoring.functions-DNZs2Uhg.mjs");
  const steps = {};
  try {
    await indexJob({
      data: {
        job_id: data.job_id
      }
    });
    steps.indexed = true;
  } catch (e) {
    steps.indexed = false;
    steps.index_error = e.message;
  }
  const ranking = await rankJob({
    data: {
      job_id: data.job_id,
      persist: true
    }
  });
  steps.score = ranking.score;
  const resume = await tailorResume({
    data: {
      job_id: data.job_id
    }
  });
  steps.resume_length = resume.resume.length;
  const cover = await generateCoverLetter({
    data: {
      job_id: data.job_id,
      tone: "confident"
    }
  });
  steps.cover_letter_length = cover.cover_letter.length;
  const {
    data: app
  } = await supabase.from("job_applications").select("id").eq("user_id", userId).eq("job_id", data.job_id).maybeSingle();
  if (app) {
    await supabase.from("review_queue").insert({
      user_id: userId,
      application_id: app.id,
      action_type: "submit_application",
      status: "pending",
      title: "Review tailored application before submission",
      summary: "AI generated a tailored resume and cover letter. Approve before any browser submission.",
      payload: {
        job_id: data.job_id,
        score: ranking.score
      }
    });
  }
  await supabase.from("application_events").insert({
    user_id: userId,
    job_id: data.job_id,
    event_type: "pipeline_completed",
    payload: steps
  });
  return {
    ok: true,
    steps
  };
});
const applyToTopJobs_createServerFn_handler = createServerRpc({
  id: "dd290c8647d12012d1fbf65822ceb90717b2367355b4abc18b06013d749afc22",
  name: "applyToTopJobs",
  filename: "src/lib/orchestration.functions.ts"
}, (opts) => applyToTopJobs.__executeServer(opts));
const applyToTopJobs = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  count: numberType().int().min(1).max(20).default(5)
}).parse(input)).handler(applyToTopJobs_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: apps
  } = await supabase.from("job_applications").select("job_id, match_score").eq("user_id", userId).order("match_score", {
    ascending: false,
    nullsFirst: false
  }).limit(data.count);
  const jobIds = (apps ?? []).map((a) => a.job_id).filter(Boolean);
  if (jobIds.length === 0) {
    return {
      processed: 0,
      results: [],
      message: "No ranked jobs yet — run 'Rank all' first."
    };
  }
  const {
    rankJob
  } = await import("./ranking.functions-C1pVUIEt.mjs");
  const {
    tailorResume,
    generateCoverLetter
  } = await import("./tailoring.functions-DNZs2Uhg.mjs");
  const results = [];
  for (const job_id of jobIds) {
    try {
      const ranking = await rankJob({
        data: {
          job_id,
          persist: true
        }
      });
      await tailorResume({
        data: {
          job_id
        }
      });
      await generateCoverLetter({
        data: {
          job_id,
          tone: "confident"
        }
      });
      const {
        data: app
      } = await supabase.from("job_applications").select("id").eq("user_id", userId).eq("job_id", job_id).maybeSingle();
      if (app) {
        await supabase.from("review_queue").insert({
          user_id: userId,
          application_id: app.id,
          action_type: "submit_application",
          status: "pending",
          title: "Review tailored application before submission",
          summary: "Apply Agent generated a tailored resume and cover letter.",
          payload: {
            job_id,
            score: ranking.score
          }
        });
      }
      results.push({
        job_id,
        ok: true
      });
    } catch (e) {
      results.push({
        job_id,
        ok: false,
        error: e.message
      });
    }
  }
  return {
    processed: results.length,
    results,
    message: `Queued ${results.filter((r) => r.ok).length}/${results.length} tailored applications for your review.`
  };
});
export {
  applyToTopJobs_createServerFn_handler,
  runApplyPipeline_createServerFn_handler
};
