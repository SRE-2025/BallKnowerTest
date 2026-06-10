import { prisma } from "@/lib/db";
import { pseudoMetrics } from "./metrics";

// Phase 8: import per-post analytics. In production this fetches numbers from
// each platform's analytics API; here it synthesizes deterministic metrics and
// upserts Analytics rows so the performance dashboards and feedback loop have
// real DB-backed data. DB mode only.
export async function importAnalytics(): Promise<{ updated: number }> {
  const posts = await prisma.socialPost.findMany({ where: { status: "POSTED" } });
  let updated = 0;
  for (const p of posts) {
    const m = pseudoMetrics(p.id);
    await prisma.analytics.upsert({
      where: { socialPostId: p.id },
      create: { socialPostId: p.id, ...m },
      update: { ...m, fetchedAt: new Date() },
    });
    updated++;
  }
  await prisma.activityLog.create({ data: { action: "ANALYTICS_IMPORTED", entity: "Analytics" } });
  return { updated };
}
