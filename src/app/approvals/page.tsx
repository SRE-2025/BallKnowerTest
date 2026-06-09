import Link from "next/link";
import { getRepository } from "@/lib/repository";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { titleize } from "@/lib/utils";

const GATES: { key: string; label: string }[] = [
  { key: "clips", label: "Clips reviewed" },
  { key: "filming", label: "Ready for filming" },
  { key: "render", label: "Ready for render" },
  { key: "draft", label: "Draft rendered" },
  { key: "posting", label: "Approved for posting" },
];

const STATUS_ORDER = [
  "AI_GENERATED",
  "IN_REVIEW",
  "NEEDS_CHANGES",
  "READY_FOR_FILMING",
  "READY_FOR_RENDER",
  "DRAFT_RENDERED",
  "APPROVED_FOR_POSTING",
  "POSTED",
];

export default async function ApprovalsPage() {
  const repo = getRepository();
  const packages = await repo.getPackages();

  return (
    <div>
      <PageHeader
        title="Approvals"
        description="The control gates. A package only posts after a human approves it — never automatically."
      />

      <div className="space-y-4">
        {packages.map((pkg) => {
          const idx = STATUS_ORDER.indexOf(pkg.status);
          const gateDone = (gateKey: string) => {
            switch (gateKey) {
              case "clips":
                return idx >= STATUS_ORDER.indexOf("READY_FOR_FILMING");
              case "filming":
                return idx >= STATUS_ORDER.indexOf("READY_FOR_FILMING");
              case "render":
                return idx >= STATUS_ORDER.indexOf("READY_FOR_RENDER");
              case "draft":
                return idx >= STATUS_ORDER.indexOf("DRAFT_RENDERED");
              case "posting":
                return idx >= STATUS_ORDER.indexOf("APPROVED_FOR_POSTING");
              default:
                return false;
            }
          };

          return (
            <Card key={pkg.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>{pkg.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{titleize(pkg.format)}</Badge>
                    <StatusBadge status={pkg.status} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {GATES.map((g) => (
                    <div key={g.key} className="flex items-center gap-2">
                      <span
                        className={
                          "flex h-5 w-5 items-center justify-center rounded-full text-xs " +
                          (gateDone(g.key)
                            ? "bg-emerald-600 text-white"
                            : "bg-secondary text-muted-foreground")
                        }
                      >
                        {gateDone(g.key) ? "✓" : "•"}
                      </span>
                      <span className="text-sm">{g.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>Posting targets:</span>
                    {pkg.posting.map((p) => (
                      <span key={p.platform} className="flex items-center gap-1">
                        <Badge variant="outline">{titleize(p.platform)}</Badge>
                        <StatusBadge status={p.status} />
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/packages/${pkg.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Review &amp; approve →
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Approve-for-posting actions are role-gated: switch to the <strong>Approver</strong> or{" "}
        <strong>Admin</strong> role (top-right) to unlock them inside a package.
      </p>
    </div>
  );
}
