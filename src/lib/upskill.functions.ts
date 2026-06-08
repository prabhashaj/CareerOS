import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const upskillPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ job_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { generateObject } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const { loadCandidateText } = await import("@/lib/candidate-context.server");
    const { UPSKILL_SYSTEM } = await import("@/lib/prompts.server");

    const { data: job, error } = await supabase.from("jobs").select("*").eq("id", data.job_id).single();
    if (error) throw new Error(error.message);

    const candidateContext = await loadCandidateText(supabase, userId, 12_000);

    const gateway = getGateway();
    const { object: output } = await generateObject({
      model: gateway("google/gemini-2.5-flash"),
      system: UPSKILL_SYSTEM,
      prompt: `JOB:\n${job.title} at ${job.company}\nSkills: ${(job.skills ?? []).join(", ")}\nRequirements:\n- ${(job.requirements ?? []).join("\n- ")}\n\nDescription:\n${(job.description ?? "").slice(0, 5000)}\n\nCANDIDATE CONTEXT:\n${candidateContext}`,
      schema: z.object({
        summary: z.string(),
        gaps: z.array(z.object({
          skill: z.string(),
          severity: z.string(),
          current_level: z.string(),
          target_level: z.string(),
          why: z.string(),
        })),
        plan: z.array(z.object({
          week: z.number(),
          focus: z.string(),
          actions: z.array(z.string()),
        })),
        resources: z.array(z.object({
          title: z.string(),
          kind: z.string(),
          url: z.string().optional(),
          why: z.string(),
        })),
      }),
    });

    const clean = {
      summary: output.summary,
      gaps: output.gaps.slice(0, 12).map((g) => ({
        ...g,
        severity: ["nice_to_have", "important", "critical"].includes(g.severity) ? g.severity : "important",
        current_level: ["none", "basic", "intermediate", "advanced"].includes(g.current_level) ? g.current_level : "basic",
        target_level: ["basic", "intermediate", "advanced"].includes(g.target_level) ? g.target_level : "intermediate",
      })),
      plan: output.plan.slice(0, 8).map((p, i) => ({ ...p, week: Math.max(1, Math.min(12, Math.round(p.week || i + 1))), actions: p.actions.slice(0, 6) })),
      resources: output.resources.slice(0, 12).map((r) => ({ ...r, kind: ["course", "doc", "book", "video", "project", "article"].includes(r.kind) ? r.kind : "article" })),
    };

    await supabase.from("application_events").insert({
      user_id: userId,
      job_id: job.id,
      event_type: "upskill_plan_generated",
      payload: { gaps: clean.gaps.length },
    });

    return clean;
  });
