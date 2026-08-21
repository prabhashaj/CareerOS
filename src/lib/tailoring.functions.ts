import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function loadCandidateContext(
  supabase: any,
  userId: string,
  query: string,
) {
  let ctxBlocks = "";
  try {
    const { embedText, toVectorLiteral } = await import("@/lib/embeddings.server");
    const vec = await embedText(query);
    const { data: chunks } = await supabase.rpc("match_user_chunks", {
      _user_id: userId,
      query_embedding: toVectorLiteral(vec) as unknown as string,
      match_count: 10,
    });
    ctxBlocks = (chunks ?? []).map((c: any, i: number) => `[chunk ${i + 1}] ${c.content}`).join("\n\n");
  } catch (err) {
    console.warn("Vector match skipped or failed", err);
  }

  const [{ data: profile }, { data: allDocs }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("documents")
      .select("title, kind, extracted_text, is_primary")
      .eq("user_id", userId)
      .not("extracted_text", "is", null)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const profileBlock = profile
    ? `Name: ${profile.full_name ?? ""}\nHeadline: ${profile.headline ?? ""}\nLocation: ${profile.location ?? ""}\nLinkedIn: ${profile.linkedin_url ?? ""}\nPortfolio: ${profile.portfolio_url ?? ""}\nTarget Roles: ${((profile.target_roles ?? []) as string[]).join(", ")}`
    : "";

  const styleProfile = (profile?.preferences as { writing_style?: unknown } | null)?.writing_style ?? null;
  const styleDirective = styleProfile
    ? `\n\nWRITING STYLE TO MATCH:\n${JSON.stringify(styleProfile)}\nApply this voice consistently. Never sacrifice truth or clarity to mimic style.`
    : "";

  const docBlocks = (allDocs ?? [])
    .map((d: any) => `DOCUMENT (${d.kind?.toUpperCase() ?? "DOC"} - ${d.title ?? "Untitled"}${d.is_primary ? " [PRIMARY]" : ""}):\n${d.extracted_text?.trim()}`)
    .join("\n\n---\n\n");

  const savedResumeBlocks = ((allDocs ?? []) as any[])
    .filter((d) => d.kind === "resume")
    .map((r: any) => `SAVED RESUME (${r.title || "Resume"}):\n${r.extracted_text || ""}`)
    .join("\n\n---\n\n");

  let localContext = "";
  try {
    const fs = await import("fs");
    const path = await import("path");
    const desktopPaths = [
      'C:\\Users\\Vivek\\Desktop\\my certifications\\AnnepuJyothiPrabhashResume_extracted.txt',
      'C:\\Users\\Vivek\\Desktop\\my certifications\\new_resume-1-_extracted.txt',
      'C:\\Users\\Vivek\\Desktop\\my certifications\\jpmorgan_virtual_internship_extracted.txt',
      'C:\\Users\\Vivek\\Desktop\\From my childhood, I always wanted.txt',
    ];
    for (const p of desktopPaths) {
      if (fs.existsSync(p)) {
        localContext += `\n\n--- LOCAL CANDIDATE FILE: ${path.basename(p)} ---\n` + fs.readFileSync(p, 'utf8');
      }
    }
  } catch (err) {
    console.error("Error reading local candidate files", err);
  }

  return {
    contextText: `PROFILE:\n${profileBlock}\n\nKNOWLEDGE HUB DOCUMENTS & UPLOADED RESUMES:\n${docBlocks}\n\n${savedResumeBlocks}\n\nRELEVANT SEMANTIC CHUNKS:\n${ctxBlocks}${localContext}${styleDirective}`.slice(0, 24_000),
    profile,
  };
}

async function researchCompany(companyName?: string): Promise<string> {
  const key = process.env.TAVILY_API_KEY;
  if (!key || !companyName) return "";
  try {
    const query = `${companyName} company products services technology stack`;
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      signal: AbortSignal.timeout(8_000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query,
        search_depth: "basic",
        max_results: 2,
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

async function resolveJobInfo(
  supabase: any,
  data: {
    job_id?: string | undefined;
    job_title?: string | undefined;
    company?: string | undefined;
    job_description?: string | undefined;
  },
) {
  if (data.job_id) {
    const { data: job, error } = await supabase.from("jobs").select("*").eq("id", data.job_id).maybeSingle();
    if (error) throw new Error(error.message);
    if (job) {
      return {
        id: job.id,
        title: job.title || "Target Role",
        company: job.company || "Target Company",
        description: job.description || "",
        location: job.location || "Remote",
        skills: job.skills || [],
        requirements: job.requirements || [],
      };
    }
  }

  return {
    id: null,
    title: data.job_title || "Target Role",
    company: data.company || "Target Company",
    description: data.job_description || "",
    location: "Remote",
    skills: [] as string[],
    requirements: [] as string[],
  };
}

function buildJobBrief(job: {
  title: string;
  company: string;
  location?: string;
  remote?: boolean;
  skills?: string[];
  requirements?: string[];
  description?: string;
}) {
  return `TITLE: ${job.title}\nCOMPANY: ${job.company}\nLOCATION: ${job.location ?? "n/a"}\nSKILLS: ${(job.skills ?? []).join(", ")}\nREQUIREMENTS:\n- ${(job.requirements ?? []).join("\n- ")}\n\nDESCRIPTION:\n${(job.description ?? "").slice(0, 10000)}`;
}

export const tailorResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        job_id: z.string().uuid().optional(),
        job_title: z.string().optional(),
        company: z.string().optional(),
        job_description: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { generateText } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const { RESUME_TAILOR_SYSTEM } = await import("@/lib/prompts.server");

    const job = await resolveJobInfo(supabase, data);
    const companyResearch = await researchCompany(job.company);
    const { contextText } = await loadCandidateContext(
      supabase,
      userId,
      `${job.title} ${job.company} ${(job.skills ?? []).join(" ")} ${(job.requirements ?? []).join(" ")}`,
    );
    const gateway = getGateway();

    const jobKeywords = (job.skills ?? []).join(", ");
    const draftPrompt = `JOB:\n${buildJobBrief(job)}\n\n${companyResearch}JOB KEYWORDS TO MIRROR (only when the candidate truly has the skill):\n${jobKeywords || "(extract key technical and domain keywords from the description)"}\n\nCANDIDATE CONTEXT:\n${contextText}\n\nWrite the FIRST DRAFT of an ATS-optimized, single-column Markdown resume tailored specifically to this job. Follow every rule in the system prompt.`;

    const draft = await generateText({
      model: gateway("google/gemini-2.5-pro"),
      system: RESUME_TAILOR_SYSTEM,
      prompt: draftPrompt,
    });

    const polishPrompt = `You wrote the following resume draft. Now REVISE it once more for maximum ATS score and human impact.

JOB:
${buildJobBrief(job)}

${companyResearch}
CANDIDATE CONTEXT (ground truth — do not contradict):
${contextText}

CURRENT DRAFT:
${draft.text}

REVISION CHECKLIST (apply silently, output only the final resume):
1. Add any missing job keywords the candidate truly has but the draft omitted.
2. Strengthen weak bullets: replace passive/generic verbs with strong action verbs (Built, Shipped, Architected, Reduced, Scaled, Led); add measurable impact (numbers, %, scale, latency, time) when candidate context supports it.
3. Remove unsupported claims, fluff, and clichés.
4. Tighten the Summary so it directly answers "why this candidate for THIS role at ${job.company}".
5. Ensure the section order is Summary → Skills → Experience → Projects → Education → Certifications (omit empty sections).
6. Verify: no tables, no emojis, no HTML, no code fences, standard \`##\` headers, dates and locations on every role.

Return ONLY the final polished Markdown resume. No preamble.`;

    const polished = await generateText({
      model: gateway("google/gemini-2.5-pro"),
      system: RESUME_TAILOR_SYSTEM,
      prompt: polishPrompt,
    });

    const text = polished.text.trim();

    if (job.id) {
      const { data: existing } = await supabase
        .from("job_applications")
        .select("id")
        .eq("user_id", userId)
        .eq("job_id", job.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("job_applications")
          .update({ tailored_resume: text, updated_at: new Date().toISOString() })
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
    }

    return { resume: text };
  });

export const analyzeATSKeywords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        job_description: z.string().min(20),
        resume_text: z.string().min(20),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { generateObject } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const gateway = getGateway();

    const { object } = await generateObject({
      model: gateway("google/gemini-2.5-flash"),
      system: `You are an ATS (Applicant Tracking System) parser and resume analyst.
Analyze the target job description against the resume. Extract the top 15-20 crucial hard skills, soft skills, technologies, and domain keywords from the job description.
Determine which keywords are MATCHED in the resume (including synonyms/acronyms like 'React.js' = 'React') and which are MISSING.
Provide an overall ATS match score (0-100) and 3-4 concrete tips to increase score without inventing facts.`,
      prompt: `JOB DESCRIPTION:\n${data.job_description.slice(0, 10000)}\n\nRESUME CONTENT:\n${data.resume_text.slice(0, 15000)}`,
      schema: z.object({
        score: z.number().min(0).max(100),
        matched_keywords: z.array(z.string()),
        missing_keywords: z.array(z.string()),
        suggestions: z.array(z.string()),
      }),
    });

    return object;
  });

export const generateCoverLetter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        job_id: z.string().uuid().optional(),
        job_title: z.string().optional(),
        company: z.string().optional(),
        job_description: z.string().optional(),
        tone: z.enum(["confident", "warm", "formal", "concise", "executive"]).default("confident"),
        focus: z.string().optional(),
        custom_instructions: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { generateText } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const { COVER_LETTER_SYSTEM } = await import("@/lib/prompts.server");

    const job = await resolveJobInfo(supabase, data);
    const companyResearch = await researchCompany(job.company);
    const { contextText } = await loadCandidateContext(
      supabase,
      userId,
      `cover letter ${job.title} ${job.company} ${data.focus ?? ""}`,
    );

    const tonePrompts: Record<string, string> = {
      confident: "Tone: Confident, achievement-oriented, direct, and high-impact.",
      warm: "Tone: Warm, conversational, storytelling, and passionate about the product.",
      formal: "Tone: Professional, polished, structured, and executive-level.",
      concise: "Tone: Crisp, punchy, under 200 words, direct value proposition.",
      executive: "Tone: Strategic, leadership-focused, visionary, driving high business ROI.",
    };

    const gateway = getGateway();
    const { text } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system: COVER_LETTER_SYSTEM,
      prompt: `JOB:\n${buildJobBrief(job)}\n\n${companyResearch}${tonePrompts[data.tone] ?? ""}\n${data.focus ? `SPECIFIC FOCUS TO HIGHLIGHT: ${data.focus}\n` : ""}${data.custom_instructions ? `ADDITIONAL INSTRUCTIONS: ${data.custom_instructions}\n` : ""}\nCANDIDATE CONTEXT:\n${contextText}\n\nWrite a compelling, bespoke cover letter. Output only the plain prose.`,
    });

    const coverLetterText = text.trim();

    if (job.id) {
      const { data: existing } = await supabase
        .from("job_applications")
        .select("id")
        .eq("user_id", userId)
        .eq("job_id", job.id)
        .maybeSingle();
      if (existing) {
        await supabase
          .from("job_applications")
          .update({ cover_letter: coverLetterText, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("job_applications").insert({
          user_id: userId,
          job_id: job.id,
          status: "saved",
          cover_letter: coverLetterText,
        });
      }

      await supabase.from("application_events").insert({
        user_id: userId,
        job_id: job.id,
        event_type: "cover_letter_generated",
        payload: { length: coverLetterText.length, tone: data.tone },
      });
    }

    return { cover_letter: coverLetterText };
  });

