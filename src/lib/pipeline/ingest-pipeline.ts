import { prisma } from "@/lib/db";
import { getConnector } from "@/lib/ingestion";
import { getTranscriber } from "@/lib/transcription";
import { detectClips } from "@/lib/clip-detection";

export interface PipelineResult {
  sourceId: string;
  imported: number;
  transcribed: number;
  clipsDetected: number;
  skipped: number;
}

// Runs the full ingest -> transcribe -> detect flow for one source and persists
// everything to Postgres. Idempotent on externalUrl to avoid duplicate imports.
export async function runIngestPipeline(
  sourceId: string,
  config: Record<string, unknown> = {}
): Promise<PipelineResult> {
  const source = await prisma.source.findUnique({ where: { id: sourceId }, include: { settings: true } });
  if (!source) throw new Error(`Source ${sourceId} not found`);
  if (!source.active) throw new Error(`Source ${sourceId} is inactive`);

  const connector = getConnector(source.importMethod);
  if (!connector) throw new Error(`No connector for import method ${source.importMethod}`);

  const transcriber = getTranscriber();
  const maxClipSeconds = source.settings?.maxClipSeconds ?? 40;

  const result: PipelineResult = {
    sourceId,
    imported: 0,
    transcribed: 0,
    clipsDetected: 0,
    skipped: 0,
  };

  const items = await connector.fetchNew({
    sourceId,
    importMethod: source.importMethod,
    config,
  });

  for (const item of items) {
    // Dedupe by externalUrl when present.
    if (item.externalUrl) {
      const existing = await prisma.video.findFirst({ where: { externalUrl: item.externalUrl } });
      if (existing) {
        result.skipped++;
        continue;
      }
    }

    const video = await prisma.video.create({
      data: {
        sourceId,
        title: item.title,
        externalUrl: item.externalUrl,
        thumbnailUrl: item.thumbnailUrl,
        durationSec: item.durationSec || 120,
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
        status: "IMPORTED",
      },
    });
    result.imported++;

    await logActivity("IMPORTED", "Video", video.id);

    // Transcribe (mock fallback when no media url / no credentials).
    await prisma.video.update({ where: { id: video.id }, data: { status: "TRANSCRIBING" } });
    const transcript = await transcriber.transcribe({
      mediaUrl: item.mediaUrl ?? item.externalUrl ?? "",
      durationSec: item.durationSec || 120,
      title: item.title,
    });

    await prisma.transcript.create({
      data: {
        videoId: video.id,
        language: transcript.language,
        provider: transcript.provider,
        fullText: transcript.fullText,
        segments: {
          create: transcript.segments.map((s) => ({
            startSec: s.startSec,
            endSec: s.endSec,
            text: s.text,
          })),
        },
      },
    });
    await prisma.video.update({ where: { id: video.id }, data: { status: "TRANSCRIBED" } });
    result.transcribed++;

    // Detect candidate clips from the transcript.
    const clips = detectClips(transcript.segments, { maxClipSeconds });
    for (const c of clips) {
      await prisma.candidateClip.create({
        data: {
          videoId: video.id,
          sourceId,
          startSec: c.startSec,
          endSec: c.endSec,
          category: c.category,
          transcriptExcerpt: c.transcriptExcerpt,
          detectedReason: c.detectedReason,
        },
      });
      result.clipsDetected++;
    }
    await prisma.video.update({ where: { id: video.id }, data: { status: "ANALYZED" } });
  }

  return result;
}

async function logActivity(action: string, entity: string, entityId: string) {
  await prisma.activityLog.create({ data: { action, entity, entityId } });
}
