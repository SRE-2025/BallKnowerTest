// Seeds Postgres from the same mock data the Phase 1 UI used, so switching
// DATA_SOURCE=mock -> database is a drop-in. Idempotent: clears then inserts.
import { PrismaClient } from "@prisma/client";
import { mockSources } from "../src/mocks/sources";
import { mockVideos } from "../src/mocks/videos";
import { mockCandidateClips } from "../src/mocks/clips";
import { mockPackages } from "../src/mocks/packages";
import { mockUsers } from "../src/mocks/activity";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing existing data...");
  // Order matters for FK constraints.
  await prisma.analytics.deleteMany();
  await prisma.socialPost.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.renderVersion.deleteMany();
  await prisma.renderJob.deleteMany();
  await prisma.commentaryUpload.deleteMany();
  await prisma.filmingPrompt.deleteMany();
  await prisma.showPackageClip.deleteMany();
  await prisma.showPackage.deleteMany();
  await prisma.aiAnalysis.deleteMany();
  await prisma.candidateClip.deleteMany();
  await prisma.transcriptSegment.deleteMany();
  await prisma.transcript.deleteMany();
  await prisma.video.deleteMany();
  await prisma.sourceSettings.deleteMany();
  await prisma.source.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding users...");
  for (const u of mockUsers) {
    await prisma.user.create({ data: { id: u.id, email: u.email, name: u.name, role: u.role } });
  }

  console.log("Seeding sources...");
  for (const s of mockSources) {
    await prisma.source.create({
      data: {
        id: s.id,
        providerName: s.providerName,
        showName: s.showName,
        type: s.type,
        sportLeague: s.sportLeague,
        importMethod: s.importMethod,
        active: s.active,
        notes: s.notes,
        settings: {
          create: {
            allowedPlatforms: s.settings.allowedPlatforms,
            maxClipSeconds: s.settings.maxClipSeconds,
            attributionText: s.settings.attributionText,
            watermarkNotes: s.settings.watermarkNotes,
            notes: s.settings.notes,
          },
        },
      },
    });
  }

  console.log("Seeding videos...");
  for (const v of mockVideos) {
    await prisma.video.create({
      data: {
        id: v.id,
        sourceId: v.sourceId,
        title: v.title,
        externalUrl: v.externalUrl,
        thumbnailUrl: v.thumbnailUrl,
        youTubeId: v.youTubeId,
        mediaUrl: v.mediaUrl,
        durationSec: v.durationSec,
        publishedAt: v.publishedAt ? new Date(v.publishedAt) : null,
        status: v.status,
        // Minimal transcript so hasTranscript renders true.
        transcript: v.hasTranscript
          ? { create: { fullText: `Transcript for ${v.title}`, provider: "seed" } }
          : undefined,
      },
    });
  }

  console.log("Seeding candidate clips...");
  for (const c of mockCandidateClips) {
    await prisma.candidateClip.create({
      data: {
        id: c.id,
        videoId: c.videoId,
        sourceId: c.sourceId,
        startSec: c.startSec,
        endSec: c.endSec,
        category: c.category,
        transcriptExcerpt: c.transcriptExcerpt,
        detectedReason: c.detectedReason,
      },
    });
  }

  console.log("Seeding show packages...");
  for (const p of mockPackages) {
    await prisma.showPackage.create({
      data: {
        id: p.id,
        title: p.title,
        format: p.format,
        status: p.status,
        showDate: new Date(p.showDate),
        summary: p.summary,
        clips: {
          create: p.clips.map((c) => ({
            id: c.id,
            candidateClipId: c.candidateClipId,
            rank: c.rank,
            approvalStatus: c.approvalStatus,
            finalStartSec: c.finalStartSec,
            finalEndSec: c.finalEndSec,
            suggestedTitle: c.suggestedTitle,
            suggestedCaption: c.suggestedCaption,
            suggestedDescription: c.suggestedDescription,
            suggestedHashtags: c.suggestedHashtags,
            suggestedOnScreenText: c.suggestedOnScreenText,
            suggestedLowerThird: c.suggestedLowerThird,
            suggestedVoiceover: c.suggestedVoiceover,
            suggestedTransition: c.suggestedTransition,
            suggestedFilmingPrompt: c.suggestedFilmingPrompt,
            selectionReason: c.selectionReason,
            needsReview: c.needsReview,
            reviewFlags: c.reviewFlags,
          })),
        },
        filmingPrompts: {
          create: p.filmingPrompts.map((fp) => ({
            id: fp.id,
            slot: fp.slot,
            order: fp.order,
            prompt: fp.prompt,
            status: fp.status,
          })),
        },
        renderJobs: { create: { status: p.render.status } },
      },
    });

    // Posting targets as scheduled social posts (need accounts first).
    for (const post of p.posting) {
      const account = await prisma.socialAccount.upsert({
        where: { platform_handle: { platform: post.platform, handle: "@ballknower" } },
        create: { platform: post.platform, handle: "@ballknower", displayName: "BallKnower" },
        update: {},
      });
      await prisma.socialPost.create({
        data: {
          packageId: p.id,
          socialAccountId: account.id,
          platform: post.platform,
          status: post.status,
          scheduledFor: post.scheduledFor ? new Date(post.scheduledFor) : null,
        },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
