"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { writeTakes, buildStorylines } from "@/app/shows/actions";

// Shared input → AI script studio for the takes (6pm) and storylines (6:45pm)
// shows. Paste/describe the raw material, generate the show's script.
export function ScriptStudio({
  kind,
  placeholder,
  cta,
}: {
  kind: "takes" | "storylines";
  placeholder: string;
  cta: string;
}) {
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [script, setScript] = React.useState<string | null>(null);
  const [model, setModel] = React.useState<string | null>(null);

  async function go() {
    setBusy(true);
    setScript(null);
    const res = kind === "takes" ? await writeTakes(text) : await buildStorylines(text);
    setBusy(false);
    if (res.ok) {
      setScript(res.script);
      setModel(res.usedModel);
    } else {
      setScript(`⚠ ${res.error}`);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 p-5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder={placeholder}
            className="w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm"
          />
          <Button onClick={go} disabled={busy}>
            {busy ? "Writing…" : cta}
          </Button>
        </CardContent>
      </Card>
      {script && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Script</h3>
              {model && <span className="text-xs text-muted-foreground">by {model}</span>}
            </div>
            <pre className="whitespace-pre-wrap text-sm">{script}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
