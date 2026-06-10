import { prisma } from "@/lib/db";
import type { Repository } from "./types";
import type {
  Source,
  Video,
  CandidateClip,
  ShowPackage,
  ShowPackageClip,
  FilmingPrompt,
  PostingInfo,
  RenderInfo,
  ActivityLogEntry,
} from "@/lib/types";

// Phase 2+ implementation. Reads from PostgreSQL via Prisma and maps rows to the
// same domain shapes the mock repository returns, so the UI is unchanged.

type SourceRow = Awaited<ReturnType<typeof loadSources>>[number];
function loadSources() {
  return prisma.source.findMany({ include: { settings: true }, orderBy: { createdAt: "asc" } });
}

function mapSource(s: SourceRow): Source {
  return {
    id: s.id,
    providerName: s.providerName,
    showName: s.showName ?? undefined,
    type: s.type,
    sportLeague: s.sportLeague ?? undefined,
    importMethod: s.importMethod,
    active: s.active,
    notes: s.notes ?? undefined,
    settings: {
      allowedPlatforms: s.settings?.allowedPlatforms ?? [],
      maxClipSeconds: s.settings?.maxClipSeconds ?? 60,
      attributionText: s.settings?.attributionText ?? undefined,
      watermarkNotes: s.settings?.watermarkNotes ?? undefined,
      notes: s.settings?.notes ?? undefined,
    },
  };
}

export const prismaRepository: Repository = {
  async getSources() {
    return (await loadSources()).map(mapSource);
  },
  async getSource(id) {
    const s = await prisma.source.findUnique({ where: { id }, include: { settings: true } });
    return s ? mapSource(s) : null;
  },

  async getVideos() {
    const rows = await prisma.video.findMany({
      include: { transcript: { select: { id: true } } },
      orderBy: { publishedAt: "desc" },
    });
    return rows.map<Video>((v) => ({
      id: v.id,
      sourceId: v.sourceId,
      title: v.title,
      externalUrl: v.externalUrl ?? undefined,
      thumbnailUrl: v.thumbnailUrl ?? undefined,
      youTubeId: v.youTubeId ?? undefined,
      durationSec: v.durationSec,
      publishedAt: v.publishedAt?.toISOString(),
      status: v.status,
      hasTranscript: Boolean(v.transcript),
    }));
  },
  async getVideo(id) {
    const v = await prisma.video.findUnique({
      where: { id },
      include: { transcript: { select: { id: true } } },
    });
    if (!v) return null;
    return {
      id: v.id,
      sourceId: v.sourceId,
      title: v.title,
      externalUrl: v.externalUrl ?? undefined,
      thumbnailUrl: v.thumbnailUrl ?? undefined,
      youTubeId: v.youTubeId ?? undefined,
      durationSec: v.durationSec,
      publishedAt: v.publishedAt?.toISOString(),
      status: v.status,
      hasTranscript: Boolean(v.transcript),
    };
  },

  async getCandidateClips() {
    const rows = await prisma.candidateClip.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(mapClip);
  },
  async getCandidateClip(id) {
    const c = await prisma.candidateClip.findUnique({ where: { id } });
    return c ? mapClip(c) : null;
  },

  async getPackages() {
    const rows = await loadPackages();
    return rows.map(mapPackage);
  },
  async getPackage(id) {
    const p = await prisma.showPackage.findUnique({
      where: { id },
      include: PACKAGE_INCLUDE,
    });
    return p ? mapPackage(p) : null;
  },

  async getActivity() {
    const rows = await prisma.activityLog.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 25,
    });
    return rows.map<ActivityLogEntry>((a) => ({
      id: a.id,
      action: a.action,
      entity: a.entity,
      entityId: a.entityId ?? undefined,
      actor: a.user?.name ?? "System",
      createdAt: a.createdAt.toISOString(),
    }));
  },
};

function mapClip(c: {
  id: string;
  videoId: string;
  sourceId: string;
  startSec: number;
  endSec: number;
  category: CandidateClip["category"];
  transcriptExcerpt: string | null;
  detectedReason: string | null;
}): CandidateClip {
  return {
    id: c.id,
    videoId: c.videoId,
    sourceId: c.sourceId,
    startSec: c.startSec,
    endSec: c.endSec,
    category: c.category,
    transcriptExcerpt: c.transcriptExcerpt ?? undefined,
    detectedReason: c.detectedReason ?? undefined,
  };
}

const PACKAGE_INCLUDE = {
  clips: { orderBy: { rank: "asc" } },
  filmingPrompts: { orderBy: { order: "asc" } },
  renderJobs: { orderBy: { createdAt: "desc" }, take: 1, include: { versions: true } },
  socialPosts: true,
} as const;

function loadPackages() {
  return prisma.showPackage.findMany({
    include: PACKAGE_INCLUDE,
    orderBy: { showDate: "desc" },
  });
}

type PackageRow = Awaited<ReturnType<typeof loadPackages>>[number];

function mapPackage(p: PackageRow): ShowPackage {
  const latestRender = p.renderJobs[0];
  const render: RenderInfo = {
    status: latestRender?.status ?? "QUEUED",
    version: latestRender?.versions.length ?? 0,
    notes: latestRender?.error ?? undefined,
  };
  const posting: PostingInfo[] = p.socialPosts.map((sp) => ({
    platform: sp.platform,
    status: sp.status,
    scheduledFor: sp.scheduledFor?.toISOString(),
  }));
  return {
    id: p.id,
    title: p.title,
    format: p.format,
    status: p.status,
    showDate: p.showDate.toISOString().slice(0, 10),
    summary: p.summary ?? undefined,
    clips: p.clips.map<ShowPackageClip>((c) => ({
      id: c.id,
      candidateClipId: c.candidateClipId ?? "",
      rank: c.rank,
      approvalStatus: c.approvalStatus,
      finalStartSec: c.finalStartSec ?? undefined,
      finalEndSec: c.finalEndSec ?? undefined,
      suggestedTitle: c.suggestedTitle ?? undefined,
      suggestedCaption: c.suggestedCaption ?? undefined,
      suggestedDescription: c.suggestedDescription ?? undefined,
      suggestedHashtags: c.suggestedHashtags,
      suggestedOnScreenText: c.suggestedOnScreenText ?? undefined,
      suggestedLowerThird: c.suggestedLowerThird ?? undefined,
      suggestedVoiceover: c.suggestedVoiceover ?? undefined,
      suggestedTransition: c.suggestedTransition ?? undefined,
      suggestedFilmingPrompt: c.suggestedFilmingPrompt ?? undefined,
      selectionReason: c.selectionReason ?? undefined,
      needsReview: c.needsReview,
      reviewFlags: c.reviewFlags,
    })),
    filmingPrompts: p.filmingPrompts.map<FilmingPrompt>((fp) => ({
      id: fp.id,
      packageId: fp.packageId,
      slot: fp.slot,
      order: fp.order,
      prompt: fp.prompt,
      status: fp.status,
    })),
    render,
    posting,
  };
}
