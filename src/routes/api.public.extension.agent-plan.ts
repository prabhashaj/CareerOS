import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const InputSchema = z.object({
  job_url: z.string().max(2000).optional().nullable(),
  job_id: z.string().optional().nullable(),
  application_id: z.string().optional().nullable(),
  page_title: z.string().max(500).optional().nullable(),
  detected_fields: z
    .array(
      z.object({
        idx: z.number().optional(),
        label: z.string().optional().nullable(),
        name: z.string().optional().nullable(),
        id: z.string().optional().nullable(),
        tag: z.string().optional(),
        type: z.string().optional().nullable(),
      }),
    )
    .optional(),
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function authUser(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return { error: new Response(JSON.stringify({ error: "Missing bearer token" }), { status: 401, headers: CORS }) };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return { error: new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: CORS }) };
  return { userId: data.user.id, userEmail: data.user.email, userMeta: data.user.user_metadata, supabaseAdmin };
}

export const Route = createFileRoute("/api/public/extension/agent-plan")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const auth = await authUser(request);
          if ("error" in auth) return auth.error;
          const { userId, userEmail, userMeta, supabaseAdmin } = auth;

          let parsed: z.infer<typeof InputSchema>;
          try {
            parsed = InputSchema.parse(await request.json().catch(() => ({})));
          } catch {
            parsed = {};
          }

          // 1. Fetch user profile
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle();

          // 2. Fetch Job & Application
          let job: { id: string; title: string; company: string; source_url: string | null; description?: string | null } | null = null;
          let application: { id: string; answers: unknown; cover_letter: string | null; tailored_resume: string | null; status?: string } | null = null;

          if (parsed.application_id) {
            const { data: app } = await supabaseAdmin
              .from("job_applications")
              .select("id, job_id, answers, cover_letter, tailored_resume, status")
              .eq("id", parsed.application_id)
              .eq("user_id", userId)
              .maybeSingle();
            if (app) {
              application = app;
              const { data: j } = await supabaseAdmin
                .from("jobs")
                .select("id, title, company, source_url, description")
                .eq("id", app.job_id)
                .maybeSingle();
              job = j ?? null;
            }
          } else if (parsed.job_id) {
            const { data: j } = await supabaseAdmin
              .from("jobs")
              .select("id, title, company, source_url, description")
              .eq("id", parsed.job_id)
              .eq("user_id", userId)
              .maybeSingle();
            job = j ?? null;
            if (job) {
              const { data: app } = await supabaseAdmin
                .from("job_applications")
                .select("id, answers, cover_letter, tailored_resume, status")
                .eq("job_id", job.id)
                .eq("user_id", userId)
                .maybeSingle();
              application = app ?? null;
            }
          } else if (parsed.job_url) {
            const { data: jobs } = await supabaseAdmin
              .from("jobs")
              .select("id, title, company, source_url, description")
              .eq("user_id", userId)
              .eq("source_url", parsed.job_url)
              .limit(1);
            job = jobs?.[0] ?? null;
            if (job) {
              const { data: app } = await supabaseAdmin
                .from("job_applications")
                .select("id, answers, cover_letter, tailored_resume, status")
                .eq("job_id", job.id)
                .eq("user_id", userId)
                .maybeSingle();
              application = app ?? null;
            }
          }

          // 3. Fetch Primary Resume & Documents
          const { data: resumeDoc } = await supabaseAdmin
            .from("documents")
            .select("id, title, extracted_text, storage_path")
            .eq("user_id", userId)
            .eq("kind", "resume")
            .eq("is_primary", true)
            .limit(1)
            .maybeSingle();

          // 4. Also fetch active visual resume from `resumes` table if available
          const { data: visualResume } = await supabaseAdmin
            .from("resumes")
            .select("id, title, content, updated_at")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const fullName = profile?.full_name || (userMeta as Record<string, string>)?.full_name || userEmail?.split("@")[0] || "Candidate";
          const [firstName, ...rest] = fullName.split(/\s+/);
          const lastName = rest.join(" ");

          const normalizedProfile = {
            full_name: fullName,
            first_name: firstName || "",
            last_name: lastName || "",
            email: profile?.email || userEmail || "",
            phone: profile?.phone ?? "",
            location: profile?.location ?? "India",
            headline: profile?.headline ?? "",
            linkedin_url: profile?.linkedin_url ?? "",
            portfolio_url: profile?.portfolio_url ?? "",
            github_url: profile?.portfolio_url?.includes("github") ? profile.portfolio_url : "",
            work_authorization: profile?.work_authorization ?? "Indian Citizen / Authorized to work",
            requires_sponsorship: profile?.requires_sponsorship ? "yes" : "no",
            salary_expectations: (profile as Record<string, unknown>)?.target_salary ? String((profile as Record<string, unknown>).target_salary) : "Competitive",
            notice_period: "Immediate",
          };

          const answers: Record<string, string> = {
            ...((application?.answers as Record<string, string> | null) ?? {}),
            full_name: normalizedProfile.full_name,
            first_name: normalizedProfile.first_name,
            last_name: normalizedProfile.last_name,
            email: normalizedProfile.email,
            phone: normalizedProfile.phone,
            location: normalizedProfile.location,
            linkedin_url: normalizedProfile.linkedin_url,
            portfolio_url: normalizedProfile.portfolio_url,
            work_authorization: normalizedProfile.work_authorization,
            requires_sponsorship: normalizedProfile.requires_sponsorship,
            salary: normalizedProfile.salary_expectations,
            notice_period: normalizedProfile.notice_period,
            cover_letter: application?.cover_letter ?? "",
            resume_text: application?.tailored_resume ?? resumeDoc?.extracted_text ?? "",
          };

          // 5. Build CDP-executable Action Plan
          const plan = {
            candidate: normalizedProfile,
            answers,
            resume: {
              text: application?.tailored_resume ?? resumeDoc?.extracted_text ?? "",
              filename: `${fullName ? fullName.replace(/[^a-zA-Z0-9_-]/g, "_") : "Candidate"}_Resume.pdf`,
              doc_id: resumeDoc?.id ?? null,
              visual_resume_id: visualResume?.id ?? null,
            },
            job: job
              ? {
                  id: job.id,
                  title: job.title,
                  company: job.company,
                  url: job.source_url,
                }
              : null,
            application_id: application?.id ?? null,
            actions: [
              { type: "inspect_fields", desc: "Scan form inputs and match with candidate knowledge base" },
              { type: "fill_standard_fields", desc: "Dispatch human-like input typing for name, email, links" },
              { type: "upload_resume", desc: "Upload tailored PDF resume via CDP DOM.setFileInputFiles" },
              { type: "fill_qa_answers", desc: "Fill custom application screening questions" },
              { type: "pause_for_review", desc: "Keep page open for user review before final submission" },
            ],
          };

          // Log telemetry (safely without breaking if table errors)
          try {
            await supabaseAdmin.from("application_events").insert({
              user_id: userId,
              job_id: job?.id ?? null,
              application_id: application?.id ?? null,
              event_type: "agent_plan_generated",
              payload: { job_url: parsed.job_url ?? job?.source_url, target: "chrome-agent-cdp" },
            });
          } catch {
            // ignore telemetry failure
          }

          return new Response(JSON.stringify({ ok: true, plan }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        } catch (err) {
          console.error("[agent-plan error]", err);
          return new Response(
            JSON.stringify({
              ok: false,
              error: err instanceof Error ? err.message : "Failed to build agent plan",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...CORS },
            },
          );
        }
      },
    },
  },
});
