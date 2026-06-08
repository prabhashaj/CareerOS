import { createMistral } from "@ai-sdk/mistral";

// ---------------------------------------------------------------------------
// Mistral model mapping
//
// Old Lovable Gateway model names → Mistral equivalents:
//   "google/gemini-2.5-pro"        → mistral-large-latest   (high-quality, resume tailoring)
//   "google/gemini-2.5-flash"      → mistral-small-latest   (fast, cover letters, ranking, etc.)
//   "google/gemini-2.5-flash-lite" → open-mistral-7b        (cheapest, bulk scoring)
// ---------------------------------------------------------------------------

const MODEL_MAP: Record<string, string> = {
  "google/gemini-2.5-pro": "mistral-large-latest",
  "google/gemini-2.5-flash": "mistral-small-latest",
  "google/gemini-2.5-flash-lite": "mistral-small-latest",
};

function getMistralClient() {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) {
    throw new Error(
      "AI features are unavailable: MISTRAL_API_KEY is not set. " +
        "Add your Mistral API key to the .env file to enable resume tailoring, " +
        "cover letters, job ranking, and other AI-powered features. " +
        "Get your key from: https://console.mistral.ai/api-keys/",
    );
  }
  return createMistral({ apiKey: key });
}

/**
 * Returns a callable that accepts the original Gemini model name strings
 * and maps them to the appropriate Mistral model.
 *
 * Usage (unchanged from before):
 *   const gateway = getGateway();
 *   model: gateway("google/gemini-2.5-flash")
 */
export function getGateway() {
  const mistral = getMistralClient();
  return (modelName: string) => {
    const mapped = MODEL_MAP[modelName] ?? "mistral-small-latest";
    return mistral(mapped);
  };
}

/**
 * Named export kept for backward compatibility with api.agent.ts which
 * calls createLovableAiGatewayProvider directly.
 */
export function createLovableAiGatewayProvider(_apiKey: string) {
  // apiKey param is ignored; we now read MISTRAL_API_KEY from env.
  return getGateway();
}
