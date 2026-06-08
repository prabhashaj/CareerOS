import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const InputSchema = z.object({
  event_type: z.string().min(1).max(80),
  payload: z.record(z.string().min(1).max(200), z.any()).default({}),
  job_id: z.string().uuid().optional(),
  application_id: z.string().uuid().optional(),
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const Route = createFileRoute("/api/public/extension/event")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") || "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
        if (!token) return new Response("Missing bearer", { status: 401, headers: CORS });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: userData, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !userData.user) return new Response("Invalid token", { status: 401, headers: CORS });

        let body;
        try {
          body = InputSchema.parse(await request.json());
        } catch (e) {
          return new Response(JSON.stringify({ error: (e as Error).message }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }

        await supabaseAdmin.from("application_events").insert({
          user_id: userData.user.id,
          job_id: body.job_id ?? null,
          application_id: body.application_id ?? null,
          event_type: `ext.${body.event_type}`.slice(0, 80),
          payload: body.payload as never,
        });

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...CORS },
        });
      },
    },
  },
});
