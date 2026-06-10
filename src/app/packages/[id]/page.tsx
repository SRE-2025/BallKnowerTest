import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository } from "@/lib/repository";
import { ShowBuilder, type BuilderClip } from "./show-builder";
import { PipelineActions } from "@/components/pipeline-actions";
import { CommentaryStudio } from "@/components/commentary-studio";
import { SendToTalent } from "@/components/send-to-talent";
import { slotByFormat } from "@/lib/schedule";
import { RECIPIENTS } from "@/lib/recipients";

export default async function PackageDetailPage({ params }: { params: { id: string } }) {
  const repo = getRepository();
  const [pkg, sources, clips, videos] = await Promise.all([
    repo.getPackage(params.id),
    repo.getSources(),
    repo.getCandidateClips(),
    repo.getVideos(),
  ]);
  if (!pkg) notFound();

  // Enrich each package clip with provenance + transcript context for review.
  const builderClips: BuilderClip[] = pkg.clips
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .map((pc) => {
      const candidate = clips.find((c) => c.id === pc.candidateClipId);
      const video = candidate ? videos.find((v) => v.id === candidate.videoId) : undefined;
      const source = candidate ? sources.find((s) => s.id === candidate.sourceId) : undefined;
      return {
        ...pc,
        sourceName: source?.providerName ?? "Unknown source",
        sourceAttribution: source?.settings.attributionText,
        videoTitle: video?.title ?? "Unknown video",
        youTubeId: video?.youTubeId,
        thumbnailUrl: video?.thumbnailUrl,
        watchUrl: video?.externalUrl,
        startSec: pc.finalStartSec ?? candidate?.startSec ?? 0,
        endSec: pc.finalEndSec ?? candidate?.endSec ?? 0,
        transcriptExcerpt: candidate?.transcriptExcerpt,
      };
    });

  return (
    <div>
      <Link href="/packages" className="text-sm text-muted-foreground hover:text-foreground">
        ← Show Packages
      </Link>
      <ShowBuilder
        packageId={pkg.id}
        title={pkg.title}
        format={pkg.format}
        summary={pkg.summary}
        initialStatus={pkg.status}
        initialClips={builderClips}
        filmingPrompts={pkg.filmingPrompts}
        render={pkg.render}
        posting={pkg.posting}
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CommentaryStudio packageId={pkg.id} prompts={pkg.filmingPrompts} />
        </div>
        <div className="space-y-6">
          <SendToTalent
            packageId={pkg.id}
            talentName={(slotByFormat(pkg.format)?.talentKey === "collin" ? RECIPIENTS.collin : RECIPIENTS.marcus).name}
          />
          <PipelineActions packageId={pkg.id} />
        </div>
      </div>
    </div>
  );
}
