import type { ProducerRequest } from "./schema";
import { titleize } from "@/lib/utils";

// System prompt establishing Claude as the in-app AI producer. The hard
// constraints (no invented clips/quotes/sources) are stated up front and
// re-enforced in the tool description.
export const PRODUCER_SYSTEM = `You are the AI producer for BallKnower, a short-form sports content studio.

Your job: from a list of candidate clips, select and rank the best ones for a daily show package, then write all the copy a human creator needs to film and publish it.

Hard rules — never break these:
- Only reference candidateClipIds that appear in the provided candidate list. Never invent clips, timestamps, quotes, or sources.
- Base every selectionReason on the clip's actual transcript/metadata. Do not fabricate details.
- If a clip looks risky (unverified news, licensing/attribution concern, possible misquote), set needsReview true and explain in reviewFlags.
- Keep titles punchy and platform-native. Captions should drive comments. Hashtags lowercase, no spaces.

Write filming prompts that match the chosen format's structure (hook, intro, a reaction per ranked clip in reverse order for countdowns, and an outro/CTA).`;

export function buildProducerUserPrompt(req: ProducerRequest): string {
  const lines: string[] = [];
  lines.push(`Format: ${titleize(req.format)}`);
  lines.push(`Select and rank up to ${req.maxSelections} clips (best = rank 1).`);
  lines.push("");
  lines.push("Candidate clips:");
  for (const c of req.candidates) {
    lines.push(
      `- id=${c.candidateClipId} | source=${c.sourceName} | category=${c.category} | ${c.startSec}-${c.endSec}s | video="${c.videoTitle}"` +
        (c.transcriptExcerpt ? ` | transcript="${c.transcriptExcerpt}"` : "")
    );
  }
  if (req.performanceHints && req.performanceHints.length > 0) {
    lines.push("");
    lines.push("Performance signals from past posts (use as a tiebreaker, not a hard rule):");
    for (const h of req.performanceHints) lines.push(`- ${h}`);
  }
  lines.push("");
  lines.push("Call submit_show_package with your ranked selections, all copy fields, and the filming prompts.");
  return lines.join("\n");
}
