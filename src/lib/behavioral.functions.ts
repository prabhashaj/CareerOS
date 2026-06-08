import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const behavioralDrills = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ job_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { generateObject } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const { retrieveCandidateContext } = await import("@/lib/candidate-context.server");
    const { BEHAVIORAL_SYSTEM } = await import("@/lib/prompts.server");

    const { data: job, error } = await supabase.from("jobs").select("*").eq("id", data.job_id).single();
    if (error) throw new Error(error.message);

    const ctx = await retrieveCandidateContext(supabase, userId, `${job.title} behavioral leadership conflict ownership impact`, 14_000);

    const gateway = getGateway();
    const { object: output } = await generateObject({
      model: gateway("google/gemini-2.5-flash"),
      system: BEHAVIORAL_SYSTEM,
      prompt: `JOB:\n${job.title} at ${job.company}\n${(job.description ?? "").slice(0, 3500)}\n\nCANDIDATE CONTEXT:\n${ctx}`,
      schema: z.object({
        drills: z.array(z.object({
          prompt: z.string(),
          probing_for: z.string(),
          common_failures: z.array(z.string()).max(4),
          model_answer: z.object({
            situation: z.string(),
            task: z.string(),
            action: z.string(),
            result: z.string(),
          }),
          follow_ups: z.array(z.string()),
        })),
        coaching_notes: z.array(z.string()),
      }),
    });

    const clean = {
      drills: output.drills.slice(0, 8).map((d) => ({
        ...d,
        common_failures: d.common_failures.slice(0, 4),
        follow_ups: d.follow_ups.slice(0, 4),
      })),
      coaching_notes: output.coaching_notes.slice(0, 6),
    };

    await supabase.from("application_events").insert({
      user_id: userId,
      job_id: job.id,
      event_type: "behavioral_drills_generated",
      payload: { drills: clean.drills.length },
    });

    return clean;
  });
