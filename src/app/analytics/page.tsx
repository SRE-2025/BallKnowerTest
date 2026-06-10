import { getRepository } from "@/lib/repository";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pseudoMetrics } from "@/lib/analytics/metrics";
import { summarize, type PerfRow } from "@/lib/analytics/performance";
import { titleize } from "@/lib/utils";

export default async function AnalyticsPage() {
  const repo = getRepository();
  const [packages, clips, sources] = await Promise.all([
    repo.getPackages(),
    repo.getCandidateClips(),
    repo.getSources(),
  ]);
  const sourceName = (id: string) => sources.find((s) => s.id === id)?.providerName ?? id;
  const candidate = (id: string) => clips.find((c) => c.id === id);

  // Synthesize per-post metrics from the packages so the dashboards render in
  // mock mode. In database mode these come from imported Analytics rows.
  const sourceRows: PerfRow[] = [];
  const categoryRows: PerfRow[] = [];
  const hookRows: PerfRow[] = [];
  const platformRows: PerfRow[] = [];
  let totalViews = 0;

  for (const pkg of packages) {
    for (const post of pkg.posting) {
      for (const clip of pkg.clips) {
        const m = pseudoMetrics(`${pkg.id}:${post.platform}:${clip.id}`);
        totalViews += m.views;
        const cand = candidate(clip.candidateClipId);
        if (cand) {
          sourceRows.push({ key: sourceName(cand.sourceId), metrics: m });
          categoryRows.push({ key: titleize(cand.category), metrics: m });
        }
        if (clip.suggestedOnScreenText) hookRows.push({ key: clip.suggestedOnScreenText, metrics: m });
        platformRows.push({ key: titleize(post.platform), metrics: m });
      }
    }
  }

  return (
    <div>
      <PageHeader
        title="Analytics & Optimization"
        description="Performance by source, category, hook and platform — the signal that feeds future AI ranking."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total views (modeled)" value={totalViews.toLocaleString()} />
        <Stat label="Tracked posts" value={String(packages.reduce((n, p) => n + p.posting.length, 0))} />
        <Stat label="Sources ranked" value={String(new Set(sourceRows.map((r) => r.key)).size)} />
        <Stat label="Hooks tested" value={String(new Set(hookRows.map((r) => r.key)).size)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PerfTable title="Top sources" rows={summarize(sourceRows)} />
        <PerfTable title="Top categories" rows={summarize(categoryRows)} />
        <PerfTable title="Top hooks" rows={summarize(hookRows)} />
        <PerfTable title="By platform" rows={summarize(platformRows)} />
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        These numbers are modeled in mock mode. In database mode, run the analytics importer to load
        real per-post metrics; the same aggregation then feeds the producer&apos;s performance hints.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function PerfTable({
  title,
  rows,
}: {
  title: string;
  rows: { key: string; posts: number; totalViews: number; avgEngagement: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-2 font-medium">Key</th>
              <th className="px-5 py-2 font-medium">Posts</th>
              <th className="px-5 py-2 font-medium">Views</th>
              <th className="px-5 py-2 font-medium">Engagement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.slice(0, 6).map((r) => (
              <tr key={r.key}>
                <td className="px-5 py-2">{r.key}</td>
                <td className="px-5 py-2 tabular-nums text-muted-foreground">{r.posts}</td>
                <td className="px-5 py-2 tabular-nums text-muted-foreground">{r.totalViews.toLocaleString()}</td>
                <td className="px-5 py-2 tabular-nums text-muted-foreground">
                  {(r.avgEngagement * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
