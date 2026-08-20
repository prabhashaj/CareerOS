import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const InputSchema = z.object({
  title: z.string().min(1).max(300),
  company: z.string().min(1).max(300),
  location: z.string().max(300).optional().nullable(),
  remote: z.boolean().optional().default(false),
  description: z.string().max(80_000).optional().default(""),
  source_url: z.string().url().max(2000),
});

async function authUser(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return { error: new Response(JSON.stringify({ error: "Missing bearer token" }), { status: 401, headers: CORS }) };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return { error: new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: CORS }) };
  return { userId: data.user.id, supabaseAdmin };
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const Route = createFileRoute("/api/public/extension/import-job")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const auth = await authUser(request);
        if ("error" in auth) return auth.error;
        const { userId, supabaseAdmin } = auth;

        let parsed: z.infer<typeof InputSchema>;
        try {
          parsed = InputSchema.parse(await request.json().catch(() => ({})));
        } catch (e) {
          return new Response(JSON.stringify({ error: (e as Error).message }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }

        // 1. Check existing job
        const { data: existing } = await supabaseAdmin
          .from("jobs")
          .select("id, title, company")
          .eq("user_id", userId)
          .eq("source_url", parsed.source_url)
          .maybeSingle();

        let jobId: string | undefined = existing?.id;
        let alreadyExists = false;

        if (existing) {
          alreadyExists = true;
        } else {
          // Insert new job
          const { data: created, error: createErr } = await supabaseAdmin
            .from("jobs")
            .insert({
              user_id: userId,
              source: "scraper" as const,
              source_url: parsed.source_url,
              title: parsed.title,
              company: parsed.company,
              location: parsed.location ?? null,
              remote: !!parsed.remote,
              description: parsed.description || `${parsed.title} at ${parsed.company}`,
              requirements: [],
              skills: [],
            })
            .select("id")
            .single();

          if (createErr) {
            return new Response(JSON.stringify({ error: createErr.message }), {
              status: 500,
              headers: { "Content-Type": "application/json", ...CORS },
            });
          }
          jobId = created.id;
        }

        if (!jobId) {
          return new Response(JSON.stringify({ error: "Failed to create job" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }

        // 2. Ensure application record exists
        const { data: existingApp } = await supabaseAdmin
          .from("job_applications")
          .select("id, match_score")
          .eq("user_id", userId)
          .eq("job_id", jobId)
          .maybeSingle();

        let appId = existingApp?.id;
        let matchScore = existingApp?.match_score ?? null;

        if (!existingApp) {
          const { data: newApp } = await supabaseAdmin
            .from("job_applications")
            .insert({
              user_id: userId,
              job_id: jobId,
              status: "saved",
            })
            .select("id, match_score")
            .single();
          appId = newApp?.id;
          matchScore = newApp?.match_score ?? null;
        }

        // 3. Log event
        await supabaseAdmin.from("application_events").insert({
          user_id: userId,
          job_id: jobId,
          application_id: appId ?? null,
          event_type: "job_imported_via_cdp",
          payload: {
            title: parsed.title,
            company: parsed.company,
            url: parsed.source_url,
          },
        });

        return new Response(
          JSON.stringify({
            ok: true,
            job_id: jobId,
            application_id: appId,
            match_score: matchScore,
            already_exists: alreadyExists,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...CORS },
          },
        );
      },
    },
  },
});
