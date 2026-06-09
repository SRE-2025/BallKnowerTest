import { getRepository } from "@/lib/repository";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { formatTimecode } from "@/lib/utils";

export default async function VideosPage() {
  const repo = getRepository();
  const [videos, sources] = await Promise.all([repo.getVideos(), repo.getSources()]);
  const sourceName = (id: string) => sources.find((s) => s.id === id)?.providerName ?? id;

  return (
    <div>
      <PageHeader
        title="Videos"
        description="Imported source videos. In Phase 2 these arrive from real ingestion + transcription."
      />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                  <th className="px-5 py-3 font-medium">Duration</th>
                  <th className="px-5 py-3 font-medium">Transcript</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {videos.map((v) => (
                  <tr key={v.id} className="hover:bg-accent/40">
                    <td className="px-5 py-3 font-medium">{v.title}</td>
                    <td className="px-5 py-3 text-muted-foreground">{sourceName(v.sourceId)}</td>
                    <td className="px-5 py-3 tabular-nums text-muted-foreground">
                      {formatTimecode(v.durationSec)}
                    </td>
                    <td className="px-5 py-3">
                      {v.hasTranscript ? (
                        <Badge variant="success">Yes</Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={v.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
