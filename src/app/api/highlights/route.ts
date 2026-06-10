import { NextResponse } from "next/server";
import { getDiscoverer, resolveMedia, LEAGUE_CHANNELS, leagueByKey } from "@/lib/media";
import type { DiscoverOptions, HighlightRef } from "@/lib/media";

// GET /api/highlights?q=...&league=nba,nhl&sport=...&since=lastnight&max=10
//   Discover highlights from YouTube / league channels.
// GET /api/highlights?leagues=1  -> list supported leagues/channels.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("leagues")) {
    return NextResponse.json({ leagues: LEAGUE_CHANNELS });
  }

  const leagueKeys = (searchParams.get("league") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const leagues = leagueKeys.map(leagueByKey).filter(Boolean);
  const channelIds = leagues.map((l) => l!.channelId).filter(Boolean) as string[];

  const since = searchParams.get("since");
  const publishedAfter = parseSince(since);

  const opts: DiscoverOptions = {
    query: searchParams.get("q") ?? (leagues.length ? undefined : "top plays highlights"),
    channelIds: channelIds.length ? channelIds : undefined,
    publishedAfter,
    sport: searchParams.get("sport") ?? leagues[0]?.sport,
    maxResults: Number(searchParams.get("max") ?? 12),
  };

  try {
    const discoverer = getDiscoverer();
    const highlights = await discoverer.discover(opts);
    return NextResponse.json({ discoverer: discoverer.name, count: highlights.length, highlights });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "discovery failed" }, { status: 502 });
  }
}

// POST /api/highlights
//   { "action": "resolve", "youTubeId": "...", "url": "..." }
//     -> resolve a single highlight to playable/downloadable media (rights-gated)
//   { "action": "ingest", "sourceId": "...", "league": "nba", "since": "lastnight", "resolve": true }
//     -> discover + persist Video rows (database mode); optionally download media
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const action = String(body.action ?? "");

  if (action === "resolve") {
    const ref: HighlightRef = body.youTubeId
      ? { provider: "youtube", youTubeId: String(body.youTubeId) }
      : { provider: "url", url: String(body.url ?? "") };
    if (!ref.youTubeId && !ref.url) {
      return NextResponse.json({ error: "youTubeId or url required" }, { status: 400 });
    }
    try {
      const media = await resolveMedia(ref);
      return NextResponse.json({ ok: true, media });
    } catch (e) {
      return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "resolve failed" }, { status: 422 });
    }
  }

  if (action === "ingest") {
    if ((process.env.DATA_SOURCE ?? "mock") !== "database") {
      return NextResponse.json({ error: "ingest persists to the database; set DATA_SOURCE=database" }, { status: 400 });
    }
    try {
      const { ingestHighlights } = await import("@/lib/media/ingest-highlights");
      const result = await ingestHighlights({
        sourceId: String(body.sourceId ?? ""),
        league: body.league ? String(body.league) : undefined,
        query: body.query ? String(body.query) : undefined,
        since: body.since ? String(body.since) : undefined,
        resolve: Boolean(body.resolve),
        max: body.max ? Number(body.max) : undefined,
      });
      return NextResponse.json({ ok: true, ...result });
    } catch (e) {
      return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "ingest failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: `unknown action "${action}"` }, { status: 400 });
}

// "lastnight" -> ~30h ago (covers an overnight slate); ISO string -> that time.
function parseSince(since: string | null): Date | undefined {
  if (!since) return undefined;
  if (since === "lastnight" || since === "today") return new Date(Date.now() - 30 * 3600 * 1000);
  const d = new Date(since);
  return isNaN(d.getTime()) ? undefined : d;
}
