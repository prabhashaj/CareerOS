import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function loadCandidateContext(
  supabase: any,
  userId: string,
  query: string,
) {
  const { embedText, toVectorLiteral } = await import("@/lib/embeddings.server");
  const vec = await embedText(query);
  const { data: chunks } = await supabase.rpc("match_user_chunks", {
    _user_id: userId,
    query_embedding: toVectorLiteral(vec) as unknown as string,
    match_count: 10,
  });
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
  const { data: resume } = await supabase
    .from("documents")
    .select("extracted_text")
    .eq("user_id", userId)
    .eq("kind", "resume")
    .eq("is_primary", true)
    .maybeSingle();

  const ctxBlocks = (chunks ?? []).map((c: any, i: number) => `[chunk ${i + 1}] ${c.content}`).join("\n\n");
  const profileBlock = profile
    ? `Name: ${profile.full_name ?? ""}\nHeadline: ${profile.headline ?? ""}\nLocation: ${profile.location ?? ""}\nLinkedIn: ${profile.linkedin_url ?? ""}\nPortfolio: ${profile.portfolio_url ?? ""}`
    : "";
  const styleProfile = (profile?.preferences as { writing_style?: unknown } | null)?.writing_style ?? null;
  const styleDirective = styleProfile
    ? `\n\nWRITING STYLE TO MATCH:\n${JSON.stringify(styleProfile)}\nApply this voice consistently. Never sacrifice truth or clarity to mimic style.`
    : "";

  let localContext = "";
  try {
    const fs = await import("fs");
    const path = await import("path");
    const desktopPaths = [
      'C:\\Users\\Vivek\\Desktop\\my certifications\\AnnepuJyothiPrabhashResume_extracted.txt',
      'C:\\Users\\Vivek\\Desktop\\my certifications\\new_resume-1-_extracted.txt',
      'C:\\Users\\Vivek\\Desktop\\my certifications\\jpmorgan_virtual_internship_extracted.txt',
      'C:\\Users\\Vivek\\Desktop\\From my childhood, I always wanted.txt'
    ];
    for (const p of desktopPaths) {
      if (fs.existsSync(p)) {
        localContext += `\n\n--- LOCAL FILE: ${path.basename(p)} ---\n` + fs.readFileSync(p, 'utf8');
      }
    }
  } catch (err) {
    console.error("Error reading local desktop files", err);
  }

  return {
    contextText: `PROFILE:\n${profileBlock}\n\nPRIMARY RESUME:\n${(resume?.extracted_text ?? "").slice(0, 8000)}\n\nRELEVANT KNOWLEDGE BASE:\n${ctxBlocks}${localContext}${styleDirective}`.slice(0, 20_000),
    profile,
  };
}

async function researchCompany(companyName: string): Promise<string> {
  const key = process.env.TAVILY_API_KEY;
  if (!key || !companyName) return "";
  try {
    const query = `${companyName} company products services artificial intelligence`;
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query,
        search_depth: "advanced",
        max_results: 3,
      }),
    });
    if (!res.ok) return "";
    const json = (await res.json()) as {
      results?: Array<{ title?: string; content?: string; url?: string }>;
    };
    const blocks = (json.results ?? [])
      .map((r, i) => `[Result ${i + 1}] Title: ${r.title}\nContent: ${r.content}\nSource: ${r.url}`)
      .join("\n\n");
    return `BACKGROUND RESEARCH ON ${companyName.toUpperCase()}:\n${blocks}\n\n`;
  } catch (err) {
    console.error("Error researching company", err);
    return "";
  }
}

async function loadJob(supabase: any, jobId: string) {
  const { data: job, error } = await supabase.from("jobs").select("*").eq("id", jobId).single();
  if (error) throw new Error(error.message);
  return job;
}

function buildJobBrief(job: any) {
  return `TITLE: ${job.title}\nCOMPANY: ${job.company}\nLOCATION: ${job.location ?? "n/a"} ${job.remote ? "(remote ok)" : ""}\nSKILLS: ${(job.skills ?? []).join(", ")}\nREQUIREMENTS:\n- ${(job.requirements ?? []).join("\n- ")}\n\nDESCRIPTION:\n${(job.description ?? "").slice(0, 8000)}`;
}

