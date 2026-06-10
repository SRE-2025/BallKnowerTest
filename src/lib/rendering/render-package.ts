import path from "path";
import { prisma } from "@/lib/db";
import { buildEditPlan, type PlanClip } from "./edit-plan";
import { renderEditPlan } from "./ffmpeg-renderer";
import type { Prisma } from "@prisma/client";

// Phase 5 orchestrator: build the edit plan from a package's approved clips,
// render a draft, and record a RenderJob + RenderVersion. Advances the package
// to DRAFT_RENDERED. DB mode only.
export async function renderPackage(packageId: string): Promise<{ renderJobId: string; fileUrl: string; rendered: boolean }> {
  const pkg = await prisma.showPackage.findUnique({
    where: { id: packageId },
    include: { clips: { orderBy: { rank: "asc" } } },
  });
  if (!pkg) throw new Error(`Package ${packageId} not found`);

  const approved = pkg.clips.filter((c) => c.approvalStatus !== "REJECTED");
  const planClips: PlanClip[] = approved.map((c) => ({
    id: c.id,
    rank: c.rank,
    candidateClipId: c.candidateClipId ?? undefined,
    startSec: c.finalStartSec ?? undefined,
    endSec: c.finalEndSec ?? undefined,
    onScreenText: c.suggestedOnScreenText ?? undefined,
    lowerThird: c.suggestedLowerThird ?? undefined,
    caption: c.suggestedCaption ?? undefined,
  }));

  const plan = buildEditPlan({ format: pkg.format, clips: planClips });

  // Splice in any uploaded commentary: match each plan segment's commentarySlot
  // to a FilmingPrompt that has an upload, and attach the local file path.
  const prompts = await prisma.filmingPrompt.findMany({
    where: { packageId },
    include: { upload: true },
  });
  const fileBySlot = new Map<string, string>();
  for (const fp of prompts) {
    if (fp.upload?.fileUrl) {
      // fileUrl like "/uploads/..." served from public/; resolve to disk path.
      fileBySlot.set(fp.slot, path.join(process.cwd(), "public", fp.upload.fileUrl));
    }
  }
  for (const seg of plan.segments) {
    if (seg.commentarySlot && fileBySlot.has(seg.commentarySlot)) {
      seg.commentaryFile = fileBySlot.get(seg.commentarySlot);
    }
  }

  const job = await prisma.renderJob.create({
    data: { packageId, status: "RENDERING", plan: plan as unknown as Prisma.InputJsonValue },
  });

  try {
    const output = await renderEditPlan(plan, packageId);
    const versionCount = await prisma.renderVersion.count({ where: { renderJob: { packageId } } });
    await prisma.renderVersion.create({
      data: { renderJobId: job.id, version: versionCount + 1, fileUrl: output.fileUrl, notes: output.notes },
    });
    await prisma.renderJob.update({ where: { id: job.id }, data: { status: "READY" } });
    await prisma.showPackage.update({ where: { id: packageId }, data: { status: "DRAFT_RENDERED" } });
    await prisma.activityLog.create({
      data: { action: "RENDERED", entity: "ShowPackage", entityId: packageId, metadata: { rendered: output.rendered } },
    });
    return { renderJobId: job.id, fileUrl: output.fileUrl, rendered: output.rendered };
  } catch (e) {
    await prisma.renderJob.update({
      where: { id: job.id },
      data: { status: "FAILED", error: e instanceof Error ? e.message : "render error" },
    });
    throw e;
  }
}
