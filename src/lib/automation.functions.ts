import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Browser automation for job applications.
 *
 * Design constraints:
 *  - The serverless runtime can't run a real browser (no Playwright/Puppeteer).
 *  - Auto-submitting on third-party career sites without explicit human review
 *    is unsafe (CAPTCHAs, ToS, accidental dupes).
 *
 * So we implement a *safe, structured plan*:
 *   1. `draftAutomationPlan` fetches the public application page, asks the AI
 *      to produce a deterministic list of form-fill / click steps using the
 *      candidate's tailored materials, and stores it in `review_queue` for
 *      human approval.
 *   2. A human approves via the review queue (already wired).
 *   3. `confirmSubmission` finalises the application (status = submitted)
 *      and records an event with any external reference id.
 *   4. `cancelAutomation` rolls back if the user aborts.
 *
 * This keeps the user firmly in the loop while still giving them a fully
 * structured, click-by-click submission plan.
 */

const ALLOWED_ACTIONS = ["fill", "select", "check", "click", "upload", "wait"] as const;

const StepSchema = z.object({
  action: z
    .string()
    .transform((s) => s.toLowerCase().trim())
    .pipe(z.enum(ALLOWED_ACTIONS).catch("fill")),
  selector: z.string().min(1).max(500),
  field_label: z.string().max(200).optional().nullable(),
  value: z.string().max(8000).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  required: z.boolean().optional().default(false),
});

const PlanSchema = z.object({
  summary: z.string().max(2000).default(""),
  detected_ats: z.string().max(80).optional().nullable(),
  steps: z.array(StepSchema).max(60).default([]),
  warnings: z.array(z.string().max(500)).max(20).default([]),
});

export type AutomationPlan = z.infer<typeof PlanSchema>;

async function fetchPageHtml(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "JobPilotAI/1.0 (+https://jobpilot.ai)" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    return html.slice(0, 40_000);
  } catch {
    return "";
  }
}

export const draftAutomationPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ application_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { generateObject } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");

    const { data: app, error: appErr } = await supabase
      .from("job_applications")
      .select("*")
      .eq("id", data.application_id)
      .eq("user_id", userId)
      .single();
    if (appErr) throw new Error(appErr.message);

    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", app.job_id)
      .single();
    if (jobErr) throw new Error(jobErr.message);

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    const html = job.source_url ? await fetchPageHtml(job.source_url) : "";

    const gateway = getGateway();
    const promptBody = `JOB: ${job.title} @ ${job.company}
URL: ${job.source_url ?? "(none)"}

CANDIDATE PROFILE:
${JSON.stringify(
  {
    full_name: profile?.full_name,
    email: profile?.email,
    phone: profile?.phone,
    location: profile?.location,
    linkedin: profile?.linkedin_url,
    portfolio: profile?.portfolio_url,
    work_authorization: profile?.work_authorization,
    requires_sponsorship: profile?.requires_sponsorship,
  },
  null,
  2,
)}

TAILORED RESUME (markdown, truncated):
${(app.tailored_resume ?? "").slice(0, 4000)}

COVER LETTER (truncated):
${(app.cover_letter ?? "").slice(0, 3000)}

STORED ANSWERS:
${JSON.stringify(app.answers ?? {}, null, 2).slice(0, 3000)}

APPLICATION PAGE HTML (truncated, may be empty if blocked):
${html || "(unavailable — infer from common ATS patterns: Greenhouse, Lever, Workday, Ashby)"}`;

    const system = `You are an expert browser automation planner for job applications.
Produce a deterministic, ordered list of steps a browser agent should execute
to submit the candidate's application. Use the most stable CSS selectors you
can infer from the page HTML (prefer name=, id=, data-test attributes; fall
back to label text matches with [aria-label] or text= heuristics).

REQUIRED vs OPTIONAL fields:
- Set "required": true ONLY for fields the form marks as required (asterisk *,
  aria-required, "required" attribute, "(required)" text, or fields that
  obviously must be filled to submit — name, email, resume upload, work auth).
- Set "required": false (or omit) for nice-to-have fields like "How did you
  hear about us?", referral, pronouns, demographic/EEO questions, optional
  cover-letter text boxes, "anything else you'd like us to know", etc.
- If you don't have reliable source data for an OPTIONAL field, SKIP it
  entirely — do not emit a step. Never guess.
Never invent data — only use values from the candidate profile, tailored
resume, cover letter, and stored answers. If a REQUIRED field has no source
data, emit a warning instead of guessing. Mark sensitive actions (final
Submit click, file uploads) with a clear note.

Respond ONLY with a JSON object matching this shape:
{
  "summary": string,
  "detected_ats": string | null,
  "steps": [{ "action": "fill"|"select"|"check"|"click"|"upload"|"wait",
              "selector": string, "field_label"?: string, "value"?: string,
              "note"?: string, "required"?: boolean }],
  "warnings": string[]
}`;

    let object: z.infer<typeof PlanSchema>;
    try {
      const res = await generateObject({
        model: gateway("google/gemini-2.5-flash"),
        schema: PlanSchema,
        system,
        prompt: promptBody,
      });
      object = res.object;
    } catch (err) {
      console.error("draftAutomationPlan: primary generateObject failed", err);
      const res = await generateObject({
        model: gateway("google/gemini-2.5-pro"),
        schema: PlanSchema,
        system,
        prompt: promptBody,
      });
      object = res.object;
    }


    // Mark application as drafting and queue for human review
    await supabase
      .from("job_applications")
      .update({ status: "drafting" })
      .eq("id", app.id);

    const { data: review, error: reviewErr } = await supabase
      .from("review_queue")
      .insert({
        user_id: userId,
        application_id: app.id,
        action_type: "auto_fill_form",
        status: "pending",
        title: `Review submission plan for ${job.title} @ ${job.company}`,
        summary: object.summary,
        payload: {
          job_id: job.id,
          source_url: job.source_url,
          detected_ats: object.detected_ats,
          steps: object.steps,
          warnings: object.warnings,
        },
      })
      .select("id")
      .single();
    if (reviewErr) throw new Error(reviewErr.message);

    await supabase.from("application_events").insert({
      user_id: userId,
      application_id: app.id,
      job_id: app.job_id,
      event_type: "automation_plan_drafted",
      payload: { review_id: review.id, step_count: object.steps.length },
    });

    return { ok: true, plan: object, review_id: review.id };
  });

export const confirmSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      application_id: z.string().uuid(),
      external_reference: z.string().max(500).optional(),
      notes: z.string().max(2000).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("job_applications")
      .update({ status: "submitted", submitted_at: now, notes: data.notes ?? null })
      .eq("id", data.application_id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    await supabase.from("application_events").insert({
      user_id: userId,
      application_id: data.application_id,
      event_type: "application_submitted",
      payload: { external_reference: data.external_reference ?? null },
    });

    return { ok: true };
  });

export const cancelAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ application_id: z.string().uuid(), reason: z.string().max(500).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("job_applications")
      .update({ status: "ready_to_apply" })
      .eq("id", data.application_id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    await supabase.from("application_events").insert({
      user_id: userId,
      application_id: data.application_id,
      event_type: "automation_cancelled",
      payload: { reason: data.reason ?? null },
    });
    return { ok: true };
  });
