import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AGENT_RULES } from "@/lib/agent.server";
import { retrieveCandidateContext } from "@/lib/candidate-context.server";

const ResumeSchema = z.object({
  contact: z.object({
    name: z.string().default(""),
    title: z.string().default(""),
    email: z.string().default(""),
    phone: z.string().default(""),
    location: z.string().default(""),
    website: z.string().default(""),
    linkedin: z.string().default(""),
    github: z.string().default(""),
  }).default({
    name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
    github: "",
  }),
  summary: z.string().default(""),
  experience: z.array(
    z.object({
      company: z.string().default(""),
      role: z.string().default(""),
      location: z.string().default(""),
      start: z.string().default(""),
      end: z.string().default(""),
      bullets: z.array(z.string()).default([]),
      pageBreakBefore: z.boolean().optional(),
    })
  ).default([]),
  education: z.array(
    z.object({
      school: z.string().default(""),
      degree: z.string().default(""),
      start: z.string().default(""),
      end: z.string().default(""),
      details: z.string().default(""),
      pageBreakBefore: z.boolean().optional(),
    })
  ).default([]),
  skills: z.array(
    z.object({
      category: z.string().default(""),
      items: z.array(z.string()).default([]),
      pageBreakBefore: z.boolean().optional(),
    })
  ).default([]),
  projects: z.array(
    z.object({
      name: z.string().default(""),
      link: z.string().default(""),
      description: z.string().default(""),
      bullets: z.array(z.string()).default([]),
      pageBreakBefore: z.boolean().optional(),
    })
  ).default([]),
  certifications: z.array(
    z.object({
      name: z.string().default(""),
      issuer: z.string().default(""),
      year: z.string().default(""),
      pageBreakBefore: z.boolean().optional(),
    })
  ).default([]),
});

export const tailorResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        resume: z.any(),
        instruction: z.string().min(1),
        jobTitle: z.string().optional(),
        company: z.string().optional(),
        jobDescription: z.string().optional(),
        companyResearch: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { generateObject } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");

    // Load rich Knowledge Hub + uploaded resumes + profile context
    const knowledgeHubContext = await retrieveCandidateContext(
      supabase,
      userId,
      `${data.jobTitle || ""} ${data.company || ""} ${data.jobDescription || ""}`.trim() || "candidate resume achievements skills",
      16_000,
    );

    const jobBlock = data.jobDescription
      ? `TARGET JOB\nTitle: ${data.jobTitle ?? "unknown"}\nCompany: ${data.company ?? "unknown"}\nDescription:\n${data.jobDescription.slice(0, 50000)}`
      : "No specific job description was supplied — improve the resume generally.";

    const research = data.companyResearch
      ? "The user opted into company context: you may lightly adapt tone to what is broadly known about the company, but never state unverified facts about it in the resume."
      : "Do not add company-specific claims.";

    const TailorResultSchema = z.object({
      resume: ResumeSchema,
      reply: z.string().default("Resume tailored successfully."),
      changelog: z.array(z.string()).default([]),
      questions: z.array(z.string()).default([]),
    });

    const gateway = getGateway();
    const { object: output } = await generateObject({
      model: gateway("google/gemini-2.5-pro"),
      schema: TailorResultSchema,
      system: `${AGENT_RULES}\n${research}\n\nKNOWLEDGE HUB & VERIFIED CANDIDATE PROFILE:\nUse facts, verified metrics, achievements, skills, and projects strictly from the Candidate Profile and Knowledge Hub below. Do not fabricate unverifiable experience.\n${knowledgeHubContext}`,
      prompt: `${jobBlock}\n\nCURRENT RESUME JSON\n${JSON.stringify(data.resume)}\n\nUSER REQUEST\n${data.instruction}\n\nReturn the complete updated resume JSON (all sections, even unchanged ones), a short reply, a changelog, and any clarifying questions.`,
    });

    return {
      resumeJson: JSON.stringify(output.resume ?? {}),
      reply: output.reply,
      changelog: output.changelog,
      questions: output.questions,
    };
  });

export const parseResumeText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ text: z.string().min(10) }).parse(input))
  .handler(async ({ data }) => {
    const { generateObject } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");

    const gateway = getGateway();
    const { object: parsedResume } = await generateObject({
      model: gateway("google/gemini-2.5-flash"),
      schema: ResumeSchema,
      system:
        "Extract a structured resume from raw text. Support full multi-page resumes (1 to 4+ pages). Preserve ALL past roles, projects, skills, education, and certifications. Use only information present in the text — leave fields empty rather than guessing.",
      prompt: `RAW RESUME TEXT:\n${data.text.slice(0, 150000)}`,
    });

    return { resumeJson: JSON.stringify(parsedResume ?? {}) };
  });

export const parseResumeFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        base64: z.string().min(10),
        filename: z.string().min(1),
        mimeType: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { extractTextFromFile } = await import("@/lib/pdf-extraction.server");
    const { generateObject } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");

    const buffer = Buffer.from(data.base64, "base64");
    const text = await extractTextFromFile(buffer, data.mimeType, data.filename);

    if (!text || text.trim().length < 10) {
      throw new Error("No readable text could be extracted from this document file.");
    }

    const gateway = getGateway();
    const { object: parsedResume } = await generateObject({
      model: gateway("google/gemini-2.5-flash"),
      schema: ResumeSchema,
      system:
        "Extract a structured resume from raw text. Support full multi-page resumes (1 to 4+ pages). Preserve ALL past roles, projects, skills, education, and certifications. Use only information present in the text — leave fields empty rather than guessing.",
      prompt: `DOCUMENT FILE (${data.filename}) TEXT:\n${text.slice(0, 150000)}`,
    });

    return {
      extractedText: text,
      resumeJson: JSON.stringify(parsedResume ?? {}),
    };
  });

export const parseJobDescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ text: z.string().min(10) }).parse(input))
  .handler(async ({ data }) => {
    const { generateObject } = await import("ai");
    const { getGateway } = await import("@/lib/ai-gateway.server");

    const JobSchema = z.object({
      title: z.string().default("Target Role"),
      company: z.string().default("Target Company"),
      location: z.string().default("Remote"),
      remote_type: z.string().default("Remote"),
      seniority: z.string().default("Mid"),
      keywords: z.array(z.string()).default([]),
    });

    const gateway = getGateway();
    const { object: parsedJob } = await generateObject({
      model: gateway("google/gemini-2.5-flash"),
      schema: JobSchema,
      system: "Extract job title, company name, location, remote type, seniority, and keywords from the text.",
      prompt: data.text.slice(0, 50000),
    });

    return parsedJob;
  });
