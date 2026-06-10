import Anthropic from "@anthropic-ai/sdk";

// Returns a configured Anthropic client, or null when no key is set. Callers
// fall back to the deterministic mock producer when this is null, so the AI
// producer feature runs end-to-end with or without credentials.
export function getAnthropic(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

export const PRODUCER_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";
