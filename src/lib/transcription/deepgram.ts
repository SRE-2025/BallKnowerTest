import type { Transcriber, TranscribeInput, TranscriptResult } from "./types";

// Real Deepgram prerecorded transcription via their REST API. Requires
// TRANSCRIPTION_API_KEY. Returns utterance-level segments with timestamps.
export function createDeepgramTranscriber(apiKey: string): Transcriber {
  return {
    name: "deepgram",
    async transcribe({ mediaUrl }: TranscribeInput): Promise<TranscriptResult> {
      const res = await fetch(
        "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&utterances=true&punctuate=true",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: mediaUrl }),
        }
      );
      if (!res.ok) {
        throw new Error(`Deepgram error ${res.status}: ${await res.text()}`);
      }
      const data = (await res.json()) as DeepgramResponse;
      const alt = data.results?.channels?.[0]?.alternatives?.[0];
      const utterances = data.results?.utterances ?? [];
      return {
        language: "en",
        provider: "deepgram",
        fullText: alt?.transcript ?? "",
        segments: utterances.map((u) => ({
          startSec: u.start,
          endSec: u.end,
          text: u.transcript,
        })),
      };
    },
  };
}

interface DeepgramResponse {
  results?: {
    channels?: { alternatives?: { transcript?: string }[] }[];
    utterances?: { start: number; end: number; transcript: string }[];
  };
}
