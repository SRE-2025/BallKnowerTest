import { getRepository } from "@/lib/repository";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { titleize } from "@/lib/utils";

export default async function FilmingPage() {
  const repo = getRepository();
  const packages = await repo.getPackages();

  return (
    <div>
      <PageHeader
        title="Filming Prompts"
        description="Exactly what to film for each package. Upload your clips into these slots (wired up in Phase 4)."
      />

      <div className="space-y-6">
        {packages.map((pkg) => (
          <Card key={pkg.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{pkg.title}</CardTitle>
                <Badge variant="secondary">
                  {pkg.filmingPrompts.filter((f) => f.status === "NEEDED").length} to film
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {pkg.filmingPrompts
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((fp) => (
                    <li
                      key={fp.id}
                      className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm"
                    >
                      <Badge variant="outline" className="shrink-0">
                        {titleize(fp.slot)}
                      </Badge>
                      <span className="min-w-0 flex-1 text-muted-foreground">{fp.prompt}</span>
                      <StatusBadge status={fp.status} />
                      <button
                        disabled
                        title="Commentary upload arrives in Phase 4"
                        className="cursor-not-allowed rounded-md border border-dashed border-border px-3 py-1 text-xs text-muted-foreground"
                      >
                        Upload clip
                      </button>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