export const tailorResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ job_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { generateText } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const { RESUME_TAILOR_SYSTEM } = await import("@/lib/prompts.server");

    const job = await loadJob(supabase, data.job_id);
    const companyResearch = await researchCompany(job.company);
    const { contextText } = await loadCandidateContext(
      supabase,
      userId,
      `${job.title} ${job.company} ${(job.skills ?? []).join(" ")} ${(job.requirements ?? []).join(" ")}`,
    );
    const gateway = getGateway();

    const jobKeywords = (job.skills ?? []).join(", ");
    const draftPrompt = `JOB:\n${buildJobBrief(job)}\n\n${companyResearch}JOB KEYWORDS TO MIRROR (only when the candidate truly has the skill):\n${jobKeywords || "(none extracted)"}\n\nCANDIDATE CONTEXT:\n${contextText}\n\nWrite the FIRST DRAFT of an ATS-optimized, single-column Markdown resume tailored to this job. Follow every rule in the system prompt.`;

    // Draft pass — use the strongest available model for resume quality.
    const draft = await generateText({
      model: gateway("google/gemini-2.5-pro"),
      system: RESUME_TAILOR_SYSTEM,
      prompt: draftPrompt,
    });

    // Self-critique + polish pass. Forces a second look at ATS keyword
    // coverage, weak verbs, unsupported claims, and formatting drift.
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
      prompt: polishPrompt,
    });

    const text = polished.text.trim();

    // Upsert into job_applications row
    const { data: existing } = await supabase
      .from("job_applications")
      .select("id")
      .eq("user_id", userId)
      .eq("job_id", job.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("job_applications")
        .update({ tailored_resume: text })
        .eq("id", existing.id);
    } else {
      await supabase.from("job_applications").insert({
        user_id: userId,
        job_id: job.id,
        status: "saved",
        tailored_resume: text,
      });
    }

    await supabase.from("application_events").insert({
      user_id: userId,
      job_id: job.id,
      event_type: "resume_tailored",
      payload: { length: text.length, model: "google/gemini-2.5-pro", passes: 2 },
    });

    return { resume: text };
  });


export const generateCoverLetter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ job_id: z.string().uuid(), tone: z.enum(["confident", "warm", "formal"]).default("confident") }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { generateText } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const { COVER_LETTER_SYSTEM } = await import("@/lib/prompts.server");

    const job = await loadJob(supabase, data.job_id);
    const companyResearch = await researchCompany(job.company);
    const { contextText } = await loadCandidateContext(
      supabase,
      userId,
      `cover letter ${job.title} ${job.company}`,
    );
    const gateway = getGateway();
    const { text } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system: COVER_LETTER_SYSTEM,
      prompt: `JOB:\n${buildJobBrief(job)}\n\n${companyResearch}TONE: ${data.tone}\n\nCANDIDATE CONTEXT:\n${contextText}\n\nWrite the cover letter now.`,
    });

    const { data: existing } = await supabase
      .from("job_applications")
      .select("id")
      .eq("user_id", userId)
      .eq("job_id", job.id)
      .maybeSingle();
    if (existing) {
      await supabase.from("job_applications").update({ cover_letter: text }).eq("id", existing.id);
    } else {
      await supabase.from("job_applications").insert({
        user_id: userId,
        job_id: job.id,
        status: "saved",
        cover_letter: text,
      });
    }

    await supabase.from("application_events").insert({
      user_id: userId,
      job_id: job.id,
      event_type: "cover_letter_generated",
      payload: { length: text.length, tone: data.tone },
    });

    return { cover_letter: text };
  });

export const generateAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      job_id: z.string().uuid(),
      question: z.string().min(3).max(2000),
      max_words: z.number().int().min(20).max(800).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { generateText } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const { ANSWER_SYSTEM } = await import("@/lib/prompts.server");

    const job = await loadJob(supabase, data.job_id);
    const { contextText } = await loadCandidateContext(supabase, userId, data.question);
    const gateway = getGateway();
    const { text } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system: ANSWER_SYSTEM,
      prompt: `JOB:\n${buildJobBrief(job)}\n\nQUESTION:\n${data.question}\n${data.max_words ? `\nLIMIT: ${data.max_words} words.\n` : ""}\nCANDIDATE CONTEXT:\n${contextText}\n\nAnswer now.`,
    });

    // Append into answers map on the application row
    const { data: existing } = await supabase
      .from("job_applications")
      .select("id, answers")
      .eq("user_id", userId)
      .eq("job_id", job.id)
      .maybeSingle();
    const answers = (existing?.answers as Record<string, string> | null) ?? {};
    answers[data.question] = text;
    if (existing) {
      await supabase.from("job_applications").update({ answers }).eq("id", existing.id);
    } else {
      await supabase.from("job_applications").insert({
        user_id: userId,
        job_id: job.id,
        status: "saved",
        answers,
      });
    }

    await supabase.from("application_events").insert({
      user_id: userId,
      job_id: job.id,
      event_type: "answer_generated",
      payload: { question: data.question.slice(0, 200) },
    });

    return { answer: text };
  });
