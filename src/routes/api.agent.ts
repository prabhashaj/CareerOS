import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { getGateway } from "@/lib/ai-gateway.server";

type ChatRequestBody = { messages?: unknown };

const SYSTEM = `You are the **in-app Guide** for CareerOS — a friendly assistant whose ONLY job is to help users navigate and use this application.

You can:
- Explain features (resume upload, job search, ranking, tailoring, review queue, interview prep, analytics, settings).
- Tell users which page/sidebar item to open and what to click next.
- Answer questions about how their data flows through the app.
- Suggest the next useful step inside the product.

You CANNOT and MUST NOT:
- Apply to jobs, submit applications, or take any action on the user's behalf.
- Answer questions unrelated to this application (no general career advice, coding help, trivia). Politely redirect: "I can only help with using CareerOS."

Be warm, short, and concrete. Use small bullet lists and reference real UI labels (Dashboard, Jobs, Review, Documents, Career, Analytics, Settings). Format with markdown.`;

export const Route = createFileRoute("/api/agent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        let gateway: ReturnType<typeof getGateway>;
        try {
          gateway = getGateway();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "AI unavailable";
          return new Response(msg, { status: 503 });
        }

        const result = streamText({
          model: gateway("google/gemini-2.5-flash"),
          system: SYSTEM,
          messages: await convertToModelMessages(messages as UIMessage[]),
        });
        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});

