import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ReviewResult = {
  overall_score: number; // 0-100
  resume_score: number | null;
  cover_score: number | null;
  strengths: string[];
  issues: { severity: "low" | "med" | "high"; area: string; message: string; suggested_fix?: string }[];
  rewrite_suggestions: { target: "resume" | "cover_letter"; before?: string; after: string; reason: string }[];
  summary: string;
};

export const reviewApplicationDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      application_id: z.string().uuid(),
      enqueue: z.boolean().default(true),
    }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ review: ReviewResult; review_id: string | null }> => {
    const { supabase, userId } = context;
    const { generateObject } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const { REVIEWER_SYSTEM } = await import("@/lib/prompts.server");

    const { data: app, error } = await supabase
      .from("job_applications")
      .select("id, job_id, tailored_resume, cover_letter, match_score")
      .eq("id", data.application_id)
      .eq("user_id", userId)
      .single();
    if (error) throw new Error(error.message);
    if (!app.tailored_resume && !app.cover_letter)
      throw new Error("Nothing to review yet — generate a resume or cover letter first.");

    const { data: job } = await supabase.from("jobs").select("title, company, description, skills, requirements").eq("id", app.job_id).single();

    const prompt = `JOB:\nTitle: ${job?.title}\nCompany: ${job?.company}\nSkills: ${(job?.skills ?? []).join(", ")}\nRequirements:\n- ${(job?.requirements ?? []).join("\n- ")}\nDescription:\n${(job?.description ?? "").slice(0, 4000)}

RESUME DRAFT:
${app.tailored_resume ?? "(none)"}

COVER LETTER DRAFT:
${app.cover_letter ?? "(none)"}

Critique strictly. Return JSON only.`;

    const gateway = getGateway();
    const { object: output } = await generateObject({
      model: gateway("google/gemini-2.5-flash"),
      system: REVIEWER_SYSTEM,
      prompt,
      schema: z.object({
        overall_score: z.number(),
        resume_score: z.number().nullable(),
        cover_score: z.number().nullable(),
        summary: z.string(),
        strengths: z.array(z.string()),
        issues: z.array(z.object({
          severity: z.string(),
          area: z.string(),
          message: z.string(),
          suggested_fix: z.string().optional(),
        })),
        rewrite_suggestions: z.array(z.object({
          target: z.string(),
          before: z.string().optional(),
          after: z.string(),
          reason: z.string(),
        })),
      }),
    });

    const clampScore = (n: number | null) => n == null ? null : Math.max(0, Math.min(100, Math.round(n)));
    const review: ReviewResult = {
      overall_score: clampScore(output.overall_score) ?? 0,
      resume_score: clampScore(output.resume_score),
      cover_score: clampScore(output.cover_score),
      summary: output.summary,
      strengths: output.strengths.slice(0, 8),
      issues: output.issues.slice(0, 15).map((issue) => ({
        ...issue,
        severity: ["low", "med", "high"].includes(issue.severity) ? issue.severity as "low" | "med" | "high" : "med",
      })),
      rewrite_suggestions: output.rewrite_suggestions.slice(0, 8).map((suggestion) => ({
        ...suggestion,
        target: suggestion.target === "cover_letter" ? "cover_letter" : "resume",
      })),
    };

    let review_id: string | null = null;
    if (data.enqueue) {
      const { data: rq } = await supabase
        .from("review_queue")
        .insert({
          user_id: userId,
          application_id: app.id,
          action_type: "submit_application",
          status: "pending",
          title: `Reviewer pass: ${job?.title ?? "application"} @ ${job?.company ?? ""}`.trim(),
          summary: review.summary,
          payload: { review },
        })
        .select("id")
        .single();
      review_id = rq?.id ?? null;
    }

    await supabase.from("application_events").insert({
      user_id: userId,
      job_id: app.job_id,
      application_id: app.id,
      event_type: "application_reviewed",
      payload: { overall_score: review.overall_score, issues: review.issues.length },
    });

    return { review, review_id };
  });
