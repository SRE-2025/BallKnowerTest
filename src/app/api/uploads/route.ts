import { NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";

// Phase 4: receives a filmed commentary clip for a filming-prompt slot, stores
// it, and (in database mode) records a CommentaryUpload + flips the prompt to
// UPLOADED. In mock mode it still stores the file and returns the URL so the UI
// flow can be exercised without a DB.
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  const filmingPromptId = String(form.get("filmingPromptId") ?? "");

  if (!(file instanceof File) || !filmingPromptId) {
    return NextResponse.json({ error: "file and filmingPromptId are required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "mp4";
  const key = `commentary/${filmingPromptId}-${Date.now()}.${ext}`;
  const stored = await getStorage().put(key, buffer, file.type);

  if ((process.env.DATA_SOURCE ?? "mock") === "database") {
    const { prisma } = await import("@/lib/db");
    await prisma.commentaryUpload.upsert({
      where: { filmingPromptId },
      create: { filmingPromptId, fileUrl: stored.url },
      update: { fileUrl: stored.url },
    });
    await prisma.filmingPrompt.update({
      where: { id: filmingPromptId },
      data: { status: "UPLOADED" },
    });
    await prisma.activityLog.create({
      data: { action: "UPLOADED", entity: "FilmingPrompt", entityId: filmingPromptId },
    });
  }

  return NextResponse.json({ ok: true, url: stored.url, key: stored.key });
}
