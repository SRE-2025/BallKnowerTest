"use server";

import { revalidatePath } from "next/cache";

type Result = { ok: true; detail: string } | { ok: false; error: string };

function requireDb(): { ok: false; error: string } | null {
  if ((process.env.DATA_SOURCE ?? "mock") !== "database") {
    return { ok: false, error: "This step persists to the database. Set DATA_SOURCE=database to run it." };
  }
  return null;
}

// Phase 5: render a draft for the package.
export async function renderPackageAction(packageId: string): Promise<Result> {
  const guard = requireDb();
  if (guard) return guard;
  try {
    const { renderPackage } = await import("@/lib/rendering/render-package");
    const out = await renderPackage(packageId);
    revalidatePath(`/packages/${packageId}`);
    return { ok: true, detail: out.rendered ? `Draft rendered: ${out.fileUrl}` : `Edit plan written: ${out.fileUrl}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Render error" };
  }
}

// Phase 7: post an approved package to its scheduled platforms.
export async function postPackageAction(packageId: string): Promise<Result> {
  const guard = requireDb();
  if (guard) return guard;
  try {
    const { postPackage } = await import("@/lib/posting/post-package");
    const out = await postPackage(packageId);
    revalidatePath(`/packages/${packageId}`);
    return { ok: true, detail: `Posted ${out.posted}, failed ${out.failed}.` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Post error" };
  }
}
