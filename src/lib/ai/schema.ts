import { z } from "zod";
import type { ClipCategory, PackageFormat } from "@/lib/types";

// The structured contract the AI producer returns. Mirrors the per-clip fields
// in the spec. Validated with zod so a malformed model response is caught.

export const ProducerSelectionSchema = z.object({
  candidateClipId: z.string(),
  rank: z.number().int(),
  category: z.string(),
  selectionReason: z.string(),
  suggestedTitle: z.string(),
  suggestedCaption: z.string(),
  suggestedDescription: z.string(),
  suggestedHashtags: z.array(z.string()),
  suggestedOnScreenText: z.string(),
  suggestedLowerThird: z.string(),
  suggestedVoiceover: z.string(),
  suggestedTransition: z.string(),
  suggestedFilmingPrompt: z.string(),
  reviewFlags: z.array(z.string()),
  needsReview: z.boolean(),
});

export const ProducerResultSchema = z.object({
  summary: z.string(),
  selections: z.array(ProducerSelectionSchema),
  filmingPrompts: z.array(
    z.object({
      slot: z.string(),
      order: z.number().int(),
      prompt: z.string(),
    })
  ),
});

export type ProducerSelection = z.infer<typeof ProducerSelectionSchema>;
export type ProducerResult = z.infer<typeof ProducerResultSchema>;

// Hand-written JSON Schema for the forced-tool-use call. Kept in sync with the
// zod schema above; using a tool guarantees the model returns parseable JSON.
export const PRODUCER_TOOL = {
  name: "submit_show_package",
  description:
    "Submit the ranked, fully-written show package. You MUST only reference candidateClipIds that were provided. Never invent clips, timestamps, quotes, or sources.",
  input_schema: {
    type: "object" as const,
    properties: {
      summary: { type: "string", description: "One-sentence summary of the package." },
      selections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            candidateClipId: { type: "string", description: "Must be one of the provided candidate clip IDs." },
            rank: { type: "integer", description: "1 = strongest. For Top 7, 1..7." },
            category: { type: "string" },
            selectionReason: { type: "string", description: "Why this clip was selected, in one or two sentences." },
            suggestedTitle: { type: "string" },
            suggestedCaption: { type: "string" },
            suggestedDescription: { type: "string" },
            suggestedHashtags: { type: "array", items: { type: "string" } },
            suggestedOnScreenText: { type: "string" },
            suggestedLowerThird: { type: "string" },
            suggestedVoiceover: { type: "string" },
            suggestedTransition: { type: "string" },
            suggestedFilmingPrompt: { type: "string" },
            reviewFlags: { type: "array", items: { type: "string" } },
            needsReview: { type: "boolean" },
          },
          required: [
            "candidateClipId",
            "rank",
            "category",
            "selectionReason",
            "suggestedTitle",
            "suggestedCaption",
            "suggestedDescription",
            "suggestedHashtags",
            "suggestedOnScreenText",
            "suggestedLowerThird",
            "suggestedVoiceover",
            "suggestedTransition",
            "suggestedFilmingPrompt",
            "reviewFlags",
            "needsReview",
          ],
        },
      },
      filmingPrompts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            slot: { type: "string", description: "e.g. hook, intro, reaction_play_1, outro" },
            order: { type: "integer" },
            prompt: { type: "string" },
          },
          required: ["slot", "order", "prompt"],
        },
      },
    },
    required: ["summary", "selections", "filmingPrompts"],
  },
};

// Maps a free-form category string from the model onto our enum.
export function normalizeCategory(raw: string): ClipCategory {
  const v = raw.toUpperCase().replace(/[^A-Z]/g, "_");
  const allowed: ClipCategory[] = [
    "TOP_PLAY", "DEBATE", "HOT_TAKE", "FUNNY", "BREAKING_NEWS",
    "INTERVIEW_QUOTE", "VIRAL", "CONTROVERSY", "ANALYSIS", "OTHER",
  ];
  return (allowed.find((a) => v.includes(a)) as ClipCategory) ?? "OTHER";
}

export interface ProducerInputClip {
  candidateClipId: string;
  sourceName: string;
  videoTitle: string;
  category: ClipCategory;
  startSec: number;
  endSec: number;
  transcriptExcerpt?: string;
}

export interface ProducerRequest {
  format: PackageFormat;
  maxSelections: number;
  candidates: ProducerInputClip[];
}
