import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const resetWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      confirm: z.literal("RESET"),
      scopes: z.array(z.enum([
        "jobs",
        "resumes",
        "documents",
        "chunks",
        "profile_extras",
      ])).min(1),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const counts: Record<string, number> = {};

    const wipe = async (table: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count, error } = await (supabase as any)
        .from(table)
        .delete({ count: "exact" })
        .eq("user_id", userId);
      if (error) throw new Error(`${table}: ${error.message}`);
      counts[table] = count ?? 0;
    };

    // Clean up dependent child tables first
    if (data.scopes.includes("resumes")) {
      try { await wipe("resume_versions"); } catch (e) { console.warn(e); }
      await wipe("resumes");
    }
    if (data.scopes.includes("chunks")) {
      await wipe("document_chunks");
    }
    if (data.scopes.includes("documents")) {
      try { await wipe("document_chunks"); } catch (e) { console.warn(e); }
      await wipe("documents");
    }
    if (data.scopes.includes("jobs")) {
      try { await wipe("job_applications"); } catch (e) { console.warn(e); }
      await wipe("jobs");
    }

    if (data.scopes.includes("profile_extras")) {
      await supabase.from("profiles").update({
        preferences: {},
        target_roles: [],
        target_locations: [],
        headline: null,
      }).eq("id", userId);
      counts.profile_extras = 1;
    }

    return { ok: true, counts };
  });
