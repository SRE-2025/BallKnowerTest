"use server";

import { revalidatePath } from "next/cache";
import type { PackageFormat } from "@/lib/types";

// Triggers the AI producer to generate a new package. Works in database mode
// (DATA_SOURCE=database); in mock mode it explains what's needed, since
// generation persists to the DB.
export async function generatePackageAction(
  format: PackageFormat
): Promise<{ ok: true; packageId: string; usedModel: string } | { ok: false; error: string }> {
  if ((process.env.DATA_SOURCE ?? "mock") !== "database") {
    return {
      ok: false,
      error:
        "Generation persists to the database. Set DATA_SOURCE=database, run migrations + seed, then try again. With no ANTHROPIC_API_KEY the deterministic fallback producer is used.",
    };
  }
  try {
    const { generatePackage } = await import("@/lib/ai/generate-package");
    const { packageId, usedModel } = await generatePackage({ format });
    revalidatePath("/packages");
    revalidatePath("/");
    return { ok: true, packageId, usedModel };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
