import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const salaryEstimate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      job_id: z.string().uuid(),
      target_total_comp: z.number().int().nonnegative().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { generateText, Output } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const { SALARY_SYSTEM } = await import("@/lib/prompts.server");

    const { data: job, error } = await supabase.from("jobs").select("*").eq("id", data.job_id).single();
    if (error) throw new Error(error.message);
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
    const { data: resume } = await supabase
      .from("documents")
      .select("extracted_text")
      .eq("user_id", userId)
      .eq("kind", "resume")
      .eq("is_primary", true)
      .maybeSingle();

    const gateway = getGateway();
    const { output } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system: SALARY_SYSTEM,
      prompt: `JOB:\n${job.title} at ${job.company}\nLocation: ${job.location ?? "n/a"}${job.remote ? " (remote)" : ""}\nSalary range posted: ${job.salary_min ?? "?"}-${job.salary_max ?? "?"} ${job.salary_currency ?? ""}\nRequirements:\n- ${(job.requirements ?? []).join("\n- ")}\n\nCANDIDATE:\nHeadline: ${profile?.headline ?? ""}\nMin acceptable: ${profile?.min_salary ?? "n/a"}\nTarget total comp: ${data.target_total_comp ?? "n/a"}\nResume excerpt:\n${(resume?.extracted_text ?? "").slice(0, 4000)}`,
      output: Output.object({
        schema: z.object({
          currency: z.string(),
          base_low: z.number(),
          base_mid: z.number(),
          base_high: z.number(),
          total_comp_low: z.number().nullable(),
          total_comp_high: z.number().nullable(),
          equity_notes: z.string().nullable(),
          confidence: z.enum(["low", "medium", "high"]),
          reasoning: z.string(),
          market_signals: z.array(z.string()).max(6),
          recommended_anchor: z.number(),
          negotiation_script: z.object({
            opening: z.string(),
            justification: z.string(),
            counter: z.string(),
            walk_away: z.string(),
          }),
          red_flags: z.array(z.string()).max(5),
        }),
      }),
    });

    await supabase.from("application_events").insert({
      user_id: userId,
      job_id: job.id,
      event_type: "salary_estimated",
      payload: { confidence: output.confidence, anchor: output.recommended_anchor },
    });
    return output;
  });
