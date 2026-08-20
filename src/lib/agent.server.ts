const DEFAULT_MISTRAL_GATEWAY = "https://api.mistral.ai/v1/chat/completions";

type ChatMessage = { role: "system" | "user"; content: string };

export async function callAiJson<T>(
  messages: ChatMessage[],
  schema: { name: string; description: string; parameters: Record<string, unknown> },
  model?: string,
): Promise<T> {
  const mistralKey = process.env["MISTRAL_API_KEY"] || process.env["VITE_MISTRAL_API_KEY"];
  const genericApiKey = process.env["AI_API_KEY"] || process.env["OPENAI_API_KEY"];
  const apiKey = mistralKey || genericApiKey;

  if (!apiKey) {
    throw new Error(
      "Mistral AI is not configured. Please set MISTRAL_API_KEY in your .env file.",
    );
  }

  const isMistral = !!mistralKey || (!process.env["AI_GATEWAY_URL"] && !genericApiKey);
  const gatewayUrl =
    process.env["AI_GATEWAY_URL"] ||
    (isMistral ? DEFAULT_MISTRAL_GATEWAY : "https://api.mistral.ai/v1/chat/completions");

  const chosenModel =
    model ||
    process.env["AI_MODEL"] ||
    (isMistral ? "mistral-small-latest" : "mistral-small-latest");

  const res = await fetch(gatewayUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model: chosenModel,
      messages,
      max_tokens: 8192,
      tools: [{ type: "function", function: schema }],
      tool_choice: "any",
    }),
  });

  if (res.status === 429) throw new Error("Mistral rate limit reached. Please try again in a moment.");
  if (res.status === 402 || res.status === 403) {
    throw new Error("Mistral AI credits issue or unauthorized. Check your MISTRAL_API_KEY.");
  }
  if (!res.ok) {
    const detail = await res.text();
    console.error("Mistral AI error", res.status, detail);
    throw new Error("The AI agent could not complete this request.");
  }

  const data = (await res.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
        tool_calls?: Array<{ function?: { arguments?: string } }>;
      };
    }>;
  };

  const choice = data.choices?.[0]?.message;
  const args = choice?.tool_calls?.[0]?.function?.arguments;
  if (args) {
    return JSON.parse(args) as T;
  }

  // Fallback to direct JSON content if provided
  if (choice?.content) {
    try {
      return JSON.parse(choice.content) as T;
    } catch {
      // Continue to empty response error
    }
  }

  throw new Error("The AI agent returned an empty response.");
}

export const RESUME_JSON_SHAPE = `{
  "contact": { "name": string, "title": string, "email": string, "phone": string, "location": string, "website": string, "linkedin": string, "github": string },
  "summary": string,
  "experience": [{ "company": string, "role": string, "location": string, "start": string, "end": string, "bullets": string[], "pageBreakBefore": boolean }],
  "education": [{ "school": string, "degree": string, "start": string, "end": string, "details": string, "pageBreakBefore": boolean }],
  "skills": [{ "category": string, "items": string[], "pageBreakBefore": boolean }],
  "projects": [{ "name": string, "link": string, "description": string, "bullets": string[], "pageBreakBefore": boolean }],
  "certifications": [{ "name": string, "issuer": string, "year": string, "pageBreakBefore": boolean }],
  "pageBreaks": { "summary": boolean, "experience": boolean, "skills": boolean, "projects": boolean, "education": boolean, "certifications": boolean },
  "sectionOrder": string[],
  "spacing": { "sectionGap": number, "itemGap": number, "lineHeight": number, "fontSize": number, "pageMargin": number }
}`;

export const AGENT_RULES = `You are the Career Canvas Resume Agent. Hard rules:
- NEVER fabricate employers, job titles, dates, degrees, certifications, or skills the user has not provided.
- Only rephrase, reorder, re-emphasise and tighten existing facts.
- Fully support multi-page resumes (1 page, 2 pages, 3 pages, 4+ pages). Preserve ALL experiences, jobs, projects, skills, education entries, and certifications supplied by the user. Do NOT truncate or drop sections.
- PAGE SPLITTING & LAYOUT EDITING: When the user asks to adjust sections or page breaks (e.g. 'bring project section to new page', 'start projects on page 2', 'move education to new page', 'split section', 'start on next page', 'put skills first', etc.), you MUST apply this layout change by setting "pageBreaks": { "projects": true, ... } or "pageBreakBefore": true on the specific section or item, and/or rearranging "sectionOrder" as requested.
- SPACING & CUSTOMIZATION: When the user asks to adjust spacing, gap, density, margins, or fit on 1 or 2 pages (e.g. 'reduce spacing', 'tighten sections', 'increase gap between jobs'), update "spacing": { "sectionGap": 8..24, "itemGap": 4..14, "lineHeight": 1.25..1.60, "pageMargin": 28..52 }.
- REVERT & UNDO REQUESTS: When the user asks to revert, undo, roll back, or restore previous content or formatting, restore the previous state as requested and state the restored changes in your reply and changelog.
- Optimise for ATS: standard section headers, clean text layout, strong action verbs, quantified impact where the user supplied numbers, keyword coverage drawn from the job description, consistent date formats.
- If a metric or detail is missing, do NOT invent it: add a clarifying question instead and, if you must show a placeholder, wrap it like [ADD METRIC].
- Always explain each change briefly in the changelog.`;

