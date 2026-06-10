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

  // Build a simple vertical draft: a colored background per segment with the
  // segment label burned in via drawtext. This proves the 9:16 pipeline and the
  // caption/lower-third overlay path end-to-end without source media.
  const mp4Key = `${packageId}-${Date.now()}.mp4`;
  const out = path.join(RENDERS_DIR, mp4Key);
  try {
    await runFfmpegSlideshow(plan, out);
    return { fileUrl: `/renders/${mp4Key}`, notes: "Draft render produced (placeholder visuals; clip media composited in a later pass).", rendered: true };
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

// Generates one drawtext-labeled solid-color clip per segment and concatenates.
function runFfmpegSlideshow(plan: EditPlan, outPath: string): Promise<void> {
  const { width, height } = plan;
  const inputs: string[] = [];
  const filters: string[] = [];
  plan.segments.forEach((seg, i) => {
    const color = seg.kind === "clip" ? "0x111827" : "0xea580c";
    inputs.push("-f", "lavfi", "-t", String(seg.durationSec), "-i", `color=c=${color}:s=${width}x${height}:r=30`);
    const text = (seg.onScreenText || seg.label).replace(/[:'\\]/g, " ");
    filters.push(
      `[${i}:v]drawtext=text='${text}':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2[v${i}]`
    );
  });
  const concatInputs = plan.segments.map((_, i) => `[v${i}]`).join("");
  filters.push(`${concatInputs}concat=n=${plan.segments.length}:v=1:a=0[outv]`);

  const args = [
    ...inputs,
    "-filter_complex",
    filters.join(";"),
    "-map",
    "[outv]",
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
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(stderr.slice(-300)))));
  });
}
