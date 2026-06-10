import { PageHeader } from "@/components/page-header";
import { ScriptStudio } from "@/components/script-studio";
import { Card, CardContent } from "@/components/ui/card";

export default function TakesPage() {
  return (
    <div>
      <PageHeader
        title="Wild Takes — 6:00 PM CT"
        description="The 2-3 craziest takes of the day from the shows and big YouTubers. Awful-Announcing-on-X energy."
      />
      <Card className="mb-4">
        <CardContent className="p-5 text-sm text-muted-foreground">
          Pull takes from McAfee, SVP, Stephen A / First Take, Fox Sports, and prominent YouTubers via the
          <a href="/videos" className="text-primary hover:underline"> highlight discovery</a> (add a YouTube key for
          live search). Paste the 2-3 you want below and generate the segment script + meme beats.
        </CardContent>
      </Card>
      <ScriptStudio
        kind="takes"
        placeholder={"Paste 2-3 takes, one per line. e.g.\n- McAfee: 'He's the best QB alive and it's NOT close'\n- Stephen A goes nuclear about the Knicks\n- Fox guy says the Spurs are already a dynasty"}
        cta="Write the Wild Takes script"
      />
    </div>
  );
}
