import { promises as fs } from "fs";
import path from "path";
import { spawn } from "child_process";
import type { MediaResolver, HighlightRef, ResolvedMedia } from "./types";

const MEDIA_DIR = path.join(process.cwd(), "public", "media");

// Resolves a YouTube highlight to an actual media file using yt-dlp.
//
// RIGHTS GATE: downloading is disabled unless ALLOW_MEDIA_DOWNLOAD=true. Even
// then, you are responsible for holding the rights to download/repost the media
// (partner license, fair-use determination, etc.). Discovery/metadata is always
// allowed; pulling bytes is the gated step. Requires `yt-dlp` on PATH.
export const ytdlpResolver: MediaResolver = {
  name: "yt-dlp",
  canResolve(ref: HighlightRef) {
    return ref.provider === "youtube" && !!ref.youTubeId;
  },
  async resolve(ref: HighlightRef): Promise<ResolvedMedia> {
    if (process.env.ALLOW_MEDIA_DOWNLOAD !== "true") {
      throw new Error(
        "Media download is disabled. Set ALLOW_MEDIA_DOWNLOAD=true to enable, and ensure you hold the rights to the media."
      );
    }
    if (!(await ytdlpAvailable())) {
      throw new Error("yt-dlp not found on PATH. Install it (pip install yt-dlp) to download media.");
    }
    const id = ref.youTubeId!;
    await fs.mkdir(MEDIA_DIR, { recursive: true });
    const outTpl = path.join(MEDIA_DIR, `${id}.%(ext)s`);
    const url = `https://www.youtube.com/watch?v=${id}`;

    await run("yt-dlp", [
      "-f",
      "mp4/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best",
      "--merge-output-format",
      "mp4",
      "--no-playlist",
      "-o",
      outTpl,
      url,
    ]);

    // yt-dlp wrote <id>.mp4 (after merge). Confirm + report.
    const file = path.join(MEDIA_DIR, `${id}.mp4`);
    const stat = await fs.stat(file).catch(() => null);
    if (!stat) throw new Error("yt-dlp completed but no mp4 was produced.");
    return { localPath: file, mediaUrl: `/media/${id}.mp4`, format: "mp4", bytes: stat.size, via: "yt-dlp" };
  },
};

function ytdlpAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const p = spawn("yt-dlp", ["--version"]);
    p.on("error", () => resolve(false));
    p.on("close", (code) => resolve(code === 0));
  });
}

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args);
    let stderr = "";
    p.stderr.on("data", (d) => (stderr += d.toString()));
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(stderr.slice(-400)))));
  });
}
