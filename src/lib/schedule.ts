import type { PackageFormat } from "@/lib/types";

export interface ShowSlot {
  id: string;
  timeCT: string; // display time, Central
  title: string;
  format: PackageFormat;
  talentKey: "marcus" | "collin" | "none";
  description: string;
  inputs: string[]; // what the operator provides
  outputs: string[]; // what the system produces
}

// The daily broadcast run-of-show. Times are Central. Each show hands a
// compiled video + script to its talent by email, who films/presents and posts.
export const SCHEDULE: ShowSlot[] = [
  {
    id: "top7",
    timeCT: "8:00 AM CT",
    title: "Top 7 Plays",
    format: "TOP_7_PLAYS",
    talentKey: "marcus",
    description: "SportsCenter-style countdown of the 7 best plays from the day. Real athletes first; a viral social moment can crack the list.",
    inputs: ["Approve + sort the Top 7"],
    outputs: ["Compiled video", "Creative, funny-yet-formal intro + script emailed to Marcus"],
  },
  {
    id: "bestbets",
    timeCT: "12:00 PM CT",
    title: "Best Bets + Game Previews",
    format: "BEST_BETS",
    talentKey: "collin",
    description: "Five picks of the day with the best available odds, a funny script, last-night recap, and game previews.",
    inputs: ["Submit 5 bets"],
    outputs: ["Best odds per bet", "B-roll", "Funny script + recap emailed to Collin"],
  },
  {
    id: "wildtakes",
    timeCT: "6:00 PM CT",
    title: "Wild Takes",
    format: "WILD_TAKES",
    talentKey: "none",
    description: "The 2-3 craziest takes of the day from the shows (McAfee, SVP, Stephen A, Fox) and big YouTubers. Awful-Announcing-on-X energy, with memes.",
    inputs: ["Pick the takes"],
    outputs: ["Compiled clips + meme beats", "Script"],
  },
  {
    id: "pregame",
    timeCT: "6:45 PM CT",
    title: "Pregame Hype + Storylines",
    format: "PREGAME_HYPE",
    talentKey: "none",
    description: "Hype package + storylines for tonight's best games — the drama, the history, the TMZ-style subplots.",
    inputs: ["Tell us tonight's best games"],
    outputs: ["Storylines + drama", "Hype script"],
  },
];

export function slotByFormat(format: PackageFormat): ShowSlot | undefined {
  return SCHEDULE.find((s) => s.format === format);
}
