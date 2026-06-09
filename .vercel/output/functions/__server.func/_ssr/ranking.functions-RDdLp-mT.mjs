import { c as createServerRpc } from "./createServerRpc-DqGC0bE5.mjs";
import { a as createServerFn } from "./server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C6u9Brrq.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { g as objectType, z as booleanType, i as stringType, j as arrayType, k as enumType } from "../_libs/zod.mjs";
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
function tokenize(s) {
  return s.toLowerCase().match(/[a-z0-9+#.]{2,}/g) ?? [];
}
const SKILL_ALIASES = {
  ai: ["artificial intelligence", "generative ai", "gen ai", "llm", "machine learning"],
  github: ["git", "github.com"],
  "open-source": ["open source", "opensource", "github", "fork", "repository"],
  "machine learning": ["ml", "machine-learning"],
  python: ["python3"],
  "developer tools": ["dev tools", "tooling", "framework", "streamlit", "automation"]
};
function normalizePhrase(value) {
  return value.toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").trim();
}
function hasSkill(text, skill) {
  const normalizedText = ` ${normalizePhrase(text)} `;
  const normalizedSkill = normalizePhrase(skill);
  const aliases = SKILL_ALIASES[normalizedSkill] ?? [];
  return [normalizedSkill, ...aliases].some((term) => normalizedText.includes(` ${normalizePhrase(term)} `));
}
function skillOverlap(jobSkills, candidateText) {
  if (jobSkills.length === 0) return {
    score: 0.5,
    matched: [],
    missing: []
  };
  const matched = jobSkills.filter((s) => hasSkill(candidateText, s));
  const missing = jobSkills.filter((s) => !matched.includes(s));
  return {
    score: matched.length / jobSkills.length,
    matched,
    missing
  };
}
function heuristicExtractSkills(title, description) {
  const text = `${title}
${description}`.toLowerCase();
  const catalog = ["Python", "JavaScript", "TypeScript", "React", "Node.js", "SQL", "PostgreSQL", "Machine Learning", "AI", "LLM", "NLP", "Data Science", "AWS", "Docker", "Kubernetes", "GitHub", "Open-source", "Developer Tools", "APIs", "Streamlit", "TensorFlow", "PyTorch", "scikit-learn", "Java", "C++", "Go", "Rust"];
  return catalog.filter((skill) => hasSkill(text, skill)).slice(0, 15);
}
function locationScore(job, prefs, wantsRemote) {
  if (job.remote) return wantsRemote ? 1 : 0.85;
  if (prefs.length === 0) return 0.6;
  if (!job.location) return 0.5;
  const loc = job.location.toLowerCase();
  return prefs.some((p) => loc.includes(p.toLowerCase())) ? 1 : 0.25;
}
function titleScore(jobTitle, targetRoles) {
  if (targetRoles.length === 0) return 0.6;
  const jt = tokenize(jobTitle);
  let best = 0;
  for (const r of targetRoles) {
    const rt = tokenize(r);
    if (rt.length === 0) continue;
    const matched = rt.filter((t) => jt.includes(t)).length;
    best = Math.max(best, matched / rt.length);
  }
  return best;
}
async function aiExtractSkills(title, description) {
  try {
    const {
      generateObject
    } = await import("../_libs/ai.mjs");
    const {
      getGateway
    } = await import("./ai-gateway.server-B3gvEtJS.mjs");
    const gateway = getGateway();
    const {
      object
    } = await generateObject({
      model: gateway("google/gemini-2.5-flash-lite"),
      system: "Extract concrete technical skills, tools, frameworks, and domains from a job posting. Return only skills that matter for matching. Max 15.",
      prompt: `Title: ${title}

${description.slice(0, 4e3)}`,
      schema: objectType({
        skills: arrayType(stringType()).max(15)
      })
    });
    return object.skills.map(String).filter(Boolean).slice(0, 15);
  } catch {
    return heuristicExtractSkills(title, description);
  }
}
async function aiClassifySkills(jobSkills, candidateText) {
  if (jobSkills.length === 0) return {
    matched: [],
    missing: []
  };
  try {
    const {
      generateObject
    } = await import("../_libs/ai.mjs");
    const {
      getGateway
    } = await import("./ai-gateway.server-B3gvEtJS.mjs");
    const gateway = getGateway();
    const {
      object
    } = await generateObject({
      model: gateway("google/gemini-2.5-flash"),
      system: "You decide which skills a candidate truly demonstrates based ONLY on their resume/profile text. Treat synonyms, acronyms, and equivalent tools as matches (e.g. 'JS' = 'JavaScript', 'GPT/Claude' = 'LLMs', 'Postgres' = 'PostgreSQL'). Be strict: if there is no evidence in the candidate text, mark it missing.",
      prompt: `JOB SKILLS:
${jobSkills.map((s, i) => `${i + 1}. ${s}`).join("\n")}

CANDIDATE TEXT:
${candidateText.slice(0, 12e3)}

For every job skill, classify as "matched" or "missing".`,
      schema: objectType({
        classifications: arrayType(objectType({
          skill: stringType(),
          status: enumType(["matched", "missing"])
        }))
      })
    });
    const matched = [];
    const missing = [];
    const seen = /* @__PURE__ */ new Set();
    for (const c of object.classifications) {
      const skill = jobSkills.find((s) => s.toLowerCase() === c.skill.toLowerCase()) ?? c.skill;
      if (seen.has(skill.toLowerCase())) continue;
      seen.add(skill.toLowerCase());
      (c.status === "matched" ? matched : missing).push(skill);
    }
    for (const s of jobSkills) {
      if (!seen.has(s.toLowerCase())) missing.push(s);
    }
    return {
      matched,
      missing
    };
  } catch {
    return null;
  }
}
async function aiReasoning(input) {
  try {
    const {
      generateText
    } = await import("../_libs/ai.mjs");
    const {
      getGateway
    } = await import("./ai-gateway.server-B3gvEtJS.mjs");
    const gateway = getGateway();
    const {
      text
    } = await generateText({
      model: gateway("google/gemini-2.5-flash-lite"),
      system: "You are a job-fit analyst. In 2-3 short sentences, explain why this role does or doesn't fit. Be direct, mention strongest matched skills and the biggest gap. No fluff.",
      prompt: JSON.stringify(input)
    });
    return text.trim() || null;
  } catch {
    return null;
  }
}
const rankJob_createServerFn_handler = createServerRpc({
  id: "88162fc58b21076679b4afdbca516bf6dae8c11f6a28b1489b1df3e51c5e574b",
  name: "rankJob",
  filename: "src/lib/ranking.functions.ts"
}, (opts) => rankJob.__executeServer(opts));
const rankJob = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  job_id: stringType().uuid(),
  persist: booleanType().default(true),
  skip_ai_reasoning: booleanType().default(false)
}).parse(input)).handler(rankJob_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const [{
    data: job,
    error: jErr
  }, {
    data: profile
  }] = await Promise.all([supabase.from("jobs").select("*").eq("id", data.job_id).single(), supabase.from("profiles").select("*").eq("id", userId).single()]);
  if (jErr) throw new Error(jErr.message);
  const {
    loadCandidateText
  } = await import("./candidate-context.server-BNx_PXHO.mjs");
  const candidateText = await loadCandidateText(supabase, userId, 14e3);
  let jobSkills = job.skills ?? [];
  if (jobSkills.length === 0 && job.description && !data.skip_ai_reasoning) {
    jobSkills = await aiExtractSkills(job.title, job.description);
    if (jobSkills.length > 0) {
      await supabase.from("jobs").update({
        skills: jobSkills
      }).eq("id", job.id);
    }
  }
  let matched;
  let missing;
  let skills;
  const aiSkillResult = data.skip_ai_reasoning ? null : await aiClassifySkills(jobSkills, candidateText);
  if (aiSkillResult) {
    matched = aiSkillResult.matched;
    missing = aiSkillResult.missing;
    skills = jobSkills.length === 0 ? 0.5 : matched.length / jobSkills.length;
  } else {
    const overlap = skillOverlap(jobSkills, candidateText);
    matched = overlap.matched;
    missing = overlap.missing;
    skills = overlap.score;
  }
  let semantic = 0.5;
  if (candidateText && job.description) {
    try {
      const {
        embedTexts
      } = await import("./embeddings.server-CIj1-C-K.mjs");
      const [a, b] = await embedTexts([candidateText.slice(0, 6e3), `${job.title}
${job.description}`.slice(0, 6e3)]);
      let dot = 0, na = 0, nb = 0;
      for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
      }
      semantic = Math.max(0, Math.min(1, dot / (Math.sqrt(na) * Math.sqrt(nb) || 1)));
    } catch {
      semantic = 0.5;
    }
  }
  const prefs = profile?.preferences ?? {};
  const wantsRemote = Boolean(prefs.remote_only);
  const location = locationScore(job, profile?.target_locations ?? [], wantsRemote);
  const title = titleScore(job.title ?? "", profile?.target_roles ?? []);
  let eligibility = 1;
  if (profile?.min_salary && job.salary_max && job.salary_max < profile.min_salary) {
    eligibility -= 0.4;
  }
  if (profile?.requires_sponsorship && /no sponsorship|us citizen|citizens only/i.test(job.description ?? "")) {
    eligibility -= 0.6;
  }
  eligibility = Math.max(0, eligibility);
  const score = 0.32 * semantic + 0.28 * skills + 0.15 * title + 0.13 * location + 0.12 * eligibility;
  const fallbackReason = `Title fit ${(title * 100).toFixed(0)}% • Skills ${(skills * 100).toFixed(0)}% • Semantic ${(semantic * 100).toFixed(0)}% • Location ${(location * 100).toFixed(0)}% • Eligibility ${(eligibility * 100).toFixed(0)}%.`;
  const aiText = data.skip_ai_reasoning ? null : await aiReasoning({
    jobTitle: job.title,
    company: job.company,
    scores: {
      skills,
      semantic,
      location,
      eligibility,
      title
    },
    matched,
    missing
  });
  const breakdown = {
    skills,
    semantic,
    location,
    eligibility,
    title,
    reasoning: aiText ?? fallbackReason,
    matched_skills: matched,
    missing_skills: missing
  };
  if (data.persist) {
    const {
      data: existing
    } = await supabase.from("job_applications").select("id").eq("user_id", userId).eq("job_id", job.id).maybeSingle();
    if (existing) {
      await supabase.from("job_applications").update({
        match_score: Number(score.toFixed(4)),
        match_breakdown: breakdown
      }).eq("id", existing.id);
    } else {
      await supabase.from("job_applications").insert({
        user_id: userId,
        job_id: job.id,
        status: "saved",
        match_score: Number(score.toFixed(4)),
        match_breakdown: breakdown
      });
    }
  }
  return {
    score: Number(score.toFixed(4)),
    breakdown
  };
});
const rankAllJobs_createServerFn_handler = createServerRpc({
  id: "c6e89d59aafd294c313310bcdf31cc5e019b5fe6d7feabe6aec847a73718a2a2",
  name: "rankAllJobs",
  filename: "src/lib/ranking.functions.ts"
}, (opts) => rankAllJobs.__executeServer(opts));
const rankAllJobs = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(rankAllJobs_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: jobs,
    error
  } = await supabase.from("jobs").select("id").eq("user_id", userId).order("created_at", {
    ascending: false
  }).limit(40);
  if (error) throw new Error(error.message);
  const {
    rankJob: rj
  } = await import("./ranking.functions-C1pVUIEt.mjs");
  let scored = 0;
  const BATCH = 6;
  const list = jobs ?? [];
  for (let i = 0; i < list.length; i += BATCH) {
    const slice = list.slice(i, i + BATCH);
    const results = await Promise.all(slice.map((j) => rj({
      data: {
        job_id: j.id,
        persist: true,
        skip_ai_reasoning: true
      }
    }).then(() => true).catch((e) => {
      console.error("rank failed", j.id, e);
      return false;
    })));
    scored += results.filter(Boolean).length;
  }
  return {
    scored
  };
});
export {
  rankAllJobs_createServerFn_handler,
  rankJob_createServerFn_handler
};
