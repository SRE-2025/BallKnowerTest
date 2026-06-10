import { prisma } from "@/lib/db";
import { getPostingProvider } from "./index";

// Phase 7 orchestrator: posts an APPROVED_FOR_POSTING package to each scheduled
// platform. Tracks status per SocialPost, retries transient failures with
// exponential backoff, and records the posted URL or error. DB mode only.
export async function postPackage(packageId: string): Promise<{ posted: number; failed: number }> {
  const pkg = await prisma.showPackage.findUnique({
    where: { id: packageId },
    include: {
      socialPosts: true,
      clips: { orderBy: { rank: "asc" }, take: 1 },
      renderJobs: { orderBy: { createdAt: "desc" }, take: 1, include: { versions: { orderBy: { version: "desc" }, take: 1 } } },
    },
  });
  if (!pkg) throw new Error(`Package ${packageId} not found`);
  if (pkg.status !== "APPROVED_FOR_POSTING") {
    throw new Error(`Package must be APPROVED_FOR_POSTING (is ${pkg.status}).`);
  }

  const videoUrl = pkg.renderJobs[0]?.versions[0]?.fileUrl;
  if (!videoUrl) throw new Error("No rendered draft to post. Render the package first.");

  const lead = pkg.clips[0];
  const title = lead?.suggestedTitle ?? pkg.title;
  const description = pkg.summary ?? title;
  const hashtags = lead?.suggestedHashtags ?? [];

  let posted = 0;
  let failed = 0;

  for (const sp of pkg.socialPosts) {
    if (sp.status === "POSTED") continue;
    if (sp.scheduledFor && sp.scheduledFor.getTime() > Date.now()) continue; // not due yet

    await prisma.socialPost.update({ where: { id: sp.id }, data: { status: "POSTING" } });
    const provider = getPostingProvider(sp.platform);

    const result = await withRetry(() =>
      provider.post({ platform: sp.platform, title, description, hashtags, videoUrl, scheduledFor: sp.scheduledFor ?? undefined })
    );

    if (result.ok) {
      posted++;
      await prisma.socialPost.update({
        where: { id: sp.id },
        data: { status: "POSTED", postedUrl: result.postedUrl, error: null },
      });
    } else {
      failed++;
      await prisma.socialPost.update({
        where: { id: sp.id },
        data: { status: "FAILED", error: result.error },
      });
    }
  }

  if (failed === 0 && posted > 0) {
    await prisma.showPackage.update({ where: { id: packageId }, data: { status: "POSTED" } });
  }
  await prisma.activityLog.create({
    data: { action: "POSTED", entity: "ShowPackage", entityId: packageId, metadata: { posted, failed } },
  });

  return { posted, failed };
}

// Retries up to 4 times with exponential backoff on a non-ok result/throw.
async function withRetry<T extends { ok: boolean }>(fn: () => Promise<T>): Promise<T> {
  let last: T | undefined;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      last = await fn();
      if (last.ok) return last;
    } catch {
      // fall through to backoff
    }
    await new Promise((r) => setTimeout(r, 2 ** attempt * 500));
  }
  return last ?? ({ ok: false, error: "exhausted retries" } as unknown as T);
}
