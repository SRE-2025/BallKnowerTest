import { prisma } from "@/lib/db";
import { runProducer } from "./producer";
import type { ProducerInputClip } from "./schema";
import type { PackageFormat } from "@/lib/types";

const FORMAT_MAX: Record<PackageFormat, number> = {
  TOP_7_PLAYS: 7,
  BEST_TAKES: 3,
  DAILY_RUNDOWN: 8,
  BREAKING_NEWS: 2,
  CUSTOM: 10,
};

const FORMAT_TITLE: Record<PackageFormat, string> = {
  TOP_7_PLAYS: "Top 7 Plays of the Day",
  BEST_TAKES: "Best Takes of the Day",
  DAILY_RUNDOWN: "Daily Sports Rundown",
  BREAKING_NEWS: "Breaking News Reaction",
  CUSTOM: "Custom Package",
};

export interface GenerateOptions {
  format: PackageFormat;
  showDate?: Date;
  // Optionally restrict to specific candidate clip IDs (for CUSTOM packages).
  candidateClipIds?: string[];
}

// Pulls candidate clips from the DB, runs the AI producer, and persists a full
// ShowPackage (clips + filming prompts + a queued render job). DB mode only.
export async function generatePackage(opts: GenerateOptions): Promise<{ packageId: string; usedModel: string }> {
  const candidates = await prisma.candidateClip.findMany({
    where: opts.candidateClipIds ? { id: { in: opts.candidateClipIds } } : undefined,
    include: { source: true, video: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  if (candidates.length === 0) throw new Error("No candidate clips available to produce from.");

  const inputClips: ProducerInputClip[] = candidates.map((c) => ({
    candidateClipId: c.id,
    sourceName: c.source.providerName,
    videoTitle: c.video.title,
    category: c.category,
    startSec: c.startSec,
    endSec: c.endSec,
    transcriptExcerpt: c.transcriptExcerpt ?? undefined,
  }));

  // Close the loop: feed historical performance hints into selection.
  const { computePerformanceHints } = await import("@/lib/analytics/feedback");
  const performanceHints = await computePerformanceHints().catch(() => []);

  const { result, usedModel } = await runProducer({
    format: opts.format,
    maxSelections: FORMAT_MAX[opts.format],
    candidates: inputClips,
    performanceHints,
  });

  const byId = new Map(candidates.map((c) => [c.id, c]));

  const pkg = await prisma.showPackage.create({
    data: {
      title: FORMAT_TITLE[opts.format],
      format: opts.format,
      status: "AI_GENERATED",
      showDate: opts.showDate ?? new Date(),
      summary: result.summary,
      clips: {
        create: result.selections.map((s) => {
          const cand = byId.get(s.candidateClipId)!;
          return {
            candidateClipId: s.candidateClipId,
            rank: s.rank,
            approvalStatus: "PENDING" as const,
            finalStartSec: cand.startSec,
            finalEndSec: cand.endSec,
            suggestedTitle: s.suggestedTitle,
            suggestedCaption: s.suggestedCaption,
            suggestedDescription: s.suggestedDescription,
            suggestedHashtags: s.suggestedHashtags,
            suggestedOnScreenText: s.suggestedOnScreenText,
            suggestedLowerThird: s.suggestedLowerThird,
            suggestedVoiceover: s.suggestedVoiceover,
            suggestedTransition: s.suggestedTransition,
            suggestedFilmingPrompt: s.suggestedFilmingPrompt,
            selectionReason: s.selectionReason,
            needsReview: s.needsReview,
            reviewFlags: s.reviewFlags,
          };
        }),
      },
      filmingPrompts: {
        create: result.filmingPrompts.map((fp) => ({
          slot: fp.slot,
          order: fp.order,
          prompt: fp.prompt,
          status: "NEEDED" as const,
        })),
      },
      renderJobs: { create: { status: "QUEUED" } },
    },
  });

  // Persist per-clip AI analyses for auditability.
  const createdClips = await prisma.showPackageClip.findMany({ where: { packageId: pkg.id } });
  await prisma.aiAnalysis.createMany({
    data: result.selections.flatMap((s) => {
      const clip = createdClips.find((c) => c.candidateClipId === s.candidateClipId);
      if (!clip) return [];
      return [{
        candidateClipId: s.candidateClipId,
        model: usedModel,
        rank: s.rank,
        selectionReason: s.selectionReason,
        needsReview: s.needsReview,
        reviewFlags: s.reviewFlags,
      }];
    }),
  });

  await prisma.activityLog.create({
    data: { action: "GENERATED", entity: "ShowPackage", entityId: pkg.id, metadata: { usedModel } },
  });

  return { packageId: pkg.id, usedModel };
}
