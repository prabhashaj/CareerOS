import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const prepInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      job_id: z.string().uuid(),
      focus: z.enum(["behavioral", "technical", "mixed"]).default("mixed"),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { generateObject } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const { retrieveCandidateContext } = await import("@/lib/candidate-context.server");
    const { INTERVIEW_SYSTEM } = await import("@/lib/prompts.server");

    const { data: job, error } = await supabase.from("jobs").select("*").eq("id", data.job_id).single();
    if (error) throw new Error(error.message);

    const ctx = await retrieveCandidateContext(supabase, userId, `${job.title} ${job.company} interview behavioral examples`, 14_000);

    const gateway = getGateway();
    const { object: output } = await generateObject({
      model: gateway("google/gemini-2.5-flash"),
      system: INTERVIEW_SYSTEM,
      prompt: `JOB:\n${job.title} at ${job.company}\n${(job.description ?? "").slice(0, 4000)}\n\nFOCUS: ${data.focus}\n\nCANDIDATE CONTEXT:\n${ctx}`,
      schema: z.object({
        questions: z.array(z.object({
          q: z.string(),
          category: z.string(),
          why_asked: z.string(),
        })),
        star_stories: z.array(z.object({
          title: z.string(),
          situation: z.string(),
          task: z.string(),
          action: z.string(),
          result: z.string(),
          covers_questions: z.array(z.string()),
        })),
        questions_to_ask: z.array(z.string()),
        red_flags_to_address: z.array(z.string()),
      }),
    });

    const validCategories = ["behavioral", "technical", "company_fit", "role_specific"];
    const clean = {
      questions: output.questions.slice(0, 10).map((q) => ({
        ...q,
        category: validCategories.includes(q.category) ? q.category : "role_specific",
      })),
      star_stories: output.star_stories.slice(0, 6).map((s) => ({
        ...s,
        covers_questions: s.covers_questions.slice(0, 4),
      })),
      questions_to_ask: output.questions_to_ask.slice(0, 6),
      red_flags_to_address: output.red_flags_to_address.slice(0, 5),
    };

    await supabase.from("application_events").insert({
      user_id: userId,
      job_id: job.id,
      event_type: "interview_prep_generated",
      payload: { questions: clean.questions.length, stories: clean.star_stories.length },
    });

    return clean;
  });
