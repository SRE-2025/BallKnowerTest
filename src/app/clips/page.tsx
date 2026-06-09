import { getRepository } from "@/lib/repository";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTimeRange, titleize } from "@/lib/utils";

export default async function ClipsPage() {
  const repo = getRepository();
  const [clips, sources, videos] = await Promise.all([
    repo.getCandidateClips(),
    repo.getSources(),
    repo.getVideos(),
  ]);
  const sourceName = (id: string) => sources.find((s) => s.id === id)?.providerName ?? id;
  const videoTitle = (id: string) => videos.find((v) => v.id === id)?.title ?? id;

  return (
    <div>
      <PageHeader
        title="Candidate Clips"
        description="Auto-detected moments the AI producer can draw from. Each shows why it was detected."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {clips.map((c) => (
          <Card key={c.id}>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="default">{titleize(c.category)}</Badge>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatTimeRange(c.startSec, c.endSec)}
                </span>
              </div>
              <p className="text-sm font-medium">{videoTitle(c.videoId)}</p>
              {c.transcriptExcerpt && (
                <blockquote className="border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground">
                  “{c.transcriptExcerpt}”
                </blockquote>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Source: {sourceName(c.sourceId)}</span>
              </div>
              {c.detectedReason && (
                <p className="rounded-md bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Detected because: </span>
                  {c.detectedReason}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
