"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { titleize } from "@/lib/utils";
import { renderPackageAction } from "@/app/packages/pipeline-actions";
import type { FilmingPrompt } from "@/lib/types";

// Phase 4 + 5 UX: record/upload your commentary into each slot, preview it, then
// stitch everything into a draft. The order shown is the order it gets edited in.
export function CommentaryStudio({
  packageId,
  prompts,
}: {
  packageId: string;
  prompts: FilmingPrompt[];
}) {
  const ordered = [...prompts].sort((a, b) => a.order - b.order);
  const [uploads, setUploads] = React.useState<Record<string, string>>({});
  const [building, setBuilding] = React.useState(false);
  const [draftUrl, setDraftUrl] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  const doneCount = Object.keys(uploads).length;

  async function build() {
    setBuilding(true);
    setMsg(null);
    const res = await renderPackageAction(packageId);
    setBuilding(false);
    if (res.ok) {
      setMsg(res.detail);
      if (res.url && res.url.endsWith(".mp4")) setDraftUrl(res.url);
    } else {
      setMsg(res.error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Your Commentary</CardTitle>
          <Badge variant="secondary">
            {doneCount}/{ordered.length} recorded
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Film each part, upload it into its slot, then stitch the draft. Parts are edited together
          top-to-bottom; the plays go between your reactions.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {ordered.map((fp) => (
          <SlotRow
            key={fp.id}
            prompt={fp}
            uploadedUrl={uploads[fp.id]}
            onUploaded={(url) => setUploads((u) => ({ ...u, [fp.id]: url }))}
          />
        ))}

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
          <Button onClick={build} disabled={building}>
            {building ? "Stitching…" : "Stitch into draft"}
          </Button>
          {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
        </div>

        {draftUrl && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Draft preview</p>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video src={draftUrl} controls className="w-full max-w-xs rounded-md border border-border" />
            <a href={draftUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
              Open draft ↗
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SlotRow({
  prompt,
  uploadedUrl,
  onUploaded,
}: {
  prompt: FilmingPrompt;
  uploadedUrl?: string;
  onUploaded: (url: string) => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const body = new FormData();
    body.append("file", file);
    body.append("filmingPromptId", prompt.id);
    try {
      const res = await fetch("/api/uploads", { method: "POST", body });
      const data = (await res.json()) as { url?: string };
      if (data.url) onUploaded(data.url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-3 rounded-md border border-border p-3">
      <Badge variant="outline" className="mt-0.5 shrink-0">
        {titleize(prompt.slot)}
      </Badge>
      <span className="min-w-0 flex-1 text-sm text-muted-foreground">{prompt.prompt}</span>
      <input ref={inputRef} type="file" accept="video/*" hidden onChange={onFile} />
      <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? "Uploading…" : uploadedUrl ? "Replace" : "Upload"}
      </Button>
      {uploadedUrl && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video src={uploadedUrl} controls className="mt-2 w-full max-w-[160px] rounded border border-border" />
      )}
    </div>
  );
}
