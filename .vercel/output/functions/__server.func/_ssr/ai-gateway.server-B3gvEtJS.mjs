import { c as createMistral } from "../_libs/ai-sdk__mistral.mjs";
import "../_libs/ai-sdk__provider.mjs";
import "../_libs/ai-sdk__provider-utils.mjs";
import "../_libs/eventsource-parser.mjs";
import "../_libs/zod.mjs";
const MODEL_MAP = {
  "google/gemini-2.5-pro": "mistral-large-latest",
  "google/gemini-2.5-flash": "mistral-small-latest",
  "google/gemini-2.5-flash-lite": "mistral-small-latest"
};
function getMistralClient() {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) {
    throw new Error(
      "AI features are unavailable: MISTRAL_API_KEY is not set. Add your Mistral API key to the .env file to enable resume tailoring, cover letters, job ranking, and other AI-powered features. Get your key from: https://console.mistral.ai/api-keys/"
    );
  }
  return createMistral({ apiKey: key });
}
function getGateway() {
  const mistral = getMistralClient();
  return (modelName) => {
    const mapped = MODEL_MAP[modelName] ?? "mistral-small-latest";
    return mistral(mapped);
  };
}
function createLovableAiGatewayProvider(_apiKey) {
  return getGateway();
}
export {
  createLovableAiGatewayProvider,
  getGateway
};
