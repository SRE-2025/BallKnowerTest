import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { VideoPlayer } from "@/components/video-player";
import { titleize, formatTimeRange } from "@/lib/utils";

export default async function DashboardPage() {
  const repo = getRepository();
  const [packages, sources, clips, videos, activity] = await Promise.all([
    repo.getPackages(),
    repo.getSources(),
    repo.getCandidateClips(),
    repo.getVideos(),
    repo.getActivity(),
  ]);

  const candidateById = new Map(clips.map((c) => [c.id, c]));
  const videoById = new Map(videos.map((v) => [v.id, v]));
  const videoForClip = (candidateClipId: string) => {
    const cand = candidateById.get(candidateClipId);
    return cand ? videoById.get(cand.videoId) : undefined;
  };

  const top7 = packages.find((p) => p.format === "TOP_7_PLAYS") ?? packages[0];

  const activeSources = sources.filter((s) => s.active).length;
  const promptsNeeded = packages.reduce(
    (n, p) => n + p.filmingPrompts.filter((fp) => fp.status === "NEEDED").length,
    0
  );

  return (
    <div>
      <PageHeader
        title="Daily Dashboard"
        description="Today's AI-generated show packages. Nothing posts without your approval."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Show packages" value={packages.length} hint="generated today" />
        <StatCard label="Candidate clips" value={clips.length} hint="detected" />
        <StatCard label="Active sources" value={activeSources} hint={`of ${sources.length}`} />
        <StatCard label="Filming prompts" value={promptsNeeded} hint="to record" />
      </div>

      {top7 && (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {top7.title} — tap to play
            </h2>
            <Link href={`/packages/${top7.id}`} className="text-sm font-medium text-primary hover:underline">
              Open show builder →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {top7.clips
              .slice()
              .sort((a, b) => a.rank - b.rank)
              .map((clip) => {
                const video = videoForClip(clip.candidateClipId);
                return (
                  <div key={clip.id} className="space-y-1.5">
                    <VideoPlayer
                      youTubeId={video?.youTubeId}
                      thumbnailUrl={video?.thumbnailUrl}
                      watchUrl={video?.externalUrl}
                      title={clip.suggestedTitle ?? video?.title ?? "Play"}
                      startSec={clip.finalStartSec}
                    />
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                        {clip.rank}
                      </span>
                      <p className="line-clamp-1 text-sm font-medium">
                        {clip.suggestedTitle ?? video?.title}
                      </p>
                    </div>
                    {video && (
                      <p className="text-[11px] text-muted-foreground">
                        {formatTimeRange(clip.finalStartSec ?? 0, clip.finalEndSec ?? 0)} · {video.title.slice(0, 40)}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </section>
      )}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Today&apos;s packages
      </h2>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {packages.map((pkg) => {
          const flagged = pkg.clips.filter((c) => c.needsReview).length;
          return (
            <Card key={pkg.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle>{pkg.title}</CardTitle>
                  <StatusBadge status={pkg.status} />
                </div>
                <p className="text-sm text-muted-foreground">{pkg.summary}</p>
              </CardHeader>
              <CardContent className="mt-auto space-y-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">{titleize(pkg.format)}</Badge>
                  <Badge variant="secondary">{pkg.clips.length} clips</Badge>
                  <Badge variant="secondary">
                    {pkg.filmingPrompts.length} filming prompts
                  </Badge>
                  {flagged > 0 && <Badge variant="warning">{flagged} need review</Badge>}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Render:</span>
                  <StatusBadge status={pkg.render.status} />
                  <span className="ml-2">Posting:</span>
                  <span>{pkg.posting.map((p) => titleize(p.platform)).join(", ")}</span>
                </div>
                <Link
                  href={`/packages/${pkg.id}`}
                  className="inline-flex text-sm font-medium text-primary hover:underline"
                >
                  Open show builder →
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Recent activity
      </h2>
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {activity.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span>
                  <span className="font-medium">{a.actor}</span>{" "}
                  <span className="text-muted-foreground">
                    {titleize(a.action).toLowerCase()} {titleize(a.entity).toLowerCase()}
                  </span>{" "}
                  <code className="text-xs text-muted-foreground">{a.entityId}</code>
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(a.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
