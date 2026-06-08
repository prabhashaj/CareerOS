import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const InputSchema = z.object({
  job_url: z.string().url().max(2000).optional(),
  page_title: z.string().max(500).optional(),
});

async function authUser(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return { error: new Response("Missing bearer token", { status: 401 }) };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return { error: new Response("Invalid token", { status: 401 }) };
  return { userId: data.user.id, supabaseAdmin };
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const Route = createFileRoute("/api/public/extension/context")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const auth = await authUser(request);
        if ("error" in auth) return auth.error;
        const { userId, supabaseAdmin } = auth;

        let parsed;
        try {
          parsed = InputSchema.parse(await request.json().catch(() => ({})));
        } catch (e) {
          return new Response(JSON.stringify({ error: (e as Error).message }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }

        // Profile
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        // Try to match job + application by URL
        let job: { id: string; title: string; company: string; source_url: string | null } | null = null;
        let application:
          | { id: string; answers: unknown; cover_letter: string | null; tailored_resume: string | null }
          | null = null;
        if (parsed.job_url) {
          const { data: jobs } = await supabaseAdmin
            .from("jobs")
            .select("id, title, company, source_url")
            .eq("user_id", userId)
            .eq("source_url", parsed.job_url)
            .limit(1);
          job = jobs?.[0] ?? null;
          if (job) {
            const { data: apps } = await supabaseAdmin
              .from("job_applications")
              .select("id, answers, cover_letter, tailored_resume")
              .eq("user_id", userId)
              .eq("job_id", job.id)
              .limit(1);
            application = apps?.[0] ?? null;
          }
        }

        // Primary resume text (for "paste resume" fields)
        const { data: resumeDoc } = await supabaseAdmin
          .from("documents")
          .select("extracted_text")
          .eq("user_id", userId)
          .eq("kind", "resume")
          .eq("is_primary", true)
          .limit(1)
          .maybeSingle();

        const fullName = profile?.full_name ?? "";
        const [firstName, ...rest] = fullName.split(/\s+/);
        const lastName = rest.join(" ");

        const body = {
          profile: {
            full_name: fullName,
            first_name: firstName || "",
            last_name: lastName || "",
            email: profile?.email ?? "",
            phone: profile?.phone ?? "",
            location: profile?.location ?? "",
            linkedin_url: profile?.linkedin_url ?? "",
            portfolio_url: profile?.portfolio_url ?? "",
            work_authorization: profile?.work_authorization ?? "",
            requires_sponsorship: profile?.requires_sponsorship ? "yes" : "no",
          },
          answers: {
            ...((application?.answers as Record<string, unknown> | null) ?? {}),
            cover_letter: application?.cover_letter ?? "",
            resume_text: resumeDoc?.extracted_text ?? application?.tailored_resume ?? "",
          },
          job,
          application_id: application?.id ?? null,
        };

        // Log the request for transparency
        await supabaseAdmin.from("application_events").insert({
          user_id: userId,
          job_id: job?.id ?? null,
          application_id: application?.id ?? null,
          event_type: "extension_context_fetched",
          payload: { job_url: parsed.job_url, page_title: parsed.page_title },
        });

        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json", ...CORS },
        });
      },
    },
  },
});
