export interface TranscriptSegmentResult {
  startSec: number;
  endSec: number;
  text: string;
}

export interface TranscriptResult {
  language: string;
  provider: string;
  fullText: string;
  segments: TranscriptSegmentResult[];
}

export interface TranscribeInput {
  mediaUrl: string;
  durationSec?: number;
  title?: string;
}

// Every transcription backend implements this. Swap providers via env without
// touching the pipeline.
export interface Transcriber {
  readonly name: string;
  transcribe(input: TranscribeInput): Promise<TranscriptResult>;
}
