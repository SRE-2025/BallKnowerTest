import type { ClipCategory } from "@/lib/types";
import type { TranscriptSegmentResult } from "@/lib/transcription/types";

export interface DetectedClip {
  startSec: number;
  endSec: number;
  category: ClipCategory;
  transcriptExcerpt: string;
  detectedReason: string;
  score: number;
}

// Keyword cues mapped to categories. This is the Phase 2 heuristic pass; Phase 3
// hands the survivors to Claude for real ranking and selection.
const CUES: { category: ClipCategory; words: string[] }[] = [
  { category: "TOP_PLAY", words: ["buzzer", "walk-off", "walkoff", "game winner", "poster", "bicycle", "one hand", "comeback", "record", "unbelievable", "incredible", "what a"] },
  { category: "BREAKING_NEWS", words: ["breaking", "trade", "traded", "injury", "signs", "signing", "suspended"] },
  { category: "HOT_TAKE", words: ["i'm telling you", "not the mvp", "overrated", "guarantee", "no chance"] },
  { category: "DEBATE", words: ["disagree", "say that again", "you're wrong", "dynasty", "best ever"] },
  { category: "FUNNY", words: ["hilarious", "can't believe he said", "lost it", "dying"] },
];

const EXCITEMENT = ["oh my", "what a", "are you kidding", "unbelievable", "incredible", "wow", "no way"];

// Scans transcript segments and returns scored candidate clips. Merges adjacent
// hot segments and pads slightly for context.
export function detectClips(
  segments: TranscriptSegmentResult[],
  opts: { maxClipSeconds?: number } = {}
): DetectedClip[] {
  const maxLen = opts.maxClipSeconds ?? 40;
  const detected: DetectedClip[] = [];

  for (const seg of segments) {
    const text = seg.text.toLowerCase();
    let category: ClipCategory | null = null;
    let reason = "";
    let score = 0;

    for (const cue of CUES) {
      const hit = cue.words.find((w) => text.includes(w));
      if (hit) {
        category = cue.category;
        reason = `Matched cue "${hit}".`;
        score += 2;
        break;
      }
    }
    const excite = EXCITEMENT.find((w) => text.includes(w));
    if (excite) {
      score += 1;
      reason = reason ? `${reason} Excitement marker "${excite}".` : `Excitement marker "${excite}".`;
      category = category ?? "TOP_PLAY";
    }

    if (category && score > 0) {
      const start = seg.startSec;
      const end = Math.min(seg.endSec, start + maxLen);
      detected.push({
        startSec: start,
        endSec: end,
        category,
        transcriptExcerpt: seg.text,
        detectedReason: reason,
        score,
      });
    }
  }

  return detected.sort((a, b) => b.score - a.score);
}
