import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * End-to-end "apply assist" pipeline for a single job:
 *   1. Embed the job (if needed)
 *   2. Rank the job vs the candidate
 *   3. Generate tailored resume
 *   4. Generate cover letter
 *   5. Queue a human review item before any external submission
 */
export const runApplyPipeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ job_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { indexJob } = await import("@/lib/retrieval.functions");
    const { rankJob } = await import("@/lib/ranking.functions");
    const { tailorResume, generateCoverLetter } = await import("@/lib/tailoring.functions");

    const steps: Record<string, string | number | boolean | null> = {};

    // Step 1 — embed job (best-effort)
    try {
      await indexJob({ data: { job_id: data.job_id } });
      steps.indexed = true;
    } catch (e) {
      steps.indexed = false;
      steps.index_error = (e as Error).message;
    }

    // Step 2 — rank
    const ranking = await rankJob({ data: { job_id: data.job_id, persist: true } });
    steps.score = ranking.score;


    // Step 3 — tailored resume
    const resume = await tailorResume({ data: { job_id: data.job_id } });
    steps.resume_length = resume.resume.length;

    // Step 4 — cover letter
    const cover = await generateCoverLetter({ data: { job_id: data.job_id, tone: "confident" } });
    steps.cover_letter_length = cover.cover_letter.length;

    // Step 5 — queue human review
    const { data: app } = await supabase
      .from("job_applications")
      .select("id")
      .eq("user_id", userId)
      .eq("job_id", data.job_id)
      .maybeSingle();

    if (app) {
      await supabase.from("review_queue").insert({
        user_id: userId,
        application_id: app.id,
        action_type: "submit_application",
        status: "pending",
        title: "Review tailored application before submission",
        summary: "AI generated a tailored resume and cover letter. Approve before any browser submission.",
        payload: { job_id: data.job_id, score: ranking.score },
      });
    }

    await supabase.from("application_events").insert({
      user_id: userId,
      job_id: data.job_id,
      event_type: "pipeline_completed",
      payload: steps,
    });

    return { ok: true, steps };
  });

/**
 * Apply-Agent helper: runs the full pipeline against the top-N highest-matching
 * jobs in the user's pipeline. Used by the floating Apply Agent chat.
 */
export const applyToTopJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ count: z.number().int().min(1).max(20).default(5) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: apps } = await supabase
      .from("job_applications")
      .select("job_id, match_score")
      .eq("user_id", userId)
      .order("match_score", { ascending: false, nullsFirst: false })
      .limit(data.count);

    const jobIds = (apps ?? []).map((a) => a.job_id as string).filter(Boolean);
    if (jobIds.length === 0) {
      return {
        processed: 0,
        results: [] as Array<{ job_id: string; ok: boolean; error?: string }>,
        message: "No ranked jobs yet — run 'Rank all' first.",
      };
    }

    const { rankJob } = await import("@/lib/ranking.functions");
    const { tailorResume, generateCoverLetter } = await import("@/lib/tailoring.functions");
    const results: Array<{ job_id: string; ok: boolean; error?: string }> = [];
    for (const job_id of jobIds) {
      try {
        const ranking = await rankJob({ data: { job_id, persist: true } });
        await tailorResume({ data: { job_id } });
        await generateCoverLetter({ data: { job_id, tone: "confident" } });
        const { data: app } = await supabase
          .from("job_applications")
          .select("id")
          .eq("user_id", userId)
          .eq("job_id", job_id)
          .maybeSingle();
        if (app) {
          await supabase.from("review_queue").insert({
            user_id: userId,
            application_id: app.id,
            action_type: "submit_application",
            status: "pending",
            title: "Review tailored application before submission",
            summary: "Apply Agent generated a tailored resume and cover letter.",
            payload: { job_id, score: ranking.score },
          });
        }
        results.push({ job_id, ok: true });
      } catch (e) {
        results.push({ job_id, ok: false, error: (e as Error).message });
      }
    }
    return {
      processed: results.length,
      results,
      message: `Queued ${results.filter((r) => r.ok).length}/${results.length} tailored applications for your review.`,
    };
  });

