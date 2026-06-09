import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository } from "@/lib/repository";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { titleize } from "@/lib/utils";

export default async function SourceSettingsPage({ params }: { params: { id: string } }) {
  const repo = getRepository();
  const source = await repo.getSource(params.id);
  if (!source) notFound();

  const { settings } = source;

  return (
    <div className="max-w-3xl">
      <Link href="/sources" className="text-sm text-muted-foreground hover:text-foreground">
        ← Source Library
      </Link>
      <PageHeader
        title={source.providerName}
        description={source.showName ?? undefined}
      >
        {source.active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        )}
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Field label="Type" value={titleize(source.type)} />
            <Field label="Sport / League" value={source.sportLeague ?? "—"} />
            <Field label="Import method" value={titleize(source.importMethod)} />
            <Field label="Notes" value={source.notes ?? "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Allowed platforms</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {settings.allowedPlatforms.map((p) => (
                  <Badge key={p} variant="info">
                    {titleize(p)}
                  </Badge>
                ))}
              </div>
            </div>
            <Field label="Max clip length" value={`${settings.maxClipSeconds}s`} />
            <Field label="Attribution text" value={settings.attributionText ?? "Not required"} />
            <Field label="Watermark notes" value={settings.watermarkNotes ?? "None"} />
            <Field label="General notes" value={settings.notes ?? "—"} />
          </CardContent>
        </Card>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Phase 1 displays settings read-only from mock data. Editing + persistence arrives with the
        source admin tools in Phase 2.
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
