"use server";

import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/repository";
import { writeScript } from "@/lib/ai/script-writer";
import { getMailer, type EmailAttachment } from "@/lib/email";
import { RECIPIENTS } from "@/lib/recipients";
import { slotByFormat } from "@/lib/schedule";
import { priceBets, type BetInput, type PricedBet } from "@/lib/odds";

type SendResult =
  | { ok: true; to: string; via: string; savedTo?: string; script: string }
  | { ok: false; error: string };

function scriptHtml(intro: string, body: string, outro: string): string {
  return `<h2>Intro</h2><p>${esc(intro)}</p><h2>Body</h2><pre style="white-space:pre-wrap;font-family:inherit">${esc(body)}</pre><h2>Outro</h2><p>${esc(outro)}</p>`;
}
function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Top 7 (and other clip shows): compile the approved+sorted clips into a script
// and email it to the show's talent (Marcus for Top 7) with the rendered draft
// linked. Works in mock mode (writes to the outbox you can open).
export async function compileAndSendShow(packageId: string): Promise<SendResult> {
  const repo = getRepository();
  const [pkg, videos, clips] = await Promise.all([
    repo.getPackage(packageId),
    repo.getVideos(),
    repo.getCandidateClips(),
  ]);
  if (!pkg) return { ok: false, error: "Package not found" };

  const slot = slotByFormat(pkg.format);
  const talentKey = slot?.talentKey === "collin" ? "collin" : "marcus";
  const recipient = RECIPIENTS[talentKey];

  // Build context from the approved clips in rank order.
  const approved = pkg.clips
    .filter((c) => c.approvalStatus !== "REJECTED")
    .sort((a, b) => a.rank - b.rank);
  const videoById = new Map(videos.map((v) => [v.id, v]));
  const candidateById = new Map(clips.map((c) => [c.id, c]));
  const lines = approved.map((c) => {
    const cand = candidateById.get(c.candidateClipId);
    const v = cand ? videoById.get(cand.videoId) : undefined;
    return `#${c.rank} — ${c.suggestedTitle ?? v?.title ?? "Play"} (${v?.title ?? ""})`;
  });
  const context = `${pkg.title}\n\n${lines.join("\n")}`;

  const kind = pkg.format === "BEST_BETS" ? "bestbets" : pkg.format === "WILD_TAKES" ? "wildtakes" : pkg.format === "PREGAME_HYPE" ? "pregame" : "top7";
  const script = await writeScript(kind, context);

  const attachments: EmailAttachment[] = [];
  if (pkg.render.status === "READY" && pkg.render.version > 0) {
    attachments.push({ filename: "draft.mp4", url: "/renders/(latest)" });
  }

  const mailer = getMailer();
  const result = await mailer.send({
    to: recipient.email,
    toName: recipient.name,
    subject: `[${slot?.timeCT ?? "Show"}] ${pkg.title} — ready for you`,
    html:
      `<p>Hey ${recipient.name}, here's today's ${pkg.title}. Record your part, drop it over the cuts, and post.</p>` +
      scriptHtml(script.intro, script.body, script.outro) +
      `<p style="color:#888">Script by ${script.usedModel}. Open the package in BallKnower to tweak before recording.</p>`,
    attachments,
  });

  if (!result.ok) return { ok: false, error: result.error ?? "email failed" };
  revalidatePath(`/packages/${packageId}`);
  return { ok: true, to: recipient.email, via: result.via, savedTo: result.savedTo, script: `${script.intro}\n\n${script.body}\n\n${script.outro}` };
}

// Best Bets: price the submitted picks, write the funny script + recap, email Collin.
export async function submitBets(input: {
  recapNote?: string;
  bets: BetInput[];
}): Promise<
  | { ok: true; priced: PricedBet[]; script: string; to: string; via: string; savedTo?: string }
  | { ok: false; error: string }
> {
  const clean = input.bets.filter((b) => b.matchup && b.pick);
  if (clean.length === 0) return { ok: false, error: "Add at least one bet (matchup + pick)." };

  const priced = await priceBets(clean);
  const picks = priced
    .map((b, i) => `Pick ${i + 1}: ${b.matchup} — ${b.pick} ${b.line ?? ""} (${b.market}) — best: ${b.bestOdds} at ${b.bestBook}`)
    .join("\n");
  const context = `${input.recapNote ? `Recap of last night: ${input.recapNote}\n\n` : ""}Today's 5 best bets:\n${picks}`;
  const script = await writeScript("bestbets", context);

  const recipient = RECIPIENTS.collin;
  const mailer = getMailer();
  const result = await mailer.send({
    to: recipient.email,
    toName: recipient.name,
    subject: `[12:00 PM CT] Best Bets — ${clean.length} picks ready`,
    html:
      `<p>Hey ${recipient.name}, today's best bets with the best odds. B-roll suggestions: game highlights per matchup.</p>` +
      `<pre style="white-space:pre-wrap;font-family:inherit">${esc(picks)}</pre>` +
      scriptHtml(script.intro, script.body, script.outro),
  });
  if (!result.ok) return { ok: false, error: result.error ?? "email failed" };
  return { ok: true, priced, script: `${script.intro}\n\n${script.body}\n\n${script.outro}`, to: recipient.email, via: result.via, savedTo: result.savedTo };
}

// Wild Takes: write the "awful announcing" script from the chosen takes.
export async function writeTakes(takesText: string): Promise<{ ok: true; script: string; usedModel: string } | { ok: false; error: string }> {
  if (!takesText.trim()) return { ok: false, error: "Paste 2-3 takes first." };
  const s = await writeScript("wildtakes", takesText);
  return { ok: true, script: `${s.intro}\n\n${s.body}\n\n${s.outro}`, usedModel: s.usedModel };
}

// Pregame storylines: turn tonight's games into drama + a hype script.
export async function buildStorylines(gamesText: string): Promise<{ ok: true; script: string; usedModel: string } | { ok: false; error: string }> {
  if (!gamesText.trim()) return { ok: false, error: "List tonight's best games first." };
  const s = await writeScript("pregame", `Tonight's games and any known angles:\n${gamesText}\n\nFind the storylines, history, and messy/TMZ-style subplots; make it funny.`);
  return { ok: true, script: `${s.intro}\n\n${s.body}\n\n${s.outro}`, usedModel: s.usedModel };
}
