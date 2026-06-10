import type { PackageFormat } from "@/lib/types";

// A renderer-agnostic timeline. The FFmpeg renderer consumes this; it's also
// stored on the RenderJob so the plan is auditable even if media isn't present.

export interface EditSegment {
  order: number;
  kind: "hook" | "intro" | "clip" | "reaction" | "final_take" | "end_card";
  label: string;
  // Media source: a candidate clip (sourceClipKey) or a filmed commentary slot.
  sourceClipId?: string;
  commentarySlot?: string;
  startSec?: number;
  endSec?: number;
  onScreenText?: string;
  lowerThird?: string;
  caption?: string;
  attribution?: string;
  // Absolute path to the filmed commentary file for this slot, if uploaded.
  commentaryFile?: string;
  durationSec: number;
}

export interface EditPlan {
  format: PackageFormat;
  aspectRatio: "9:16";
  width: number;
  height: number;
  hookText?: string;
  segments: EditSegment[];
}

export interface PlanClip {
  id: string;
  rank: number;
  candidateClipId?: string;
  startSec?: number;
  endSec?: number;
  onScreenText?: string;
  lowerThird?: string;
  caption?: string;
  attribution?: string;
}

export interface PlanInput {
  format: PackageFormat;
  hookText?: string;
  clips: PlanClip[]; // approved clips, any order
}

// Builds a 9:16 timeline. Countdown formats place clips in reverse rank order
// (worst → best) with a filmed reaction after each, bookended by hook/intro and
// final take/end card.
export function buildEditPlan(input: PlanInput): EditPlan {
  const isCountdown = input.format === "TOP_7_PLAYS";
  const ordered = input.clips
    .slice()
    .sort((a, b) => (isCountdown ? b.rank - a.rank : a.rank - b.rank));

  const segments: EditSegment[] = [];
  let order = 0;
  const push = (s: Omit<EditSegment, "order">) => segments.push({ ...s, order: order++ });

  push({ kind: "hook", label: "Hook", commentarySlot: "hook", caption: input.hookText, durationSec: 3 });
  push({ kind: "intro", label: "Intro", commentarySlot: "intro", durationSec: 5 });

  for (const clip of ordered) {
    const clipLen = clip.startSec != null && clip.endSec != null ? clip.endSec - clip.startSec : 12;
    push({
      kind: "clip",
      label: `Play #${clip.rank}`,
      sourceClipId: clip.candidateClipId,
      startSec: clip.startSec,
      endSec: clip.endSec,
      onScreenText: clip.onScreenText,
      lowerThird: clip.lowerThird,
      caption: clip.caption,
      attribution: clip.attribution,
      durationSec: Math.max(4, Math.min(clipLen, 20)),
    });
    push({
      kind: "reaction",
      label: `Reaction to #${clip.rank}`,
      commentarySlot: `reaction_play_${clip.rank}`,
      durationSec: 6,
    });
  }

  push({ kind: "final_take", label: "Final take", commentarySlot: "outro", durationSec: 6 });
  push({ kind: "end_card", label: "End card / CTA", caption: "Follow for the daily rundown.", durationSec: 3 });

  return {
    format: input.format,
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    hookText: input.hookText,
    segments,
  };
}

export function planDurationSec(plan: EditPlan): number {
  return plan.segments.reduce((n, s) => n + s.durationSec, 0);
}
