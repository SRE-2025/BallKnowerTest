"use server";

import { revalidatePath } from "next/cache";

type Result = { ok: true } | { ok: false; error: string };

function requireDb(): Result | null {
  if ((process.env.DATA_SOURCE ?? "mock") !== "database") {
    return { ok: false, error: "Approvals persist to the database. Set DATA_SOURCE=database." };
  }
  return null;
}

// Phase 6: record an approval decision. Approving advances the package to
// APPROVED_FOR_POSTING and writes an Approval row (the audit trail). Rejecting
// sends it back to NEEDS_CHANGES so the team can regenerate or edit.
export async function recordApproval(packageId: string, approved: boolean, note?: string): Promise<Result> {
  const guard = requireDb();
  if (guard) return guard;
  try {
    const { prisma } = await import("@/lib/db");
    const approver =
      (await prisma.user.findFirst({ where: { role: "APPROVER" } })) ??
      (await prisma.user.findFirst({ where: { role: "ADMIN" } }));
    await prisma.approval.create({
      data: { packageId, userId: approver?.id ?? "system", approved, note },
    });
    await prisma.showPackage.update({
      where: { id: packageId },
      data: { status: approved ? "APPROVED_FOR_POSTING" : "NEEDS_CHANGES" },
    });
    await prisma.activityLog.create({
      data: { action: approved ? "APPROVED" : "REQUESTED_CHANGES", entity: "ShowPackage", entityId: packageId },
    });
    revalidatePath(`/packages/${packageId}`);
    revalidatePath("/approvals");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// Advance a reviewed package to the filming/render stage.
export async function markReadyForFilming(packageId: string): Promise<Result> {
  const guard = requireDb();
  if (guard) return guard;
  try {
    const { prisma } = await import("@/lib/db");
    await prisma.showPackage.update({ where: { id: packageId }, data: { status: "READY_FOR_FILMING" } });
    await prisma.activityLog.create({
      data: { action: "READY_FOR_FILMING", entity: "ShowPackage", entityId: packageId },
    });
    revalidatePath(`/packages/${packageId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
