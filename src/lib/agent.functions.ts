import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  AGENT_RULES,
  PARSE_TOOL_PARAMS,
  RESUME_TOOL_PARAMS,
  callAiJson,
} from "@/lib/agent.server";

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
  .handler(async ({ data }) => {
    const jobBlock = data.jobDescription
      ? `TARGET JOB\nTitle: ${data.jobTitle ?? "unknown"}\nCompany: ${data.company ?? "unknown"}\nDescription:\n${data.jobDescription.slice(0, 50000)}`
      : "No specific job description was supplied — improve the resume generally.";

    const research = data.companyResearch
      ? "The user opted into company context: you may lightly adapt tone to what is broadly known about the company, but never state unverified facts about it in the resume."
      : "Do not add company-specific claims.";

    const result = await callAiJson<{
      resume: unknown;
      reply: string;
      changelog: string[];
      questions: string[];
    }>(
      [
        { role: "system", content: `${AGENT_RULES}\n${research}` },
        {
          role: "user",
          content: `${jobBlock}\n\nCURRENT RESUME JSON\n${JSON.stringify(data.resume)}\n\nUSER REQUEST\n${data.instruction}\n\nReturn the complete updated resume JSON (all sections, even unchanged ones), a short reply, a changelog, and any clarifying questions.`,
        },
      ],
      {
        name: "return_tailored_resume",
        description: "Return the updated resume, a reply, a changelog and clarifying questions.",
        parameters: RESUME_TOOL_PARAMS as unknown as Record<string, unknown>,
      },
    );

    return {
      resumeJson: JSON.stringify(result.resume ?? {}),
      reply: String(result.reply ?? ""),
      changelog: (result.changelog ?? []).map(String),
      questions: (result.questions ?? []).map(String),
    };
  });

export const parseResumeText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ text: z.string().min(20) }).parse(input))
  .handler(async ({ data }) => {
    const parsed = await callAiJson<unknown>(
      [
        {
          role: "system",
          content:
            "Extract a structured resume from raw text. Support full multi-page resumes (1 to 4+ pages). Preserve ALL past roles, projects, skills, education, and certifications. Use only information present in the text — leave fields empty rather than guessing.",
        },
        { role: "user", content: data.text.slice(0, 150000) },
      ],
      {
        name: "return_resume",
        description: "Return the extracted resume JSON.",
        parameters: PARSE_TOOL_PARAMS as unknown as Record<string, unknown>,
      },
    );

    return { resumeJson: JSON.stringify(parsed ?? {}) };
  });

export const parseJobDescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ text: z.string().min(20) }).parse(input))
  .handler(async ({ data }) => {
    return await callAiJson<{
      title: string;
      company: string;
      location: string;
      remote_type: string;
      seniority: string;
      keywords: string[];
    }>(
      [
        {
          role: "system",
          content: "Extract structured facts from a job description. Leave unknown fields empty.",
        },
        { role: "user", content: data.text.slice(0, 12000) },
      ],
      {
        name: "return_job_facts",
        description: "Return the parsed job description facts.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            company: { type: "string" },
            location: { type: "string" },
            remote_type: { type: "string" },
            seniority: { type: "string" },
            keywords: { type: "array", items: { type: "string" } },
          },
          required: ["title", "company", "location", "remote_type", "seniority", "keywords"],
        },
      },
    );
  });
