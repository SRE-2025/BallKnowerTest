import type { PostingProvider, PostRequest, PostResult } from "./types";

// YouTube Shorts provider. Real resumable-upload shape against the YouTube Data
// API v3, gated on an OAuth access token. Without a token it returns a clear
// not-configured error and the orchestrator falls back to the mock provider.
export function createYouTubeProvider(accessToken: string | undefined): PostingProvider {
  return {
    platform: "YOUTUBE_SHORTS",
    async post(req: PostRequest): Promise<PostResult> {
      if (!accessToken) {
        return { ok: false, error: "YouTube not configured (no OAuth access token)." };
      }
      try {
        // Step 1: initiate a resumable upload with the video metadata.
        const metadata = {
          snippet: {
            title: req.title.slice(0, 100),
            description: `${req.description}\n\n${req.hashtags.join(" ")} #Shorts`,
            categoryId: "17", // Sports
          },
          status: {
            privacyStatus: req.scheduledFor ? "private" : "public",
            ...(req.scheduledFor ? { publishAt: req.scheduledFor.toISOString() } : {}),
            selfDeclaredMadeForKids: false,
          },
        };
        const init = await fetch(
          "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              "X-Upload-Content-Type": "video/*",
            },
            body: JSON.stringify(metadata),
          }
        );
        if (!init.ok) return { ok: false, error: `YouTube init failed: ${init.status}` };
        const uploadUrl = init.headers.get("location");
        if (!uploadUrl) return { ok: false, error: "YouTube did not return an upload URL." };

        // Step 2: upload the rendered video bytes to the resumable session.
        const media = await fetch(req.videoUrl);
        const bytes = Buffer.from(await media.arrayBuffer());
        const upload = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": "video/*", "Content-Length": String(bytes.length) },
          body: bytes,
        });
        if (!upload.ok) return { ok: false, error: `YouTube upload failed: ${upload.status}` };
        const result = (await upload.json()) as { id?: string };
        return result.id
          ? { ok: true, postedUrl: `https://youtube.com/shorts/${result.id}` }
          : { ok: false, error: "YouTube upload returned no video id." };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "YouTube error" };
      }
    },
  };
}
