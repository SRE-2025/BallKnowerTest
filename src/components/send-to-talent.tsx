"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/role-context";
import { compileAndSendShow } from "@/app/shows/actions";

// Approve + sort happens above (Show Builder). This compiles the approved clips
// into a script and emails it to the talent (Marcus for Top 7) with the draft.
export function SendToTalent({ packageId, talentName }: { packageId: string; talentName: string }) {
  const { can } = useRole();
  const [busy, setBusy] = React.useState(false);
  const [savedTo, setSavedTo] = React.useState<string | null>(null);
  const [script, setScript] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function send() {
    setBusy(true);
    setMsg(null);
    const res = await compileAndSendShow(packageId);
    setBusy(false);
    if (res.ok) {
      setMsg(`Emailed ${res.to} via ${res.via}.`);
      setSavedTo(res.savedTo ?? null);
      setScript(res.script);
    } else {
      setMsg(res.error);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="text-sm font-semibold">Compile &amp; send to {talentName}</p>
        <p className="text-xs text-muted-foreground">
          Writes the creative, funny-yet-formal intro + script and emails it with the draft. {talentName} records
          their part and posts it over the cuts.
        </p>
        <Button size="sm" onClick={send} disabled={busy || !can("approve_for_posting")}>
          {busy ? "Compiling…" : `Compile & email ${talentName}`}
        </Button>
        {!can("approve_for_posting") && (
          <p className="text-xs text-muted-foreground">Switch to Approver/Admin (top-right) to send.</p>
        )}
        {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
        {savedTo && (
          <a href={savedTo} target="_blank" rel="noreferrer" className="block text-xs text-primary hover:underline">
            Open the draft email ↗
          </a>
        )}
        {script && <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded bg-secondary/40 p-2 text-xs">{script}</pre>}
      </CardContent>
    </Card>
  );
}
