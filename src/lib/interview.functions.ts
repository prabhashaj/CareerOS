import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const prepInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        job_id: z.string().uuid().optional(),
        job_title: z.string().optional(),
        company: z.string().optional(),
        job_description: z.string().optional(),
        focus: z.enum(["behavioral", "technical", "mixed"]).default("mixed"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { generateObject } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const { retrieveCandidateContext } = await import("@/lib/candidate-context.server");
    const { INTERVIEW_SYSTEM } = await import("@/lib/prompts.server");

    let jobTitle = data.job_title || "Target Role";
    let companyName = data.company || "Target Company";
    let jobDescription = data.job_description || "";

    if (data.job_id) {
      const { data: job, error } = await supabase.from("jobs").select("*").eq("id", data.job_id).maybeSingle();
      if (!error && job) {
        jobTitle = job.title;
        companyName = job.company;
        jobDescription = job.description || "";
      }
    }

    const ctx = await retrieveCandidateContext(
      supabase,
      userId,
      `${jobTitle} ${companyName} interview behavioral technical architecture achievements`,
      14_000,
    );

    const gateway = getGateway();
    const { object: output } = await generateObject({
      model: gateway("google/gemini-2.5-flash"),
      system: INTERVIEW_SYSTEM,
      prompt: `JOB:
${jobTitle} at ${companyName}
${jobDescription.slice(0, 5000)}

FOCUS: ${data.focus}

CANDIDATE CONTEXT:
${ctx}`,
      schema: z.object({
        questions: z.array(
          z.object({
            q: z.string(),
            category: z.string(),
            why_asked: z.string(),
            tips: z.string(),
          }),
        ),
        star_stories: z.array(
          z.object({
            title: z.string(),
            situation: z.string(),
            task: z.string(),
            action: z.string(),
            result: z.string(),
            covers_questions: z.array(z.string()),
          }),
        ),
        questions_to_ask: z.array(z.string()),
        red_flags_to_address: z.array(z.string()),
        cheat_sheet: z.object({
          elevator_pitch: z.string(),
          top_skills_to_highlight: z.array(z.string()),
          key_metrics: z.array(z.string()),
          company_talking_points: z.array(z.string()),
        }),
      }),
    });

    const validCategories = ["behavioral", "technical", "company_fit", "role_specific", "system_design"];
    const clean = {
      questions: output.questions.slice(0, 12).map((q) => ({
        ...q,
        category: validCategories.includes(q.category) ? q.category : "role_specific",
      })),
      star_stories: output.star_stories.slice(0, 6).map((s) => ({
        ...s,
        covers_questions: s.covers_questions.slice(0, 4),
      })),
      questions_to_ask: output.questions_to_ask.slice(0, 6),
      red_flags_to_address: output.red_flags_to_address.slice(0, 5),
      cheat_sheet: output.cheat_sheet,
    };

    if (data.job_id) {
      await supabase.from("application_events").insert({
        user_id: userId,
        job_id: data.job_id,
        event_type: "interview_prep_generated",
        payload: { questions: clean.questions.length, stories: clean.star_stories.length },
      });
    }

    return clean;
  });

export const evaluateMockAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        question: z.string().min(3),
        user_answer: z.string().min(10),
        job_title: z.string().optional(),
        company: z.string().optional(),
        category: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { generateObject } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const gateway = getGateway();

    const { object: feedback } = await generateObject({
      model: gateway("google/gemini-2.5-flash"),
      system: `You are an expert executive interview coach. Evaluate the candidate's practice response to an interview question for the role of ${data.job_title ?? "Target Role"} at ${data.company ?? "Target Company"}.
Be encouraging yet rigorous. Score the answer from 0 to 100 based on clarity, structure (e.g. STAR method), impactful action verbs, quantified results, and relevance.
Highlight specific strengths, specific weaknesses, and provide an improved 'Model Answer' that sounds natural and authoritative.`,
      prompt: `INTERVIEW QUESTION:
${data.question}

QUESTION CATEGORY: ${data.category ?? "General"}

CANDIDATE'S PRACTICE ANSWER:
${data.user_answer}`,
      schema: z.object({
        score: z.number().min(0).max(100),
        clarity_score: z.number().min(0).max(100),
        structure_score: z.number().min(0).max(100),
        impact_score: z.number().min(0).max(100),
        summary_verdict: z.string(),
        strengths: z.array(z.string()),
        weaknesses: z.array(z.string()),
        star_analysis: z.object({
          situation_present: z.boolean(),
          task_present: z.boolean(),
          action_present: z.boolean(),
          result_present: z.boolean(),
          feedback: z.string(),
        }),
        improved_model_answer: z.string(),
        follow_up_question: z.string(),
      }),
    });

    return feedback;
  });
