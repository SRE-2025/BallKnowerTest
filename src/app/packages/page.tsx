import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { GenerateButton } from "@/components/generate-button";
import { VideoPlayer } from "@/components/video-player";
import { titleize } from "@/lib/utils";

export default async function PackagesPage() {
  const repo = getRepository();
  const [packages, clips, videos] = await Promise.all([
    repo.getPackages(),
    repo.getCandidateClips(),
    repo.getVideos(),
  ]);
  const candidateById = new Map(clips.map((c) => [c.id, c]));
  const videoById = new Map(videos.map((v) => [v.id, v]));
  const leadVideo = (pkg: (typeof packages)[number]) => {
    const lead = pkg.clips.slice().sort((a, b) => a.rank - b.rank)[0];
    const cand = lead ? candidateById.get(lead.candidateClipId) : undefined;
    return { video: cand ? videoById.get(cand.videoId) : undefined, startSec: lead?.finalStartSec };
  };

  return (
    <div>
      <PageHeader
        title="Show Packages"
        description="Every format the AI producer can build. Open one to review, reorder, edit copy and approve."
      >
        <GenerateButton />
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-2">
        {packages.map((pkg) => {
          const { video, startSec } = leadVideo(pkg);
          return (
            <Card key={pkg.id} className="overflow-hidden">
              {video && (
                <VideoPlayer
                  youTubeId={video.youTubeId}
                  thumbnailUrl={video.thumbnailUrl}
                  watchUrl={video.externalUrl}
                  title={pkg.title}
                  startSec={startSec}
                  className="rounded-none"
                />
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle>{pkg.title}</CardTitle>
                  <StatusBadge status={pkg.status} />
                </div>
                <p className="text-sm text-muted-foreground">{pkg.summary}</p>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{titleize(pkg.format)}</Badge>
                  <Badge variant="secondary">{pkg.clips.length} clips</Badge>
                </div>
                <Link
                  href={`/packages/${pkg.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Open →
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
