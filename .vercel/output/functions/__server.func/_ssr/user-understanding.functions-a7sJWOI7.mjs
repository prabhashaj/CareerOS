import { c as createServerRpc } from "./createServerRpc-DqGC0bE5.mjs";
import { a as createServerFn } from "./server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C6u9Brrq.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { g as objectType, i as stringType, j as arrayType } from "../_libs/zod.mjs";
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
const Turn = objectType({
  question: stringType().max(1e3),
  answer: stringType().max(5e3)
});
const nextUnderstandingQuestion_createServerFn_handler = createServerRpc({
  id: "40d7cd55085c4973af863a47ae050ad4a2716c1f242b685dd258cd60ef721dd4",
  name: "nextUnderstandingQuestion",
  filename: "src/lib/user-understanding.functions.ts"
}, (opts) => nextUnderstandingQuestion.__executeServer(opts));
const nextUnderstandingQuestion = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  history: arrayType(Turn).max(40).default([])
}).parse(input)).handler(nextUnderstandingQuestion_createServerFn_handler, async ({
  data
}) => {
  const {
    generateText
  } = await import("../_libs/ai.mjs");
  const {
    getGateway
  } = await import("./ai-gateway.server-B3gvEtJS.mjs");
  const gateway = getGateway();
  const transcript = data.history.map((t, i) => `Q${i + 1}: ${t.question}
A${i + 1}: ${t.answer}`).join("\n\n");
  const system = `You are a career coach interviewing a candidate to build a rich knowledge base for job applications. Ask ONE focused, open-ended question at a time. Cover (in order of priority, skipping anything already answered): target role & seniority, years of experience, core technical skills with depth, standout projects with measurable impact, achievements & metrics, certifications, education, location & relocation/remote preferences, salary expectations, work authorization, soft skills, career goals. Never repeat a topic. Keep questions short (max 25 words). When you have enough across all major topics OR after ~10 questions, reply with the literal string DONE.`;
  const {
    text
  } = await generateText({
    model: gateway("google/gemini-2.5-flash"),
    system,
    prompt: transcript ? `Conversation so far:

${transcript}

What is the next single best question? Or reply DONE.` : `Start the interview with the most important opening question.`
  });
  const q = text.trim();
  if (/^done\b/i.test(q) || data.history.length >= 12) {
    return {
      done: true,
      question: null
    };
  }
  return {
    done: false,
    question: q
  };
});
const saveUnderstanding_createServerFn_handler = createServerRpc({
  id: "9e256d631e8cea9a27f8fa10731bb32fc04277b0f8c4de8450b160a1dd3221a5",
  name: "saveUnderstanding",
  filename: "src/lib/user-understanding.functions.ts"
}, (opts) => saveUnderstanding.__executeServer(opts));
const saveUnderstanding = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  history: arrayType(Turn).min(1).max(40)
}).parse(input)).handler(saveUnderstanding_createServerFn_handler, async ({
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
  const gateway = getGateway();
  const transcript = data.history.map((t, i) => `Q${i + 1}: ${t.question}
A${i + 1}: ${t.answer}`).join("\n\n");
  let summary = transcript;
  try {
    const {
      text
    } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      prompt: `Convert this candidate interview into a clean Markdown knowledge-base entry with sections: Summary, Target Roles, Skills (bulleted concrete tech & tools), Experience Highlights, Projects, Achievements, Certifications, Education, Preferences (location/remote/salary/authorization), Career Goals. Be faithful — do not invent facts.

INTERVIEW:
${transcript}`
    });
    if (text && text.trim().length > 100) summary = text.trim();
  } catch (e) {
    console.error("[saveUnderstanding] distill failed", e);
  }
  const body = `# Candidate Profile (from interview)

${summary}

---

## Raw Interview Transcript

${transcript}`;
  const {
    data: row,
    error
  } = await supabase.from("documents").insert({
    user_id: userId,
    kind: "knowledge_base",
    title: `Understand-me interview — ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`,
    extracted_text: body,
    metadata: {
      source: "understand_me",
      turns: data.history.length
    }
  }).select("id, title").single();
  if (error) throw new Error(error.message);
  return {
    id: row.id,
    title: row.title
  };
});
const saveSkillsAndCerts_createServerFn_handler = createServerRpc({
  id: "3e581435ed25a770e4e5fa2c3e68f08aad53ec3e29b97af82f7e372ee23e71c8",
  name: "saveSkillsAndCerts",
  filename: "src/lib/user-understanding.functions.ts"
}, (opts) => saveSkillsAndCerts.__executeServer(opts));
const saveSkillsAndCerts = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  skills: arrayType(stringType().min(1).max(100)).max(80).default([]),
  certifications: arrayType(stringType().min(1).max(200)).max(40).default([]),
  achievements: stringType().max(8e3).optional()
}).refine((v) => v.skills.length || v.certifications.length || v.achievements && v.achievements.trim().length > 10, {
  message: "Add at least one skill, certification, or achievement."
}).parse(input)).handler(saveSkillsAndCerts_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const body = ["# Skills & Certifications", data.skills.length ? `
## Skills
${data.skills.map((s) => `- ${s}`).join("\n")}` : "", data.certifications.length ? `
## Certifications
${data.certifications.map((c) => `- ${c}`).join("\n")}` : "", data.achievements?.trim() ? `
## Achievements & Notes
${data.achievements.trim()}` : ""].filter(Boolean).join("\n");
  const {
    data: row,
    error
  } = await supabase.from("documents").insert({
    user_id: userId,
    kind: "knowledge_base",
    title: `Skills & certifications — ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`,
    extracted_text: body,
    metadata: {
      source: "skills_form",
      skills: data.skills.length,
      certs: data.certifications.length
    }
  }).select("id, title").single();
  if (error) throw new Error(error.message);
  return {
    id: row.id,
    title: row.title
  };
});
export {
  nextUnderstandingQuestion_createServerFn_handler,
  saveSkillsAndCerts_createServerFn_handler,
  saveUnderstanding_createServerFn_handler
};
