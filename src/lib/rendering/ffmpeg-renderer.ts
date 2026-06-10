import { promises as fs } from "fs";
import path from "path";
import { spawn } from "child_process";
import type { EditPlan } from "./edit-plan";

export interface RenderOutput {
  fileUrl: string;
  notes: string;
  rendered: boolean; // true if an actual mp4 was produced
}

// Written under public/ so drafts are playable at /renders/* during local dev.
const RENDERS_DIR = path.join(process.cwd(), "public", "renders");

// Renders an EditPlan to a 9:16 draft. If ffmpeg is available it composes a
// caption/lower-third slideshow as a stand-in for the full edit (real clip media
// is wired in once ingestion stores downloadable media in Phase 2+). If ffmpeg
// is absent, it writes the plan JSON so the pipeline still produces an artifact.
export async function renderEditPlan(plan: EditPlan, packageId: string): Promise<RenderOutput> {
  await fs.mkdir(RENDERS_DIR, { recursive: true });
  const planKey = `${packageId}-${Date.now()}.plan.json`;
  await fs.writeFile(path.join(RENDERS_DIR, planKey), JSON.stringify(plan, null, 2));

  const hasFfmpeg = await ffmpegAvailable();
  if (!hasFfmpeg) {
    return {
      fileUrl: `/renders/${planKey}`,
      notes: "ffmpeg not found — wrote edit plan only. Install ffmpeg to produce the draft video.",
      rendered: false,
    };
  }

  const mp4Key = `${packageId}-${Date.now()}.mp4`;
  const out = path.join(RENDERS_DIR, mp4Key);
  const hasCommentary = plan.segments.some((s) => s.commentaryFile);
  const hasClipMedia = plan.segments.some((s) => s.sourceMediaFile);
  try {
    await runFfmpegComposite(plan, out);
    const notes =
      hasCommentary && hasClipMedia
        ? "Draft stitched: your commentary + resolved highlight footage edited together."
        : hasClipMedia
        ? "Draft stitched with resolved highlight footage and title cards (upload commentary to add your reactions)."
        : hasCommentary
        ? "Draft stitched: your commentary with title cards for each play (resolve highlight media to add footage)."
        : "Draft render produced (title cards only — upload commentary and/or resolve highlight media, then re-render).";
    return { fileUrl: `/renders/${mp4Key}`, notes, rendered: true };
  } catch (e) {
    return {
      fileUrl: `/renders/${planKey}`,
      notes: `ffmpeg render failed (${e instanceof Error ? e.message : "error"}) — wrote edit plan only.`,
      rendered: false,
    };
  }
}

function ffmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const p = spawn("ffmpeg", ["-version"]);
    p.on("error", () => resolve(false));
    p.on("close", (code) => resolve(code === 0));
  });
}

// Composites the timeline into one 1080x1920 video with audio. Commentary slots
// use the uploaded filmed clip (scaled/padded to 9:16); every other slot becomes
// a title card with silent audio. All segments are normalized to the same format
// so the concat filter joins them cleanly.
function runFfmpegComposite(plan: EditPlan, outPath: string): Promise<void> {
  const { width, height } = plan;
  const inputs: string[] = [];
  const vFilters: string[] = [];
  const aLabels: string[] = [];
  const vLabels: string[] = [];
  let inputIdx = 0;

  plan.segments.forEach((seg, i) => {
    const realFile = seg.commentaryFile ?? seg.sourceMediaFile;
    if (realFile) {
      // Real video: filmed commentary, or resolved highlight footage for a clip
      // segment. Scale to fit 9:16, pad, normalize. For clip footage, trim to the
      // play window when start/end are known.
      const trim: string[] = [];
      if (seg.sourceMediaFile && !seg.commentaryFile && seg.startSec != null) {
        trim.push("-ss", String(seg.startSec));
        if (seg.endSec != null) trim.push("-t", String(Math.max(1, seg.endSec - seg.startSec)));
      }
      inputs.push(...trim, "-i", realFile);
      const vi = inputIdx++;
      vFilters.push(
        `[${vi}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
          `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p[v${i}]`
      );
      // Re-encode audio to a common format; assumes filmed commentary has audio.
      vFilters.push(`[${vi}:a]aresample=44100,aformat=channel_layouts=stereo[a${i}]`);
    } else {
      // Title card: solid color + burned-in text, plus silent audio.
      const color = seg.kind === "clip" ? "0x111827" : "0xea580c";
      inputs.push("-f", "lavfi", "-t", String(seg.durationSec), "-i", `color=c=${color}:s=${width}x${height}:r=30`);
      const ci = inputIdx++;
      inputs.push("-f", "lavfi", "-t", String(seg.durationSec), "-i", "anullsrc=channel_layout=stereo:sample_rate=44100");
      const ai = inputIdx++;
      const main = esc(seg.onScreenText || seg.label);
      const sub = esc(seg.lowerThird || seg.caption || "");
      let chain = `[${ci}:v]drawtext=text='${main}':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2-80`;
      if (sub) chain += `,drawtext=text='${sub}':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=(h-text_h)/2+40`;
      vFilters.push(`${chain},format=yuv420p[v${i}]`);
      vFilters.push(`[${ai}:a]aformat=channel_layouts=stereo[a${i}]`);
    }
    vLabels.push(`[v${i}]`);
    aLabels.push(`[a${i}]`);
  });

  const concat = `${plan.segments.map((_, i) => `${vLabels[i]}${aLabels[i]}`).join("")}concat=n=${plan.segments.length}:v=1:a=1[outv][outa]`;
  const filterComplex = [...vFilters, concat].join(";");

  const args = [
    ...inputs,
    "-filter_complex",
    filterComplex,
    "-map",
    "[outv]",
    "-map",
    "[outa]",
    "-c:v",
    "libx264",
    "-c:a",
    "aac",
    "-pix_fmt",
    "yuv420p",
    "-y",
    outPath,
  ];

  return new Promise((resolve, reject) => {
    const p = spawn("ffmpeg", args);
    let stderr = "";
    p.stderr.on("data", (d) => (stderr += d.toString()));
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(stderr.slice(-400)))));
  });
}

// Escape text for ffmpeg drawtext.
function esc(s: string): string {
  return s.replace(/[\\:']/g, " ").replace(/[^\x20-\x7E]/g, "").slice(0, 60);
}
