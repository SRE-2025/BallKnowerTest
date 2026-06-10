import type { Transcriber } from "./types";
import { createDeepgramTranscriber } from "./deepgram";
import { mockTranscriber } from "./mock";

// Selects a transcriber from env. Falls back to the mock transcriber whenever no
// key is configured, so the pipeline always runs.
export function getTranscriber(): Transcriber {
  const provider = process.env.TRANSCRIPTION_PROVIDER ?? "mock";
  const key = process.env.TRANSCRIPTION_API_KEY;
  if (provider === "deepgram" && key) return createDeepgramTranscriber(key);
  return mockTranscriber;
}

export type { Transcriber, TranscriptResult } from "./types";
