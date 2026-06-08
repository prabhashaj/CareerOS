import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type WritingStyle = {
  tone: string[];
  perspective: string;
  sentence_length: string;
  vocabulary: string;
  signature_moves: string[];
  avoids: string[];
  formatting_habits: string[];
  summary: string;
};

export const analyzeWritingStyle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ samples: z.string().min(80).max(40_000) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ style: WritingStyle }> => {
    const { supabase, userId } = context;
    const { generateText, Output } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const { STYLE_ANALYZE_SYSTEM } = await import("@/lib/prompts.server");

    const gateway = getGateway();
    const { output } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system: STYLE_ANALYZE_SYSTEM,
      prompt: data.samples,
      output: Output.object({
        schema: z.object({
          tone: z.array(z.string()).max(6),
          perspective: z.string(),
          sentence_length: z.string(),
          vocabulary: z.string(),
          signature_moves: z.array(z.string()).max(8),
          avoids: z.array(z.string()).max(8),
          formatting_habits: z.array(z.string()).max(6),
          summary: z.string(),
        }),
      }),
    });

    const { data: profile } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", userId)
      .single();
    const prefs = (profile?.preferences as Record<string, unknown> | null) ?? {};
    prefs.writing_style = output;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("profiles").update({ preferences: prefs as any }).eq("id", userId);

    return { style: output as WritingStyle };
  });

export const clearWritingStyle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", userId)
      .single();
    const prefs = (profile?.preferences as Record<string, unknown> | null) ?? {};
    delete prefs.writing_style;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("profiles").update({ preferences: prefs as any }).eq("id", userId);
    return { ok: true };
  });
