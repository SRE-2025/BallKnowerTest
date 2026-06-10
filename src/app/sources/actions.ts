"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";

// Source admin write path (Phase 2). Persists to Postgres; only meaningful when
// DATA_SOURCE=database. The Repository read seam stays the source of truth for
// reads, so these mutations and the UI reads share one schema.

const SourceInput = z.object({
  providerName: z.string().min(1),
  showName: z.string().optional(),
  type: z.enum([
    "HIGHLIGHT_FEED",
    "TALKING_HEAD_SHOW",
    "YOUTUBE_CHANNEL",
    "RSS_FEED",
    "PARTNER_FEED",
    "UPLOADED_VIDEO",
    "MANUAL_URL",
    "API_SOURCE",
    "CLOUD_STORAGE",
  ]),
  sportLeague: z.string().optional(),
  importMethod: z.enum(["MANUAL_UPLOAD", "MANUAL_URL", "RSS", "API", "CLOUD_FOLDER", "YOUTUBE"]),
  active: z.boolean().default(true),
  notes: z.string().optional(),
  maxClipSeconds: z.coerce.number().int().positive().default(60),
  attributionText: z.string().optional(),
});

export type ActionResult = { ok: true; id: string } | { ok: false; error: string };

export async function createSource(input: unknown): Promise<ActionResult> {
  const parsed = SourceInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors.map((e) => e.message).join(", ") };
  }
  if ((process.env.DATA_SOURCE ?? "mock") !== "database") {
    return { ok: false, error: "Set DATA_SOURCE=database and run migrations to persist sources." };
  }
  const d = parsed.data;
  try {
    const source = await prisma.source.create({
      data: {
        providerName: d.providerName,
        showName: d.showName,
        type: d.type,
        sportLeague: d.sportLeague,
        importMethod: d.importMethod,
        active: d.active,
        notes: d.notes,
        settings: {
          create: {
            maxClipSeconds: d.maxClipSeconds,
            attributionText: d.attributionText,
          },
        },
      },
    });
    await prisma.activityLog.create({
      data: { action: "CREATED", entity: "Source", entityId: source.id },
    });
    revalidatePath("/sources");
    return { ok: true, id: source.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function setSourceActive(id: string, active: boolean): Promise<ActionResult> {
  if ((process.env.DATA_SOURCE ?? "mock") !== "database") {
    return { ok: false, error: "Database mode required." };
  }
  try {
    await prisma.source.update({ where: { id }, data: { active } });
    revalidatePath("/sources");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
