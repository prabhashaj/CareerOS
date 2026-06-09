import { c as createServerRpc } from "./createServerRpc-DqGC0bE5.mjs";
import { a as createServerFn } from "./server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C6u9Brrq.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { g as objectType, i as stringType, k as enumType, h as numberType } from "../_libs/zod.mjs";
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
async function loadCandidateContext(supabase, userId, query) {
  const {
    embedText,
    toVectorLiteral
  } = await import("./embeddings.server-CIj1-C-K.mjs");
  const vec = await embedText(query);
  const {
    data: chunks
  } = await supabase.rpc("match_user_chunks", {
    _user_id: userId,
    query_embedding: toVectorLiteral(vec),
    match_count: 10
  });
  const {
    data: profile
  } = await supabase.from("profiles").select("*").eq("id", userId).single();
  const {
    data: resume
  } = await supabase.from("documents").select("extracted_text").eq("user_id", userId).eq("kind", "resume").eq("is_primary", true).maybeSingle();
  const ctxBlocks = (chunks ?? []).map((c, i) => `[chunk ${i + 1}] ${c.content}`).join("\n\n");
  const profileBlock = profile ? `Name: ${profile.full_name ?? ""}
Headline: ${profile.headline ?? ""}
Location: ${profile.location ?? ""}
LinkedIn: ${profile.linkedin_url ?? ""}
Portfolio: ${profile.portfolio_url ?? ""}` : "";
  const styleProfile = profile?.preferences?.writing_style ?? null;
  const styleDirective = styleProfile ? `

WRITING STYLE TO MATCH:
${JSON.stringify(styleProfile)}
Apply this voice consistently. Never sacrifice truth or clarity to mimic style.` : "";
  let localContext = "";
  try {
    const fs = await import("fs");
    const path = await import("path");
    const desktopPaths = ["C:\\Users\\Vivek\\Desktop\\my certifications\\AnnepuJyothiPrabhashResume_extracted.txt", "C:\\Users\\Vivek\\Desktop\\my certifications\\new_resume-1-_extracted.txt", "C:\\Users\\Vivek\\Desktop\\my certifications\\jpmorgan_virtual_internship_extracted.txt", "C:\\Users\\Vivek\\Desktop\\From my childhood, I always wanted.txt"];
    for (const p of desktopPaths) {
      if (fs.existsSync(p)) {
        localContext += `

--- LOCAL FILE: ${path.basename(p)} ---
` + fs.readFileSync(p, "utf8");
      }
    }
  } catch (err) {
    console.error("Error reading local desktop files", err);
  }
  return {
    contextText: `PROFILE:
${profileBlock}

PRIMARY RESUME:
${(resume?.extracted_text ?? "").slice(0, 8e3)}

RELEVANT KNOWLEDGE BASE:
${ctxBlocks}${localContext}${styleDirective}`.slice(0, 2e4),
    profile
  };
}
async function researchCompany(companyName) {
  const key = process.env.TAVILY_API_KEY;
  if (!key || !companyName) return "";
  try {
    const query = `${companyName} company products services artificial intelligence`;
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      signal: AbortSignal.timeout(1e4),
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: key,
        query,
        search_depth: "advanced",
        max_results: 3
      })
    });
    if (!res.ok) return "";
    const json = await res.json();
    const blocks = (json.results ?? []).map((r, i) => `[Result ${i + 1}] Title: ${r.title}
Content: ${r.content}
Source: ${r.url}`).join("\n\n");
    return `BACKGROUND RESEARCH ON ${companyName.toUpperCase()}:
${blocks}

`;
  } catch (err) {
    console.error("Error researching company", err);
    return "";
  }
}
async function loadJob(supabase, jobId) {
  const {
    data: job,
    error
  } = await supabase.from("jobs").select("*").eq("id", jobId).single();
  if (error) throw new Error(error.message);
  return job;
}
function buildJobBrief(job) {
  return `TITLE: ${job.title}
COMPANY: ${job.company}
LOCATION: ${job.location ?? "n/a"} ${job.remote ? "(remote ok)" : ""}
SKILLS: ${(job.skills ?? []).join(", ")}
REQUIREMENTS:
- ${(job.requirements ?? []).join("\n- ")}

DESCRIPTION:
${(job.description ?? "").slice(0, 8e3)}`;
}
const tailorResume_createServerFn_handler = createServerRpc({
  id: "2bedff7eed0be97e66af26963ae224726d54d4a347dd9ef45cd5e6ef0d1d080a",
  name: "tailorResume",
  filename: "src/lib/tailoring.functions.ts"
}, (opts) => tailorResume.__executeServer(opts));
const tailorResume = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  job_id: stringType().uuid()
}).parse(input)).handler(tailorResume_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    generateText
  } = await import("../_libs/ai.mjs");
  const {
    getGateway
  } = await import("./ai-gateway.server-B3gvEtJS.mjs");
  const {
    RESUME_TAILOR_SYSTEM
  } = await import("./prompts.server-BIZ-_0Sl.mjs");
  const job = await loadJob(supabase, data.job_id);
  const companyResearch = await researchCompany(job.company);
  const {
    contextText
  } = await loadCandidateContext(supabase, userId, `${job.title} ${job.company} ${(job.skills ?? []).join(" ")} ${(job.requirements ?? []).join(" ")}`);
  const gateway = getGateway();
  const jobKeywords = (job.skills ?? []).join(", ");
  const draftPrompt = `JOB:
${buildJobBrief(job)}

${companyResearch}JOB KEYWORDS TO MIRROR (only when the candidate truly has the skill):
${jobKeywords || "(none extracted)"}

CANDIDATE CONTEXT:
${contextText}

Write the FIRST DRAFT of an ATS-optimized, single-column Markdown resume tailored to this job. Follow every rule in the system prompt.`;
  const draft = await generateText({
    model: gateway("google/gemini-2.5-pro"),
    system: RESUME_TAILOR_SYSTEM,
    prompt: draftPrompt
  });
  const polishPrompt = `You wrote the following resume draft. Now REVISE it once more for maximum ATS score and human impact.

JOB:
${buildJobBrief(job)}

${companyResearch}JOB KEYWORDS:
${jobKeywords}

CANDIDATE CONTEXT (ground truth — do not contradict):
${contextText}

CURRENT DRAFT:
${draft.text}

REVISION CHECKLIST (apply silently, output only the final resume):
1. Add any missing job keywords the candidate truly has but the draft omitted.
2. Strengthen weak bullets: replace passive/generic verbs with strong action verbs; add measurable impact (numbers, %, scale, time) when the candidate context supports it.
3. Remove unsupported claims, fluff, and clichés.
4. Tighten the Summary so it directly answers "why this candidate for THIS role".
5. Ensure the section order is Summary → Skills → Experience → Projects → Education → Certifications (omit empty sections).
6. Verify: no tables, no emojis, no HTML, no code fences, standard \`##\` headers, dates and locations on every role.

Return ONLY the final polished Markdown resume. No preamble.`;
  const polished = await generateText({
    model: gateway("google/gemini-2.5-pro"),
    system: RESUME_TAILOR_SYSTEM,
    prompt: polishPrompt
  });
  const text = polished.text.trim();
  const {
    data: existing
  } = await supabase.from("job_applications").select("id").eq("user_id", userId).eq("job_id", job.id).maybeSingle();
  if (existing) {
    await supabase.from("job_applications").update({
      tailored_resume: text
    }).eq("id", existing.id);
  } else {
    await supabase.from("job_applications").insert({
      user_id: userId,
      job_id: job.id,
      status: "saved",
      tailored_resume: text
    });
  }
  await supabase.from("application_events").insert({
    user_id: userId,
    job_id: job.id,
    event_type: "resume_tailored",
    payload: {
      length: text.length,
      model: "google/gemini-2.5-pro",
      passes: 2
    }
  });
  return {
    resume: text
  };
});
const generateCoverLetter_createServerFn_handler = createServerRpc({
  id: "f1f540e1de87c3de8204f4f3fc4452e8eb4b1f18ea8e754ca50c092b9330d216",
  name: "generateCoverLetter",
  filename: "src/lib/tailoring.functions.ts"
}, (opts) => generateCoverLetter.__executeServer(opts));
const generateCoverLetter = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  job_id: stringType().uuid(),
  tone: enumType(["confident", "warm", "formal"]).default("confident")
}).parse(input)).handler(generateCoverLetter_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    generateText
  } = await import("../_libs/ai.mjs");
  const {
    getGateway
  } = await import("./ai-gateway.server-B3gvEtJS.mjs");
  const {
    COVER_LETTER_SYSTEM
  } = await import("./prompts.server-BIZ-_0Sl.mjs");
  const job = await loadJob(supabase, data.job_id);
  const companyResearch = await researchCompany(job.company);
  const {
    contextText
  } = await loadCandidateContext(supabase, userId, `cover letter ${job.title} ${job.company}`);
  const gateway = getGateway();
  const {
    text
  } = await generateText({
    model: gateway("google/gemini-2.5-flash"),
    system: COVER_LETTER_SYSTEM,
    prompt: `JOB:
${buildJobBrief(job)}

${companyResearch}TONE: ${data.tone}

CANDIDATE CONTEXT:
${contextText}

Write the cover letter now.`
  });
  const {
    data: existing
  } = await supabase.from("job_applications").select("id").eq("user_id", userId).eq("job_id", job.id).maybeSingle();
  if (existing) {
    await supabase.from("job_applications").update({
      cover_letter: text
    }).eq("id", existing.id);
  } else {
    await supabase.from("job_applications").insert({
      user_id: userId,
      job_id: job.id,
      status: "saved",
      cover_letter: text
    });
  }
  await supabase.from("application_events").insert({
    user_id: userId,
    job_id: job.id,
    event_type: "cover_letter_generated",
    payload: {
      length: text.length,
      tone: data.tone
    }
  });
  return {
    cover_letter: text
  };
});
const generateAnswer_createServerFn_handler = createServerRpc({
  id: "d19a487eddacfbec7f4c8538f89eab324875a5c6f0d23e74f9cb61206c545bce",
  name: "generateAnswer",
  filename: "src/lib/tailoring.functions.ts"
}, (opts) => generateAnswer.__executeServer(opts));
const generateAnswer = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  job_id: stringType().uuid(),
  question: stringType().min(3).max(2e3),
  max_words: numberType().int().min(20).max(800).optional()
}).parse(input)).handler(generateAnswer_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    generateText
  } = await import("../_libs/ai.mjs");
  const {
    getGateway
  } = await import("./ai-gateway.server-B3gvEtJS.mjs");
  const {
    ANSWER_SYSTEM
  } = await import("./prompts.server-BIZ-_0Sl.mjs");
  const job = await loadJob(supabase, data.job_id);
  const {
    contextText
  } = await loadCandidateContext(supabase, userId, data.question);
  const gateway = getGateway();
  const {
    text
  } = await generateText({
    model: gateway("google/gemini-2.5-flash"),
    system: ANSWER_SYSTEM,
    prompt: `JOB:
${buildJobBrief(job)}

QUESTION:
${data.question}
${data.max_words ? `
LIMIT: ${data.max_words} words.
` : ""}
CANDIDATE CONTEXT:
${contextText}

Answer now.`
  });
  const {
    data: existing
  } = await supabase.from("job_applications").select("id, answers").eq("user_id", userId).eq("job_id", job.id).maybeSingle();
  const answers = existing?.answers ?? {};
  answers[data.question] = text;
  if (existing) {
    await supabase.from("job_applications").update({
      answers
    }).eq("id", existing.id);
  } else {
    await supabase.from("job_applications").insert({
      user_id: userId,
      job_id: job.id,
      status: "saved",
      answers
    });
  }
  await supabase.from("application_events").insert({
    user_id: userId,
    job_id: job.id,
    event_type: "answer_generated",
    payload: {
      question: data.question.slice(0, 200)
    }
  });
  return {
    answer: text
  };
});
export {
  generateAnswer_createServerFn_handler,
  generateCoverLetter_createServerFn_handler,
  tailorResume_createServerFn_handler
};
