import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { titleize } from "@/lib/utils";

export default async function PackagesPage() {
  const repo = getRepository();
  const packages = await repo.getPackages();

  return (
    <div>
      <PageHeader
        title="Show Packages"
        description="Every format the AI producer can build. Open one to review, reorder, edit copy and approve."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {packages.map((pkg) => (
          <Card key={pkg.id}>
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
        ))}
      </div>
    </div>
  );
}
