import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// "Understand me" mode: an AI interview that asks one focused question at a
// time, then saves the full transcript + a distilled profile summary into the
// knowledge base so every downstream agent (ranker, tailoring, interview prep)
// gets richer context.

const Turn = z.object({
  question: z.string().max(1000),
  answer: z.string().max(5000),
});

export const nextUnderstandingQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ history: z.array(Turn).max(40).default([]) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { generateText } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const gateway = getGateway();

    const transcript = data.history
      .map((t, i) => `Q${i + 1}: ${t.question}\nA${i + 1}: ${t.answer}`)
      .join("\n\n");

    const system = `You are a career coach interviewing a candidate to build a rich knowledge base for job applications. Ask ONE focused, open-ended question at a time. Cover (in order of priority, skipping anything already answered): target role & seniority, years of experience, core technical skills with depth, standout projects with measurable impact, achievements & metrics, certifications, education, location & relocation/remote preferences, salary expectations, work authorization, soft skills, career goals. Never repeat a topic. Keep questions short (max 25 words). When you have enough across all major topics OR after ~10 questions, reply with the literal string DONE.`;

    const { text } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system,
      prompt: transcript
        ? `Conversation so far:\n\n${transcript}\n\nWhat is the next single best question? Or reply DONE.`
        : `Start the interview with the most important opening question.`,
    });
    const q = text.trim();
    if (/^done\b/i.test(q) || data.history.length >= 12) {
      return { done: true as const, question: null };
    }
    return { done: false as const, question: q };
  });

export const saveUnderstanding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ history: z.array(Turn).min(1).max(40) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { generateText } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");
    const gateway = getGateway();

    const transcript = data.history
      .map((t, i) => `Q${i + 1}: ${t.question}\nA${i + 1}: ${t.answer}`)
      .join("\n\n");

    let summary = transcript;
    try {
      const { text } = await generateText({
        model: gateway("google/gemini-2.5-flash"),
        prompt: `Convert this candidate interview into a clean Markdown knowledge-base entry with sections: Summary, Target Roles, Skills (bulleted concrete tech & tools), Experience Highlights, Projects, Achievements, Certifications, Education, Preferences (location/remote/salary/authorization), Career Goals. Be faithful — do not invent facts.\n\nINTERVIEW:\n${transcript}`,
      });
      if (text && text.trim().length > 100) summary = text.trim();
    } catch (e) {
      console.error("[saveUnderstanding] distill failed", e);
    }

    const body = `# Candidate Profile (from interview)\n\n${summary}\n\n---\n\n## Raw Interview Transcript\n\n${transcript}`;

    const { data: row, error } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        kind: "knowledge_base",
        title: `Understand-me interview — ${new Date().toLocaleDateString()}`,
        extracted_text: body,
        metadata: { source: "understand_me", turns: data.history.length },
      })
      .select("id, title")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, title: row.title };
  });

export const saveSkillsAndCerts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        skills: z.array(z.string().min(1).max(100)).max(80).default([]),
        certifications: z.array(z.string().min(1).max(200)).max(40).default([]),
        achievements: z.string().max(8000).optional(),
      })
      .refine((v) => v.skills.length || v.certifications.length || (v.achievements && v.achievements.trim().length > 10), {
        message: "Add at least one skill, certification, or achievement.",
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const body = [
      "# Skills & Certifications",
      data.skills.length ? `\n## Skills\n${data.skills.map((s) => `- ${s}`).join("\n")}` : "",
      data.certifications.length
        ? `\n## Certifications\n${data.certifications.map((c) => `- ${c}`).join("\n")}`
        : "",
      data.achievements?.trim() ? `\n## Achievements & Notes\n${data.achievements.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const { data: row, error } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        kind: "knowledge_base",
        title: `Skills & certifications — ${new Date().toLocaleDateString()}`,
        extracted_text: body,
        metadata: { source: "skills_form", skills: data.skills.length, certs: data.certifications.length },
      })
      .select("id, title")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, title: row.title };
  });
