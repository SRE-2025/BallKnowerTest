import type { Transcriber, TranscribeInput, TranscriptResult } from "./types";

// Deterministic fallback transcriber. Generates plausible timed segments so the
// pipeline runs end-to-end with no transcription credentials (dev/CI/demo).
export const mockTranscriber: Transcriber = {
  name: "mock",
  async transcribe({ durationSec = 120, title = "clip" }: TranscribeInput): Promise<TranscriptResult> {
    const lines = [
      "And here's the moment everyone is talking about.",
      "Watch this — he sets, he goes, and oh my goodness.",
      "Unbelievable. You will not see a better play tonight.",
      "The crowd is on their feet. What a finish.",
      "That is one for the highlight reel, no question.",
    ];
    const segCount = Math.max(3, Math.min(lines.length, Math.round(durationSec / 25)));
    const span = durationSec / segCount;
    const segments = Array.from({ length: segCount }, (_, i) => ({
      startSec: Math.round(i * span),
      endSec: Math.round((i + 1) * span),
      text: lines[i % lines.length],
    }));
    return {
      language: "en",
      provider: "mock",
      fullText: `${title}: ${segments.map((s) => s.text).join(" ")}`,
      segments,
    };
  },
};