export const polishCoverLetter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        current_text: z.string().min(20),
        instruction: z.string().min(2),
        job_title: z.string().optional(),
        company: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { generateText } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const gateway = getGateway();

    const { text } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system:
        "You are an expert cover letter editor. Refine the provided cover letter strictly according to the user's instructions. Maintain factual accuracy, improve flow, and return ONLY the revised cover letter prose.",
      prompt: `TARGET ROLE: ${data.job_title ?? "Role"} at ${data.company ?? "Company"}\n\nUSER INSTRUCTION: ${data.instruction}\n\nCURRENT COVER LETTER:\n${data.current_text}`,
    });

    return { cover_letter: text.trim() };
  });

export const generateAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      job_id: z.string().uuid().optional(),
      job_title: z.string().optional(),
      company: z.string().optional(),
      question: z.string().min(3).max(2000),
      max_words: z.number().int().min(20).max(800).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { generateText } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const { ANSWER_SYSTEM } = await import("@/lib/prompts.server");

    const job = await resolveJobInfo(supabase, data);
    const { contextText } = await loadCandidateContext(supabase, userId, data.question);
    const gateway = getGateway();
    const { text } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system: ANSWER_SYSTEM,
      prompt: `JOB:\n${buildJobBrief(job)}\n\nQUESTION:\n${data.question}\n${data.max_words ? `\nLIMIT: ${data.max_words} words.\n` : ""}\nCANDIDATE CONTEXT:\n${contextText}\n\nAnswer now.`,
    });

    if (job.id) {
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
    }

    return { answer: text.trim() };
  });
