import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SCHEDULE } from "@/lib/schedule";
import { RECIPIENTS } from "@/lib/recipients";
import { titleize } from "@/lib/utils";

export default function SchedulePage() {
  return (
    <div>
      <PageHeader
        title="Daily Run-of-Show"
        description="Four shows a day, all times Central. Each is compiled and emailed to talent to present and post."
      />
      <div className="space-y-4">
        {SCHEDULE.map((slot) => {
          const talent = slot.talentKey !== "none" ? RECIPIENTS[slot.talentKey] : null;
          return (
            <Card key={slot.id}>
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-start">
                <div className="w-32 shrink-0">
                  <p className="text-lg font-bold text-primary">{slot.timeCT}</p>
                  <Badge variant="secondary" className="mt-1">{titleize(slot.format)}</Badge>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold">{slot.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{slot.description}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">You provide</p>
                      <ul className="mt-1 space-y-0.5 text-sm">
                        {slot.inputs.map((i) => <li key={i}>• {i}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">We produce</p>
                      <ul className="mt-1 space-y-0.5 text-sm">
                        {slot.outputs.map((o) => <li key={o}>• {o}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
                {talent && (
                  <div className="shrink-0 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm">
                    <p className="text-xs text-muted-foreground">Emailed to</p>
                    <p className="font-medium">{talent.name}</p>
                    <p className="text-xs text-muted-foreground">{talent.role}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
