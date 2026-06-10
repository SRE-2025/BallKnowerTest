"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Highlight {
  externalId: string;
  title: string;
  youTubeId?: string;
  watchUrl: string;
  thumbnailUrl?: string;
  channel?: string;
  sourceName: string;
}

const LEAGUES = [
  { key: "", label: "All / search" },
  { key: "nba", label: "NBA" },
  { key: "wnba", label: "WNBA" },
  { key: "nhl", label: "NHL" },
  { key: "mlb", label: "MLB" },
  { key: "nfl", label: "NFL" },
  { key: "mls", label: "MLS (soccer)" },
  { key: "savannah_bananas", label: "Savannah Bananas" },
  { key: "dude_perfect", label: "Dude Perfect" },
];

// Calls the highlight discovery API (GET /api/highlights). Discovery works in
// any mode (falls back to the curated set without a YouTube key). "Ingest" needs
// database mode.
export function PullHighlights() {
  const [league, setLeague] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Highlight[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function discover() {
    setBusy(true);
    setMsg(null);
    const params = new URLSearchParams({ since: "lastnight", max: "12" });
    if (league) params.set("league", league);
    if (query) params.set("q", query);
    try {
      const res = await fetch(`/api/highlights?${params}`);
      const data = await res.json();
      if (res.ok) {
        setResults(data.highlights ?? []);
        setMsg(`Found ${data.count} via ${data.discoverer}.`);
      } else {
        setMsg(data.error ?? "discovery failed");
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "error");
    } finally {
      setBusy(false);
    }
  }

  async function ingest() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/highlights", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "ingest",
          sourceId: "src_highlight_wire",
          league: league || undefined,
          query: query || undefined,
          since: "lastnight",
        }),
      });
      const data = await res.json();
      setMsg(res.ok ? `Imported ${data.imported}, skipped ${data.skipped}.` : data.error);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-6">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-muted-foreground">
            League / channel
            <select
              value={league}
              onChange={(e) => setLeague(e.target.value)}
              className="mt-1 block rounded-md border border-border bg-secondary px-2.5 py-1.5 text-sm text-foreground"
            >
              {LEAGUES.map((l) => (
                <option key={l.key} value={l.key}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            Search (optional)
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. buzzer beater"
              className="mt-1 block rounded-md border border-border bg-secondary px-2.5 py-1.5 text-sm text-foreground"
            />
          </label>
          <Button onClick={discover} disabled={busy}>
            {busy ? "Pulling…" : "Pull last night's highlights"}
          </Button>
          <Button variant="outline" onClick={ingest} disabled={busy || results.length === 0}>
            {busy ? "…" : "Add to library"}
          </Button>
          {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
        </div>

        {results.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((h) => (
              <a
                key={h.externalId}
                href={h.watchUrl}
                target="_blank"
                rel="noreferrer"
                className="group overflow-hidden rounded-md border border-border hover:border-primary/50"
              >
                {h.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={h.thumbnailUrl} alt={h.title} className="aspect-video w-full object-cover" />
                )}
                <div className="p-2">
                  <p className="line-clamp-2 text-xs font-medium group-hover:text-primary">{h.title}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{h.channel ?? h.sourceName}</p>
                </div>
              </a>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Discovery uses the YouTube Data API (or official league channels) when <code>YOUTUBE_API_KEY</code>{" "}
          is set. Downloading the actual file is gated behind <code>ALLOW_MEDIA_DOWNLOAD=true</code> + yt-dlp —
          enable only for media you have the rights to use.
        </p>
      </CardContent>
    </Card>
  );
}
