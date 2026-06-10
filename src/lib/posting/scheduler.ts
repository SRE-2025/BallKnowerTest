import { prisma } from "@/lib/db";
import { postPackage } from "./post-package";

export interface SchedulerResult {
  packagesProcessed: number;
  posted: number;
  failed: number;
}

// Phase 7 scheduler: posts every approved package that has at least one due
// social post (scheduledFor in the past or unset). Run on a cron/interval —
// e.g. `npm run scheduler` from a scheduled job, or hit it from a worker.
export async function postDuePackages(now: Date = new Date()): Promise<SchedulerResult> {
  const duePosts = await prisma.socialPost.findMany({
    where: {
      status: "SCHEDULED",
      OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }],
      package: { status: "APPROVED_FOR_POSTING" },
    },
    select: { packageId: true },
    distinct: ["packageId"],
  });

  const result: SchedulerResult = { packagesProcessed: 0, posted: 0, failed: 0 };
  for (const { packageId } of duePosts) {
    try {
      const out = await postPackage(packageId);
      result.packagesProcessed++;
      result.posted += out.posted;
      result.failed += out.failed;
    } catch {
      result.failed++;
    }
  }
  return result;
}