export const RESUME_TOOL_PARAMS = {
  type: "object",
  properties: {
    resume: {
      type: "object",
      description: `The full updated resume in this exact shape: ${RESUME_JSON_SHAPE}`,
      properties: {
        contact: {
          type: "object",
          properties: {
            name: { type: "string" },
            title: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            location: { type: "string" },
            website: { type: "string" },
            linkedin: { type: "string" },
            github: { type: "string" },
          },
          required: ["name", "title", "email", "phone", "location", "website", "linkedin", "github"],
        },
        summary: { type: "string" },
        experience: {
          type: "array",
          items: {
            type: "object",
            properties: {
              company: { type: "string" },
              role: { type: "string" },
              location: { type: "string" },
              start: { type: "string" },
              end: { type: "string" },
              bullets: { type: "array", items: { type: "string" } },
              pageBreakBefore: { type: "boolean" },
            },
            required: ["company", "role", "location", "start", "end", "bullets"],
          },
        },
        education: {
          type: "array",
          items: {
            type: "object",
            properties: {
              school: { type: "string" },
              degree: { type: "string" },
              start: { type: "string" },
              end: { type: "string" },
              details: { type: "string" },
              pageBreakBefore: { type: "boolean" },
            },
            required: ["school", "degree", "start", "end", "details"],
          },
        },
        skills: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              items: { type: "array", items: { type: "string" } },
              pageBreakBefore: { type: "boolean" },
            },
            required: ["category", "items"],
          },
        },
        projects: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              link: { type: "string" },
              description: { type: "string" },
              bullets: { type: "array", items: { type: "string" } },
              pageBreakBefore: { type: "boolean" },
            },
            required: ["name", "link", "description", "bullets"],
          },
        },
        certifications: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              issuer: { type: "string" },
              year: { type: "string" },
              pageBreakBefore: { type: "boolean" },
            },
            required: ["name", "issuer", "year"],
          },
        },
        pageBreaks: {
          type: "object",
          properties: {
            summary: { type: "boolean" },
            experience: { type: "boolean" },
            skills: { type: "boolean" },
            projects: { type: "boolean" },
            education: { type: "boolean" },
            certifications: { type: "boolean" },
          },
        },
        sectionOrder: {
          type: "array",
          items: { type: "string" },
        },
        spacing: {
          type: "object",
          properties: {
            sectionGap: { type: "number" },
            itemGap: { type: "number" },
            lineHeight: { type: "number" },
            fontSize: { type: "number" },
            pageMargin: { type: "number" },
          },
        },
      },
      required: ["contact", "summary", "experience", "education", "skills", "projects", "certifications"],
    },
    reply: { type: "string", description: "Short chat reply to the user (1-3 sentences)." },
    changelog: {
      type: "array",
      description: "Each change made and why.",
      items: { type: "string" },
    },
    questions: {
      type: "array",
      description: "Clarifying questions where information was missing. Empty if none.",
      items: { type: "string" },
    },
  },
  required: ["resume", "reply", "changelog", "questions"],
} as const;

export const JOBS_TOOL_PARAMS = {
  type: "object",
  properties: {
    jobs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          company: { type: "string" },
          location: { type: "string" },
          remote_type: { type: "string", enum: ["Remote", "Hybrid", "On-site"] },
          seniority: { type: "string", enum: ["Intern", "Junior", "Mid", "Senior", "Staff", "Lead"] },
          posted_at: { type: "string", description: "ISO date, within the last 30 days." },
          description: {
            type: "string",
            description:
              "Full job description: responsibilities, required skills, nice-to-haves, stack. 150-260 words.",
          },
          keywords: { type: "array", items: { type: "string" } },
          matched_skills: { type: "array", items: { type: "string" }, description: "Skills from the candidate profile that match this role." },
          missing_skills: { type: "array", items: { type: "string" }, description: "High-value requirements or technologies from this role that candidate could highlight." },
          salary_range: { type: "string", description: "Estimated or posted compensation range (e.g. '$150k - $190k' or 'Competitive')." },
          source_url: { type: "string", description: "Direct official company career portal or direct ATS job posting URL for this specific role." },
          relevance: { type: "number", description: "0-100 relevance to the search." },
        },
        required: [
          "title",
          "company",
          "location",
          "remote_type",
          "seniority",
          "posted_at",
          "description",
          "keywords",
          "source_url",
          "relevance",
        ],
      },
    },
  },
  required: ["jobs"],
} as const;

export const PARSE_TOOL_PARAMS = {
  type: "object",
  properties: RESUME_TOOL_PARAMS.properties.resume.properties,
  required: RESUME_TOOL_PARAMS.properties.resume.required,
} as const;
