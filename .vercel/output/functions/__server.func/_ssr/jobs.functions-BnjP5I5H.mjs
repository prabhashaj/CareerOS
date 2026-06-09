import { c as createServerRpc } from "./createServerRpc-DqGC0bE5.mjs";
import { a as createServerFn } from "./server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C6u9Brrq.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { k as enumType, g as objectType, i as stringType, h as numberType, j as arrayType, z as booleanType } from "../_libs/zod.mjs";
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
const employmentType = enumType(["full_time", "part_time", "contract", "internship", "temporary"]);
const listJobs_createServerFn_handler = createServerRpc({
  id: "0f6b44b459f0f5a7154aecdbd6de5f39fc93825d0d32caf19f26936089e5a107",
  name: "listJobs",
  filename: "src/lib/jobs.functions.ts"
}, (opts) => listJobs.__executeServer(opts));
const listJobs = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(listJobs_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase
  } = context;
  const {
    data,
    error
  } = await supabase.from("jobs").select("id, title, company, location, remote, employment_type, source, source_url, salary_min, salary_max, created_at").order("created_at", {
    ascending: false
  }).limit(200);
  if (error) throw new Error(error.message);
  return data ?? [];
});
const getJob_createServerFn_handler = createServerRpc({
  id: "432b934c493a65b20930541aa425464f2c52d0a8716794775211fc250ec5a8e5",
  name: "getJob",
  filename: "src/lib/jobs.functions.ts"
}, (opts) => getJob.__executeServer(opts));
const getJob = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid()
}).parse(input)).handler(getJob_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase
  } = context;
  const {
    data: job,
    error
  } = await supabase.from("jobs").select("*").eq("id", data.id).single();
  if (error) throw new Error(error.message);
  return job;
});
const createJob_createServerFn_handler = createServerRpc({
  id: "ab0e7c09b47d7ada2f8e5674d2a34621a0be302c11db7c58ae029c8e93152a4c",
  name: "createJob",
  filename: "src/lib/jobs.functions.ts"
}, (opts) => createJob.__executeServer(opts));
const createJob = createServerFn({
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
}).parse(input)).handler(createJob_createServerFn_handler, async ({
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
  } = await supabase.from("jobs").insert({
    ...data,
    user_id: userId,
    source: "manual"
  }).select().single();
  if (error) throw new Error(error.message);
  return row;
});
const ingestJobFromUrl_createServerFn_handler = createServerRpc({
  id: "0f48f63a16bd9a3856b3e79fbdc4867b20aaa2fb8c6db0c89be1c1971f16e886",
  name: "ingestJobFromUrl",
  filename: "src/lib/jobs.functions.ts"
}, (opts) => ingestJobFromUrl.__executeServer(opts));
const ingestJobFromUrl = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  url: stringType().url().max(2e3).optional(),
  rawText: stringType().max(5e4).optional()
}).refine((v) => !!(v.url || v.rawText), {
  message: "Provide a URL or paste the job description."
}).parse(input)).handler(ingestJobFromUrl_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  let text = "";
  let sourceUrl = data.url ?? null;
  if (data.rawText && data.rawText.trim().length > 50) {
    text = data.rawText.trim().slice(0, 3e4);
  } else if (data.url) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      throw new Error("URL scraping isn't configured. Paste the job description text instead.");
    }
    try {
      const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: data.url,
          formats: ["markdown"],
          onlyMainContent: true
        }),
        signal: AbortSignal.timeout(25e3)
      });
      if (!res.ok) {
        throw new Error(`Could not load that URL (status ${res.status}). Paste the job description text instead.`);
      }
      const json = await res.json();
      const markdown = json.data?.markdown ?? json.markdown ?? "";
      text = markdown.replace(/\s+/g, " ").trim().slice(0, 3e4);
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Could not load that URL. Paste the job description manually instead.");
    }
  }
  if (text.length < 80) {
    throw new Error("Not enough readable text to parse. Paste the full job description.");
  }
  const {
    generateText,
    Output
  } = await import("../_libs/ai.mjs");
  const {
    getGateway
  } = await import("./ai-gateway.server-B3gvEtJS.mjs");
  const gateway = getGateway();
  const Schema = objectType({
    title: stringType().nullish(),
    company: stringType().nullish(),
    location: stringType().nullish(),
    remote: booleanType().nullish(),
    employment_type: employmentType.nullish(),
    description: stringType().nullish(),
    requirements: arrayType(stringType()).max(30).nullish(),
    skills: arrayType(stringType()).max(30).nullish(),
    salary_min: numberType().int().nullish(),
    salary_max: numberType().int().nullish()
  });
  let parsed;
  try {
    const {
      output
    } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      output: Output.object({
        schema: Schema
      }),
      prompt: `Extract structured job posting fields from the content below. Return JSON only. Use null for any field that is not present. Do not invent values.

${sourceUrl ? `SOURCE URL: ${sourceUrl}

` : ""}CONTENT:
${text}`
    });
    parsed = output;
  } catch {
    throw new Error("AI couldn't parse that posting. Try pasting a cleaner copy of the job description.");
  }
  const {
    data: row,
    error
  } = await supabase.from("jobs").insert({
    user_id: userId,
    source: data.url ? "url_paste" : "manual",
    source_url: sourceUrl,
    title: parsed.title ?? "Untitled role",
    company: parsed.company ?? "Unknown",
    location: parsed.location ?? null,
    remote: parsed.remote ?? false,
    employment_type: parsed.employment_type ?? null,
    description: parsed.description ?? text.slice(0, 5e3),
    requirements: parsed.requirements ?? [],
    skills: parsed.skills ?? [],
    salary_min: parsed.salary_min ?? null,
    salary_max: parsed.salary_max ?? null
  }).select().single();
  if (error) throw new Error(error.message);
  return row;
});
const deleteJob_createServerFn_handler = createServerRpc({
  id: "0b6eaaf0affa05d8406d489ac99eda00e3421778cab940e69680df0823f93f94",
  name: "deleteJob",
  filename: "src/lib/jobs.functions.ts"
}, (opts) => deleteJob.__executeServer(opts));
const deleteJob = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid()
}).parse(input)).handler(deleteJob_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase
  } = context;
  const {
    error
  } = await supabase.from("jobs").delete().eq("id", data.id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
export {
  createJob_createServerFn_handler,
  deleteJob_createServerFn_handler,
  getJob_createServerFn_handler,
  ingestJobFromUrl_createServerFn_handler,
  listJobs_createServerFn_handler
};
