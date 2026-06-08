import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("job_applications")
      .select("id, job_id, status, match_score, match_breakdown, submitted_at, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const ids = (data ?? []).map((a) => a.job_id).filter(Boolean);
    if (ids.length === 0) return [];
    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, title, company, location, remote, source_url")
      .in("id", ids);
    const jobMap = new Map((jobs ?? []).map((j) => [j.id, j]));
    return (data ?? []).map((a) => ({ ...a, job: jobMap.get(a.job_id) ?? null }));
  });

export const getApplication = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: app, error } = await supabase
      .from("job_applications")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    const { data: job } = await supabase.from("jobs").select("*").eq("id", app.job_id).single();
    return { application: app, job };
  });

export const getApplicationForJob = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ job_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: app } = await supabase
      .from("job_applications")
      .select("*")
      .eq("user_id", userId)
      .eq("job_id", data.job_id)
      .maybeSingle();
    return app;
  });

const statusEnum = z.enum([
  "saved",
  "drafting",
  "ready_to_apply",
  "submitted",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
]);
export type ApplicationStatus = z.infer<typeof statusEnum>;

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: statusEnum }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const patch: { status: ApplicationStatus; submitted_at?: string } = { status: data.status };
    if (data.status === "submitted") patch.submitted_at = new Date().toISOString();
    const { error } = await supabase
      .from("job_applications")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabase.from("application_events").insert({
      user_id: userId,
      application_id: data.id,
      event_type: `status_${data.status}`,
      payload: {},
    });
    return { ok: true };
  });

export const updateApplicationContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        tailored_resume: z.string().max(100_000).optional(),
        cover_letter: z.string().max(50_000).optional(),
        notes: z.string().max(10_000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const patch: { tailored_resume?: string; cover_letter?: string; notes?: string } = {};
    if (data.tailored_resume !== undefined) patch.tailored_resume = data.tailored_resume;
    if (data.cover_letter !== undefined) patch.cover_letter = data.cover_letter;
    if (data.notes !== undefined) patch.notes = data.notes;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await supabase
      .from("job_applications")
      .update(patch)
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });



export const listReviewQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("review_queue")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const appIds = Array.from(new Set(rows.map((r) => r.application_id).filter(Boolean))) as string[];
    if (appIds.length === 0) {
      return rows.map((r) => ({ ...r, application: null, job: null }));
    }
    const { data: apps } = await supabase
      .from("job_applications")
      .select("id, job_id, status, match_score, answers")
      .in("id", appIds);
    const appMap = new Map((apps ?? []).map((a) => [a.id, a]));
    const jobIds = Array.from(
      new Set((apps ?? []).map((a) => a.job_id).filter(Boolean)),
    ) as string[];
    const { data: jobs } = jobIds.length
      ? await supabase
          .from("jobs")
          .select("id, title, company, location, remote, source_url")
          .in("id", jobIds)
      : { data: [] };
    const jobMap = new Map((jobs ?? []).map((j) => [j.id, j]));
    return rows.map((r) => {
      const app = r.application_id ? (appMap.get(r.application_id) ?? null) : null;
      const job = app?.job_id ? (jobMap.get(app.job_id) ?? null) : null;
      return { ...r, application: app, job };
    });
  });

export const decideReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      decision: z.enum(["approved", "rejected"]),
      notes: z.string().max(2000).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("review_queue")
      .update({
        status: data.decision,
        decided_at: new Date().toISOString(),
        decided_by: userId,
        decision_notes: data.notes ?? null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
