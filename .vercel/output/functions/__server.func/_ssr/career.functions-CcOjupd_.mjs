import { c as createServerRpc } from "./createServerRpc-DqGC0bE5.mjs";
import { a as createServerFn } from "./server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C6u9Brrq.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { g as objectType, j as arrayType, i as stringType, k as enumType, h as numberType } from "../_libs/zod.mjs";
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
const SuggestionSchema = objectType({
  role: stringType(),
  track: enumType(["adjacent", "lateral", "stretch"]),
  why_it_fits: stringType(),
  transferable_strengths: arrayType(stringType()).default([]),
  gaps_to_close: arrayType(stringType()).default([]),
  first_step: stringType(),
  example_titles: arrayType(stringType()).default([]),
  example_companies: arrayType(stringType()).default([])
});
const ResultSchema = objectType({
  summary: stringType(),
  suggestions: arrayType(SuggestionSchema),
  long_term_themes: arrayType(stringType()).default([])
});
const tracks = ["adjacent", "lateral", "stretch"];
function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}
function asTextArray(value, max = 8) {
  if (Array.isArray(value)) {
    return value.map((item) => asText(item)).filter(Boolean).slice(0, max);
  }
  if (typeof value === "string") {
    return value.split(/[\n,;]/).map((item) => item.trim()).filter(Boolean).slice(0, max);
  }
  return [];
}
function parseJsonObject(text) {
  const stripped = text.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  const json = stripped.slice(start, end + 1);
  try {
    return JSON.parse(json);
  } catch {
    try {
      return JSON.parse(json.replace(/,\s*([}\]])/g, "$1"));
    } catch {
      return null;
    }
  }
}
function createFallbackCareerResult(profile, resumeText, horizonMonths) {
  const profileRecord = isRecord(profile) ? profile : {};
  const targetRoles = asTextArray(profileRecord.target_roles, 4);
  const headline = asText(profileRecord.headline) || "your current background";
  const resumeSignal = resumeText.length > 200 ? "resume" : "profile";
  const roleSeeds = targetRoles.length > 0 ? targetRoles : ["Operations Specialist", "Customer Success Manager", "Business Analyst", "Product Manager"];
  const suggestion = (role, track, firstStep, gaps) => ({
    role,
    track,
    why_it_fits: `This is a practical ${track} move from ${headline}, using strengths visible in your ${resumeSignal}.`,
    transferable_strengths: ["domain context", "communication", "execution", "problem solving"],
    gaps_to_close: gaps,
    first_step: firstStep,
    example_titles: [role, `Associate ${role}`, `Senior ${role}`],
    example_companies: []
  });
  return {
    summary: `I could not safely parse a structured AI response, so I prepared a stable starter map for the next ${horizonMonths} months from your saved profile and resume context.`,
    suggestions: [suggestion(roleSeeds[0], "adjacent", `Rewrite your resume headline around ${roleSeeds[0]} and apply to 5 closely matched postings.`, ["role-specific keywords"]), suggestion("Implementation Specialist", "adjacent", "Build a short case study showing how you onboard, troubleshoot, or coordinate work end-to-end.", ["product workflow examples"]), suggestion(roleSeeds[1] ?? "Business Analyst", "lateral", "Compare 10 postings and create a skills matrix from repeated requirements.", ["tool fluency", "portfolio proof"]), suggestion("Program Coordinator", "lateral", "Document one complex project as a concise STAR story with scope, actions, and outcomes.", ["measurable outcomes"]), suggestion(roleSeeds[2] ?? "Product Manager", "stretch", "Draft a one-page product or process improvement brief based on a real problem you know well.", ["strategy narrative", "prioritization examples"]), suggestion("Strategy Associate", "stretch", "Practice explaining your career pivot as a business case with evidence from your past work.", ["market framing", "executive communication"])],
    long_term_themes: ["Package your experience around outcomes", "Close one visible skill gap at a time", "Use small portfolio artifacts to prove the pivot"]
  };
}
function normalizeSuggestion(value, index) {
  if (!isRecord(value)) return null;
  const role = asText(value.role) || asText(value.title) || asText(value.name);
  if (!role) return null;
  const trackText = asText(value.track).toLowerCase();
  const track = tracks.includes(trackText) ? trackText : tracks[index % tracks.length];
  return {
    role,
    track,
    why_it_fits: asText(value.why_it_fits) || asText(value.why) || "This path aligns with your current background and target direction.",
    transferable_strengths: asTextArray(value.transferable_strengths ?? value.strengths, 6),
    gaps_to_close: asTextArray(value.gaps_to_close ?? value.gaps, 6),
    first_step: asText(value.first_step) || "Compare 5 job descriptions and update your resume with the repeated keywords you can truthfully support.",
    example_titles: asTextArray(value.example_titles ?? value.titles, 5),
    example_companies: asTextArray(value.example_companies ?? value.companies, 5)
  };
}
function normalizeCareerResult(value, fallback) {
  const parsed = ResultSchema.safeParse(value);
  if (parsed.success && parsed.data.suggestions.length > 0) return parsed.data;
  const record = isRecord(value) ? value : {};
  const suggestions = Array.isArray(record.suggestions) ? record.suggestions.map(normalizeSuggestion).filter((item) => Boolean(item)) : [];
  const seen = new Set(suggestions.map((item) => item.role.toLowerCase()));
  for (const item of fallback.suggestions) {
    if (suggestions.length >= 8) break;
    if (!seen.has(item.role.toLowerCase())) suggestions.push(item);
  }
  return {
    summary: asText(record.summary) || fallback.summary,
    suggestions: suggestions.slice(0, 8),
    long_term_themes: asTextArray(record.long_term_themes ?? record.themes, 6).length > 0 ? asTextArray(record.long_term_themes ?? record.themes, 6) : fallback.long_term_themes
  };
}
const discoverCareerPaths_createServerFn_handler = createServerRpc({
  id: "9e23ea56720f0d68b8abba550b4704d12b4392ba344e9f7b1518c5dcbb091e90",
  name: "discoverCareerPaths",
  filename: "src/lib/career.functions.ts"
}, (opts) => discoverCareerPaths.__executeServer(opts));
const discoverCareerPaths = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  horizon_months: numberType().int().min(3).max(36).default(18),
  risk_appetite: enumType(["safe", "balanced", "stretch"]).default("balanced")
}).parse(input)).handler(discoverCareerPaths_createServerFn_handler, async ({
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
    CAREER_SYSTEM
  } = await import("./prompts.server-BIZ-_0Sl.mjs");
  const {
    data: profile
  } = await supabase.from("profiles").select("*").eq("id", userId).single();
  const {
    data: resume
  } = await supabase.from("documents").select("extracted_text").eq("user_id", userId).eq("kind", "resume").eq("is_primary", true).maybeSingle();
  const fallback = createFallbackCareerResult(profile, resume?.extracted_text ?? "", data.horizon_months);
  let object = fallback;
  try {
    const gateway = getGateway();
    const {
      text
    } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system: CAREER_SYSTEM,
      prompt: `Return 6-8 suggestions across adjacent, lateral, and stretch tracks. Respond with ONLY parseable JSON. No prose, no markdown, no code fences.

JSON shape:
{
  "summary": "string",
  "suggestions": [{
    "role": "string",
    "track": "adjacent" | "lateral" | "stretch",
    "why_it_fits": "string",
    "transferable_strengths": ["string"],
    "gaps_to_close": ["string"],
    "first_step": "string",
    "example_titles": ["string"],
    "example_companies": ["string"]
  }],
  "long_term_themes": ["string"]
}

CANDIDATE:
Headline: ${profile?.headline ?? ""}
Location: ${profile?.location ?? ""}
Target roles: ${(profile?.target_roles ?? []).join(", ")}
Target locations: ${(profile?.target_locations ?? []).join(", ")}
Horizon: ${data.horizon_months} months
Risk appetite: ${data.risk_appetite}

RESUME:
${(resume?.extracted_text ?? "").slice(0, 8e3)}`
    });
    object = normalizeCareerResult(parseJsonObject(text), fallback);
  } catch (error) {
    console.error("discoverCareerPaths: AI generation failed", error);
  }
  await supabase.from("application_events").insert({
    user_id: userId,
    event_type: "career_discovery",
    payload: {
      count: object.suggestions.length,
      horizon: data.horizon_months
    }
  });
  return object;
});
export {
  discoverCareerPaths_createServerFn_handler
};
