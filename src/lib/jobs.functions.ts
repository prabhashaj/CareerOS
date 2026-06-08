import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const employmentType = z.enum(["full_time", "part_time", "contract", "internship", "temporary"]);

export const listJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("jobs")
      .select("id, title, company, location, remote, employment_type, source, source_url, salary_min, salary_max, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getJob = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: job, error } = await supabase.from("jobs").select("*").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    return job;
  });

export const createJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      title: z.string().min(1).max(200),
      company: z.string().min(1).max(200),
      location: z.string().max(200).optional(),
      remote: z.boolean().optional(),
      employment_type: employmentType.optional(),
      source_url: z.string().url().max(2000).optional(),
      description: z.string().max(50_000).optional(),
      requirements: z.array(z.string().max(500)).max(50).optional(),
      skills: z.array(z.string().max(100)).max(50).optional(),
      salary_min: z.number().int().nonnegative().optional(),
      salary_max: z.number().int().nonnegative().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("jobs")
      .insert({ ...data, user_id: userId, source: "manual" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const ingestJobFromUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        url: z.string().url().max(2000).optional(),
        rawText: z.string().max(50_000).optional(),
      })
      .refine((v) => !!(v.url || v.rawText), {
        message: "Provide a URL or paste the job description.",
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    let text = "";
    let sourceUrl: string | null = data.url ?? null;

    if (data.rawText && data.rawText.trim().length > 50) {
      text = data.rawText.trim().slice(0, 30_000);
    } else if (data.url) {
      const apiKey = process.env.FIRECRAWL_API_KEY;
      if (!apiKey) {
        throw new Error(
          "URL scraping isn't configured. Paste the job description text instead.",
        );
      }
      try {
        const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: data.url,
            formats: ["markdown"],
            onlyMainContent: true,
          }),
          signal: AbortSignal.timeout(25_000),
        });
        if (!res.ok) {
          throw new Error(
            `Could not load that URL (status ${res.status}). Paste the job description text instead.`,
          );
        }
        const json = (await res.json()) as {
          data?: { markdown?: string };
          markdown?: string;
        };
        const markdown = json.data?.markdown ?? json.markdown ?? "";
        text = markdown.replace(/\s+/g, " ").trim().slice(0, 30_000);
      } catch (e) {
        throw new Error(
          e instanceof Error
            ? e.message
            : "Could not load that URL. Paste the job description manually instead.",
        );
      }
    }

    if (text.length < 80) {
      throw new Error("Not enough readable text to parse. Paste the full job description.");
    }

    const { generateText, Output } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const gateway = getGateway();

    // Relaxed schema: every field nullable / optional so the model can't fail validation.
    const Schema = z.object({
      title: z.string().nullish(),
      company: z.string().nullish(),
      location: z.string().nullish(),
      remote: z.boolean().nullish(),
      employment_type: employmentType.nullish(),
      description: z.string().nullish(),
      requirements: z.array(z.string()).max(30).nullish(),
      skills: z.array(z.string()).max(30).nullish(),
      salary_min: z.number().int().nullish(),
      salary_max: z.number().int().nullish(),
    });

    let parsed: z.infer<typeof Schema>;
    try {
      const { output } = await generateText({
        model: gateway("google/gemini-2.5-flash"),
        output: Output.object({ schema: Schema }),
        prompt: `Extract structured job posting fields from the content below. Return JSON only. Use null for any field that is not present. Do not invent values.\n\n${sourceUrl ? `SOURCE URL: ${sourceUrl}\n\n` : ""}CONTENT:\n${text}`,
      });
      parsed = output;
    } catch {
      throw new Error(
        "AI couldn't parse that posting. Try pasting a cleaner copy of the job description.",
      );
    }

    const { data: row, error } = await supabase
      .from("jobs")
      .insert({
        user_id: userId,
        source: data.url ? "url_paste" : "manual",
        source_url: sourceUrl,
        title: parsed.title ?? "Untitled role",
        company: parsed.company ?? "Unknown",
        location: parsed.location ?? null,
        remote: parsed.remote ?? false,
        employment_type: parsed.employment_type ?? null,
        description: parsed.description ?? text.slice(0, 5000),
        requirements: parsed.requirements ?? [],
        skills: parsed.skills ?? [],
        salary_min: parsed.salary_min ?? null,
        salary_max: parsed.salary_max ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });


export const deleteJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("jobs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
