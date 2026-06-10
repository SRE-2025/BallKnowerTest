import { getAnthropic, PRODUCER_MODEL } from "./client";

export interface ScriptResult {
  intro: string;
  body: string;
  outro: string;
  usedModel: string;
}

// Per-show script writer. Uses Claude when ANTHROPIC_API_KEY is set; otherwise a
// templated fallback so every show produces a usable script. Each show has its
// own voice, per the run-of-show.
type ShowKind = "top7" | "bestbets" | "wildtakes" | "pregame";

const VOICE: Record<ShowKind, string> = {
  top7: "Creative and funny, but still formal and broadcast-credible — SportsCenter anchor with a wink. Write an intro that hooks in the first 3 seconds, then a line per play (count down 7 to 1), then a punchy outro/CTA.",
  bestbets: "Funny and confident degenerate-but-smart energy. Recap last night briefly, then deliver 5 picks with the best odds and a quick reason each. Keep it loose and quotable.",
  wildtakes: "Awful-Announcing-on-X energy — incredulous, sarcastic, reaction-driven. Set up each take, react, and let the absurdity land. 2-3 takes max.",
  pregame: "Hype + TMZ-style drama. Sell tonight's games through the storylines, history, and any messy subplots. Funny, a little gossipy, builds anticipation.",
};

export async function writeScript(kind: ShowKind, context: string): Promise<ScriptResult> {
  const client = getAnthropic();
  if (!client) return { ...fallback(kind, context), usedModel: "mock" };

  try {
    const system = `You are the head writer for BallKnower, a daily short-form sports network. Voice for this show: ${VOICE[kind]}. Never invent facts, scores, quotes, or sources beyond what you're given. Return three clearly labeled parts: INTRO, BODY, OUTRO.`;
    const message = await client.messages.create({
      model: PRODUCER_MODEL,
      max_tokens: 1500,
      system,
      messages: [{ role: "user", content: `Write the script. Context:\n${context}` }],
    });
    const text = message.content.find((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")?.text ?? "";
    return { ...splitScript(text, kind, context), usedModel: PRODUCER_MODEL };
  } catch {
    return { ...fallback(kind, context), usedModel: "mock-fallback" };
  }
}

function splitScript(text: string, kind: ShowKind, context: string): Omit<ScriptResult, "usedModel"> {
  const grab = (label: string) => {
    const m = text.match(new RegExp(`${label}[:\\s]*([\\s\\S]*?)(?=INTRO|BODY|OUTRO|$)`, "i"));
    return m?.[1]?.trim();
  };
  const intro = grab("INTRO");
  const body = grab("BODY");
  const outro = grab("OUTRO");
  if (intro || body || outro) return { intro: intro ?? "", body: body ?? text, outro: outro ?? "" };
  return fallback(kind, context);
}

function fallback(kind: ShowKind, context: string): Omit<ScriptResult, "usedModel"> {
  switch (kind) {
    case "top7":
      return {
        intro: "What's up ball knowers — these are the SEVEN best plays from last night, and number one is going to ruin your group chat. Let's count 'em down.",
        body: context,
        outro: "That's your Top 7. Smash follow, we do this every single morning. Now go be productive. Probably.",
      };
    case "bestbets":
      return {
        intro: "Good afternoon, degenerates and respectable investors — last night treated us... let's not talk about it. Today we eat. Five best bets, best odds, let's roll.",
        body: context,
        outro: "Those are your five. Bet responsibly, screenshot the wins, delete the losses. See you at the window.",
      };
    case "wildtakes":
      return {
        intro: "Buckle up, because the takes today were UNHINGED. I have questions. Mostly 'who let them say that on television.'",
        body: context,
        outro: "Anyway. Tell me which one was the worst in the comments. It's going to be all of them.",
      };
    case "pregame":
      return {
        intro: "Tonight's slate is dangerous, and the storylines? Messier than a group chat after a breakup. Let's get into it.",
        body: context,
        outro: "Grab your snacks. This one's got drama. Follow so you don't miss the chaos.",
      };
  }
}
