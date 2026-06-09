import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { titleize } from "@/lib/utils";

export default async function SourcesPage() {
  const repo = getRepository();
  const sources = await repo.getSources();

  return (
    <div>
      <PageHeader
        title="Source Library"
        description="Where every clip comes from. Provenance and usage settings stay visible across the platform."
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Provider</th>
                  <th className="px-5 py-3 font-medium">Show</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Sport / League</th>
                  <th className="px-5 py-3 font-medium">Import</th>
                  <th className="px-5 py-3 font-medium">Platforms</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sources.map((s) => (
                  <tr key={s.id} className="hover:bg-accent/40">
                    <td className="px-5 py-3 font-medium">{s.providerName}</td>
                    <td className="px-5 py-3 text-muted-foreground">{s.showName ?? "—"}</td>
                    <td className="px-5 py-3">
                      <Badge variant="secondary">{titleize(s.type)}</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{s.sportLeague ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{titleize(s.importMethod)}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {s.settings.allowedPlatforms.length}
                    </td>
                    <td className="px-5 py-3">
                      {s.active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/sources/${s.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Settings →
                      </Link>
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
