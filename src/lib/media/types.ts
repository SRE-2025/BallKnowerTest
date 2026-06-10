// =============================================================================
// Media acquisition layer: discover highlights (league / YouTube / partner feed)
// and resolve the actual playable/downloadable media for a chosen highlight.
//
// Two stages, two interfaces:
//   HighlightDiscoverer.discover()  -> finds candidate highlights + metadata
//   MediaResolver.resolve()         -> turns one highlight into real media
//
// Discovery uses official, public APIs (YouTube Data API, partner feeds).
// Resolution that downloads bytes is RIGHTS-GATED (see ytdlp-resolver.ts):
// the BallKnower team is responsible for having the rights to any media it
// downloads or reposts.
// =============================================================================

export type HighlightProvider = "youtube" | "url";

export interface HighlightRef {
  provider: HighlightProvider;
  youTubeId?: string;
  url?: string;
}

export interface DiscoveredHighlight {
  externalId: string;
  title: string;
  youTubeId?: string;
  watchUrl: string;
  thumbnailUrl?: string;
  channel?: string;
  publishedAt?: string;
  durationSec?: number;
  sport?: string;
  sourceName: string;
}

export interface DiscoverOptions {
  // Free-text query (e.g. "NBA top plays"), optional when channelIds given.
  query?: string;
  // Restrict to specific YouTube channels (e.g. official league channels).
  channelIds?: string[];
  // Only highlights published after this instant (e.g. "last night").
  publishedAfter?: Date;
  sport?: string;
  maxResults?: number;
}

export interface ResolvedMedia {
  // A local file path (downloaded) OR a direct remote media URL.
  localPath?: string;
  mediaUrl?: string;
  format?: string;
  bytes?: number;
  via: string; // which resolver produced this
}

export interface HighlightDiscoverer {
  readonly name: string;
  discover(opts: DiscoverOptions): Promise<DiscoveredHighlight[]>;
}

export interface MediaResolver {
  readonly name: string;
  canResolve(ref: HighlightRef): boolean;
  resolve(ref: HighlightRef): Promise<ResolvedMedia>;
}

export function refFromYouTube(id: string): HighlightRef {
  return { provider: "youtube", youTubeId: id };
}
export function refFromUrl(url: string): HighlightRef {
  return { provider: "url", url };
}
