import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const refineDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      application_id: z.string().uuid(),
      target: z.enum(["resume", "cover_letter"]),
      instruction: z.string().min(3).max(2000),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { generateText } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const { REFINE_SYSTEM } = await import("@/lib/prompts.server");

    const { data: app, error } = await supabase
      .from("job_applications")
      .select("id, job_id, tailored_resume, cover_letter")
      .eq("id", data.application_id)
      .eq("user_id", userId)
      .single();
    if (error) throw new Error(error.message);

    const current = data.target === "resume" ? app.tailored_resume : app.cover_letter;
    if (!current) throw new Error("Nothing to refine — generate the draft first.");

    const gateway = getGateway();
    const { text } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system: REFINE_SYSTEM,
      prompt: `TARGET: ${data.target}\n\nINSTRUCTION:\n${data.instruction}\n\nCURRENT DRAFT:\n${current}\n\nReturn the revised document only.`,
    });

    const patch = data.target === "resume" ? { tailored_resume: text } : { cover_letter: text };
    await supabase.from("job_applications").update(patch).eq("id", app.id);
    await supabase.from("application_events").insert({
      user_id: userId,
      job_id: app.job_id,
      application_id: app.id,
      event_type: "draft_refined",
      payload: { target: data.target, instruction: data.instruction.slice(0, 200) },
    });
    return { text };
  });
