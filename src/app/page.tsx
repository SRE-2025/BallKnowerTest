import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { titleize } from "@/lib/utils";

export default async function DashboardPage() {
  const repo = getRepository();
  const [packages, sources, clips, activity] = await Promise.all([
    repo.getPackages(),
    repo.getSources(),
    repo.getCandidateClips(),
    repo.getActivity(),
  ]);

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
