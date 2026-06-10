import { getAnthropic, PRODUCER_MODEL } from "./client";
import { PRODUCER_SYSTEM, buildProducerUserPrompt } from "./prompts";
import { PRODUCER_TOOL, ProducerResultSchema, type ProducerRequest, type ProducerResult } from "./schema";
import { mockProduce } from "./mock-producer";

// Runs the AI producer. Uses Claude via forced tool use when a key is present;
// otherwise falls back to the deterministic mock producer. Always returns a
// validated ProducerResult constrained to the provided candidate IDs.
export async function runProducer(req: ProducerRequest): Promise<{ result: ProducerResult; usedModel: string }> {
  const client = getAnthropic();
  if (!client) {
    return { result: sanitize(mockProduce(req), req), usedModel: "mock" };
  }

  try {
    // Force the model to answer through the tool so we get structured JSON.
    const message = await client.messages.create({
      model: PRODUCER_MODEL,
      max_tokens: 8000,
      system: PRODUCER_SYSTEM,
      tools: [PRODUCER_TOOL],
      tool_choice: { type: "tool", name: PRODUCER_TOOL.name },
      messages: [{ role: "user", content: buildProducerUserPrompt(req) }],
    });

    const toolUse = message.content.find(
      (b): b is Extract<typeof b, { type: "tool_use" }> => b.type === "tool_use"
    );
    if (!toolUse) throw new Error("Model did not return a tool_use block");

    const parsed = ProducerResultSchema.parse(toolUse.input);
    return { result: sanitize(parsed, req), usedModel: PRODUCER_MODEL };
  } catch (err) {
    // Never hard-fail the pipeline on a model/parse error — fall back.
    console.error("AI producer error, falling back to mock:", err);
    return { result: sanitize(mockProduce(req), req), usedModel: "mock-fallback" };
  }
}

// Enforce the "never invent clips" rule defensively: drop any selection whose
// candidateClipId was not in the request, and clamp to maxSelections.
function sanitize(result: ProducerResult, req: ProducerRequest): ProducerResult {
  const validIds = new Set(req.candidates.map((c) => c.candidateClipId));
  const selections = result.selections
    .filter((s) => validIds.has(s.candidateClipId))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, req.maxSelections)
    .map((s, i) => ({ ...s, rank: i + 1 }));
  return { ...result, selections };
}
