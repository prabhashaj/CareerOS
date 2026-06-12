import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type MatchBreakdown = {
  skills: number;
  semantic: number;
  location: number;
  eligibility: number;
  title: number;
  reasoning: string;
  matched_skills: string[];
  missing_skills: string[];
};

function tokenize(s: string): string[] {
  return s.toLowerCase().match(/[a-z0-9+#.]{2,}/g) ?? [];
}

const SKILL_ALIASES: Record<string, string[]> = {
  ai: ["artificial intelligence", "generative ai", "gen ai", "llm", "machine learning"],
  github: ["git", "github.com"],
  "open-source": ["open source", "opensource", "github", "fork", "repository"],
  "machine learning": ["ml", "machine-learning"],
  python: ["python3"],
  "developer tools": ["dev tools", "tooling", "framework", "streamlit", "automation"],
};

function normalizePhrase(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").trim();
}

function hasSkill(text: string, skill: string) {
  const normalizedText = ` ${normalizePhrase(text)} `;
  const normalizedSkill = normalizePhrase(skill);
  const aliases = SKILL_ALIASES[normalizedSkill] ?? [];
  return [normalizedSkill, ...aliases].some((term) => normalizedText.includes(` ${normalizePhrase(term)} `));
}

function skillOverlap(jobSkills: string[], candidateText: string) {
  if (jobSkills.length === 0) return { score: 0.5, matched: [] as string[], missing: [] as string[] };
  const matched = jobSkills.filter((s) => hasSkill(candidateText, s));
  const missing = jobSkills.filter((s) => !matched.includes(s));
  return { score: matched.length / jobSkills.length, matched, missing };
}

function heuristicExtractSkills(title: string, description: string): string[] {
  const text = `${title}\n${description}`.toLowerCase();
  const catalog = [
    "Python", "JavaScript", "TypeScript", "React", "Node.js", "SQL", "PostgreSQL", "Machine Learning", "AI",
    "LLM", "NLP", "Data Science", "AWS", "Docker", "Kubernetes", "GitHub", "Open-source", "Developer Tools",
    "APIs", "Streamlit", "TensorFlow", "PyTorch", "scikit-learn", "Java", "C++", "Go", "Rust",
  ];
  return catalog.filter((skill) => hasSkill(text, skill)).slice(0, 15);
}

function locationScore(
  job: { location: string | null; remote: boolean | null },
  prefs: string[],
  wantsRemote: boolean,
) {
  if (job.remote) return wantsRemote ? 1 : 0.85;
  if (prefs.length === 0) return 0.6;
  if (!job.location) return 0.5;
  const loc = job.location.toLowerCase();
  return prefs.some((p) => loc.includes(p.toLowerCase())) ? 1 : 0.25;
}

function titleScore(jobTitle: string, targetRoles: string[]) {
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

async function aiExtractSkills(title: string, description: string): Promise<string[]> {
  try {
    const { generateObject } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const gateway = getGateway();
    const { object } = await generateObject({
      model: gateway("google/gemini-2.5-flash-lite"),
      system: "Extract concrete technical skills, tools, frameworks, and domains from a job posting. Return only skills that matter for matching. Max 15.",
      prompt: `Title: ${title}\n\n${description.slice(0, 4000)}`,
      schema: z.object({ skills: z.array(z.string()).max(15) }),
    });
    return object.skills.map(String).filter(Boolean).slice(0, 15);
  } catch {
    return heuristicExtractSkills(title, description);
  }
}

// AI-grounded matched/missing classification: looks at each job skill and
// decides whether the candidate's actual context evidences it. Much more
// accurate than substring matching (handles synonyms, acronyms, framings).
async function aiClassifySkills(
  jobSkills: string[],
  candidateText: string,
): Promise<{ matched: string[]; missing: string[] } | null> {
  if (jobSkills.length === 0) return { matched: [], missing: [] };
  try {
    const { generateObject } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const gateway = getGateway();
    const { object } = await generateObject({
      model: gateway("google/gemini-2.5-flash"),
      system:
        "You decide which skills a candidate truly demonstrates based ONLY on their resume/profile text. Treat synonyms, acronyms, and equivalent tools as matches (e.g. 'JS' = 'JavaScript', 'GPT/Claude' = 'LLMs', 'Postgres' = 'PostgreSQL'). Be strict: if there is no evidence in the candidate text, mark it missing.",
      prompt: `JOB SKILLS:\n${jobSkills.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nCANDIDATE TEXT:\n${candidateText.slice(0, 12000)}\n\nFor every job skill, classify as "matched" or "missing".`,
      schema: z.object({
        classifications: z.array(
          z.object({
            skill: z.string(),
            status: z.enum(["matched", "missing"]),
          }),
        ),
      }),
    });
    const matched: string[] = [];
    const missing: string[] = [];
    const seen = new Set<string>();
    for (const c of object.classifications) {
      const skill = jobSkills.find((s) => s.toLowerCase() === c.skill.toLowerCase()) ?? c.skill;
      if (seen.has(skill.toLowerCase())) continue;
      seen.add(skill.toLowerCase());
      (c.status === "matched" ? matched : missing).push(skill);
    }
    // Cover any skills the model dropped.
    for (const s of jobSkills) {
      if (!seen.has(s.toLowerCase())) missing.push(s);
    }
    return { matched, missing };
  } catch {
    return null;
  }
}


async function aiReasoning(input: {
  jobTitle: string;
  company: string;
  scores: { skills: number; semantic: number; location: number; eligibility: number; title: number };
  matched: string[];
  missing: string[];
}): Promise<string | null> {
  try {
    const { generateText } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const gateway = getGateway();
    const { text } = await generateText({
      model: gateway("google/gemini-2.5-flash-lite"),
      system:
        "You are a job-fit analyst. In 2-3 short sentences, explain why this role does or doesn't fit. Be direct, mention strongest matched skills and the biggest gap. No fluff.",
      prompt: JSON.stringify(input),
    });
    return text.trim() || null;
  } catch {
    return null;
  }
}


export async function rankJobInternal(
  supabase: any,
  userId: string,
  jobId: string,
  persist: boolean = true,
  skipAiReasoning: boolean = false,
) {
  const [{ data: job, error: jErr }, { data: profile }] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", jobId).single(),
    supabase.from("profiles").select("*").eq("id", userId).single(),
  ]);
  if (jErr) throw new Error(jErr.message);

  const { loadCandidateText } = await import("@/lib/candidate-context.server");
  const candidateText = await loadCandidateText(supabase, userId, 14_000);

  // Get skills — fall back to AI extraction if job has none stored.
  let jobSkills: string[] = job.skills ?? [];
  if (jobSkills.length === 0 && job.description && !skipAiReasoning) {
    jobSkills = await aiExtractSkills(job.title, job.description);
    if (jobSkills.length > 0) {
      await supabase.from("jobs").update({ skills: jobSkills }).eq("id", job.id);
    }
  }
  // Prefer AI-grounded matching (synonyms, acronyms). Fall back to
  // substring-overlap if the model call fails or AI is disabled.
  let matched: string[];
  let missing: string[];
  let skills: number;
  const aiSkillResult = skipAiReasoning ? null : await aiClassifySkills(jobSkills, candidateText);
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

  // Semantic similarity via embeddings if we have candidate context to embed against.
  let semantic = 0.5;
  if (candidateText && job.description) {
    try {
      const { embedTexts } = await import("@/lib/embeddings.server");
      const [a, b] = await embedTexts([
        candidateText.slice(0, 6000),
        `${job.title}\n${job.description}`.slice(0, 6000),
      ]);
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

  const prefs = (profile?.preferences ?? {}) as { remote_only?: boolean };
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

  const score =
    0.32 * semantic +
    0.28 * skills +
    0.15 * title +
    0.13 * location +
    0.12 * eligibility;

  const fallbackReason = `Title fit ${(title * 100).toFixed(0)}% • Skills ${(skills * 100).toFixed(0)}% • Semantic ${(semantic * 100).toFixed(0)}% • Location ${(location * 100).toFixed(0)}% • Eligibility ${(eligibility * 100).toFixed(0)}%.`;
  const aiText = skipAiReasoning
    ? null
    : await aiReasoning({
        jobTitle: job.title,
        company: job.company,
        scores: { skills, semantic, location, eligibility, title },
        matched,
        missing,
      });

  const breakdown: MatchBreakdown = {
    skills,
    semantic,
    location,
    eligibility,
    title,
    reasoning: aiText ?? fallbackReason,
    matched_skills: matched,
    missing_skills: missing,
  };

  if (persist) {
    const { data: existing } = await supabase
      .from("job_applications")
      .select("id")
      .eq("user_id", userId)
      .eq("job_id", job.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("job_applications")
        .update({ match_score: Number(score.toFixed(4)), match_breakdown: breakdown })
        .eq("id", existing.id);
    } else {
      await supabase.from("job_applications").insert({
        user_id: userId,
        job_id: job.id,
        status: "saved",
        match_score: Number(score.toFixed(4)),
        match_breakdown: breakdown,
      });
    }
  }

  return { score: Number(score.toFixed(4)), breakdown };
}

// Rank one job against the user's primary resume + profile preferences.
export const rankJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        job_id: z.string().uuid(),
        persist: z.boolean().default(true),
        skip_ai_reasoning: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    return await rankJobInternal(supabase, userId, data.job_id, data.persist, data.skip_ai_reasoning);
  });

// Rank every un-scored job for the user (parallel batches, no AI reasoning to fit worker timeout).
export const rankAllJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(40);
    if (error) throw new Error(error.message);

    let scored = 0;
    const BATCH = 6;
    const list = jobs ?? [];
    for (let i = 0; i < list.length; i += BATCH) {
      const slice = list.slice(i, i + BATCH);
      const results = await Promise.all(
        slice.map((j) =>
          rankJobInternal(supabase, userId, j.id, true, true)
            .then(() => true)
            .catch((e) => {
              console.error("rank failed", j.id, e);
              return false;
            }),
        ),
      );
      scored += results.filter(Boolean).length;
    }
    return { scored };
  });

