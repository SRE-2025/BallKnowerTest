import { prisma } from "@/lib/db";
import { summarize, type PerfRow } from "./performance";

// Phase 8 feedback loop: turns historical performance into short hints the AI
// producer can use to bias future selection toward what performed well. Reads
// Analytics joined back to the clips' source and category. DB mode only.
export async function computePerformanceHints(): Promise<string[]> {
  const analytics = await prisma.analytics.findMany({
    include: {
      socialPost: {
        include: {
          package: { include: { clips: { include: { candidateClip: { include: { source: true } } } } } },
        },
      },
    },
  });
  if (analytics.length === 0) return [];

  const sourceRows: PerfRow[] = [];
  const categoryRows: PerfRow[] = [];
  for (const a of analytics) {
    const metrics = { views: a.views, likes: a.likes, comments: a.comments, shares: a.shares, watchTimeSec: a.watchTimeSec };
    for (const clip of a.socialPost.package.clips) {
      const cand = clip.candidateClip;
      if (cand?.source) sourceRows.push({ key: cand.source.providerName, metrics });
      if (cand) categoryRows.push({ key: cand.category, metrics });
    }
  }

  const hints: string[] = [];
  const topSource = summarize(sourceRows)[0];
  const topCategory = summarize(categoryRows)[0];
  if (topSource) hints.push(`Clips from ${topSource.key} have historically driven the highest engagement — weight them up when quality is comparable.`);
  if (topCategory) hints.push(`${topCategory.key} clips have performed best recently — prioritize strong examples of this category.`);
  return hints;
}
