import { PageHeader } from "@/components/page-header";
import { ScriptStudio } from "@/components/script-studio";

export default function StorylinesPage() {
  return (
    <div>
      <PageHeader
        title="Pregame Hype + Storylines — 6:45 PM CT"
        description="Tell us tonight's best games. We dig up the storylines, history, and TMZ-style drama, then write the hype script."
      />
      <ScriptStudio
        kind="storylines"
        placeholder={"List tonight's best games + any angle you know. e.g.\n- Spurs at Knicks, Game 4 — Wemby vs the city\n- Two ex-teammates facing off, bad blood\n- Pitcher facing his former team after the trade"}
        cta="Find the drama + write the hype script"
      />
    </div>
  );
}
