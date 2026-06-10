import { prisma } from "@/lib/db";
import { getDiscoverer, resolveMedia, leagueByKey } from "./index";
import type { DiscoverOptions } from "./types";

export interface IngestHighlightsInput {
  sourceId: string;
  league?: string;
  query?: string;
  since?: string;
  resolve?: boolean;
  max?: number;
}

export interface IngestHighlightsResult {
  discovered: number;
  imported: number;
  resolved: number;
  skipped: number;
}

// Discovers highlights (YouTube/league) and persists them as Video + a
// TOP_PLAY CandidateClip the producer can pick. When `resolve` is set and
// downloads are permitted, also pulls the media file and stores its path.
export async function ingestHighlights(input: IngestHighlightsInput): Promise<IngestHighlightsResult> {
  const source = await prisma.source.findUnique({ where: { id: input.sourceId } });
  if (!source) throw new Error(`Source ${input.sourceId} not found`);

  const league = input.league ? leagueByKey(input.league) : undefined;
  const opts: DiscoverOptions = {
    query: input.query ?? league?.query,
    channelIds: league?.channelId ? [league.channelId] : undefined,
    publishedAfter: parseSince(input.since),
    sport: league?.sport,
    maxResults: input.max ?? 12,
  };

  const highlights = await getDiscoverer().discover(opts);
  const result: IngestHighlightsResult = { discovered: highlights.length, imported: 0, resolved: 0, skipped: 0 };

  for (const h of highlights) {
    const existing = await prisma.video.findFirst({
      where: { OR: [{ youTubeId: h.youTubeId ?? undefined }, { externalUrl: h.watchUrl }] },
    });
    if (existing) {
      result.skipped++;
      continue;
    }

    let mediaUrl: string | undefined;
    if (input.resolve && h.youTubeId) {
      try {
        const media = await resolveMedia({ provider: "youtube", youTubeId: h.youTubeId });
        mediaUrl = media.localPath ?? media.mediaUrl;
        result.resolved++;
      } catch {
        // Rights gate / yt-dlp missing — keep the embed, skip the download.
      }
    }

    const durationSec = h.durationSec && h.durationSec > 0 ? h.durationSec : 120;
    const video = await prisma.video.create({
      data: {
        sourceId: input.sourceId,
        title: h.title,
        externalUrl: h.watchUrl,
        thumbnailUrl: h.thumbnailUrl,
        youTubeId: h.youTubeId,
        mediaUrl,
        durationSec,
        publishedAt: h.publishedAt ? new Date(h.publishedAt) : new Date(),
        status: "ANALYZED",
      },
    });

    // One candidate clip per highlight so the AI producer can rank it.
    await prisma.candidateClip.create({
      data: {
        videoId: video.id,
        sourceId: input.sourceId,
        startSec: 0,
        endSec: Math.min(durationSec, 20),
        category: "TOP_PLAY",
        transcriptExcerpt: h.title,
        detectedReason: `Discovered via ${h.sourceName}.`,
      },
    });

    await prisma.activityLog.create({ data: { action: "DISCOVERED", entity: "Video", entityId: video.id } });
    result.imported++;
  }

  return result;
}

function parseSince(since?: string): Date | undefined {
  if (!since) return undefined;
  if (since === "lastnight" || since === "today") return new Date(Date.now() - 30 * 3600 * 1000);
  const d = new Date(since);
  return isNaN(d.getTime()) ? undefined : d;
}
