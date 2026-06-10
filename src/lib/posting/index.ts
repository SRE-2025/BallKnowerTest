import type { Platform } from "@/lib/types";
import type { PostingProvider, PostRequest, PostResult } from "./types";
import { createYouTubeProvider } from "./youtube";
import { realProviderFor } from "./social";

// Mock provider: simulates a successful post and returns a plausible URL. Used
// for any platform not yet wired, or when real credentials are absent — keeps
// the posting workflow demonstrable end-to-end.
function mockProvider(platform: Platform): PostingProvider {
  return {
    platform,
    async post(req: PostRequest): Promise<PostResult> {
      const slug = req.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
      const host = platform.toLowerCase().replace(/_/g, "");
      return { ok: true, postedUrl: `https://${host}.example/${slug}-${Date.now().toString(36)}` };
    },
  };
}

// Selects a provider per platform. Uses the real, credential-gated provider when
// configured (YouTube, TikTok, Instagram, Facebook, X); otherwise the mock.
export function getPostingProvider(platform: Platform): PostingProvider {
  if (platform === "YOUTUBE_SHORTS") {
    const token = process.env.YOUTUBE_ACCESS_TOKEN;
    if (token) return createYouTubeProvider(token);
    return mockProvider(platform);
  }
  return realProviderFor(platform) ?? mockProvider(platform);
}

export type { PostingProvider, PostRequest, PostResult } from "./types";
