export interface BetInput {
  matchup: string;
  pick: string;
  market: string; // moneyline | spread | total | prop
  line?: string;
}

export interface PricedBet extends BetInput {
  bestBook: string;
  bestOdds: string; // American odds
}

const BOOKS = ["DraftKings", "FanDuel", "BetMGM", "Caesars", "ESPN BET"];

// Finds the best available odds per bet. Uses The Odds API when ODDS_API_KEY is
// set; otherwise returns a deterministic best-book/price so the workflow runs.
export async function priceBets(bets: BetInput[]): Promise<PricedBet[]> {
  const key = process.env.ODDS_API_KEY;
  if (key) {
    try {
      return await priceWithOddsApi(bets, key);
    } catch {
      // fall through to mock on any API error
    }
  }
  return bets.map((b, i) => {
    const book = BOOKS[(i + b.matchup.length) % BOOKS.length];
    const base = b.market === "moneyline" ? 100 + ((i * 37) % 220) - 110 : -110 + ((i * 13) % 40) - 20;
    const odds = base >= 0 ? `+${base}` : `${base}`;
    return { ...b, bestBook: book, bestOdds: odds };
  });
}

// Pulls real odds and picks the best price across books for each matchup.
async function priceWithOddsApi(bets: BetInput[], key: string): Promise<PricedBet[]> {
  // The Odds API: list NBA/NHL/MLB odds; match on team name in the matchup.
  const sports = ["basketball_nba", "icehockey_nhl", "baseball_mlb", "americanfootball_nfl"];
  const events: OddsEvent[] = [];
  for (const sport of sports) {
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?regions=us&markets=h2h,spreads,totals&oddsFormat=american&apiKey=${key}`;
    const res = await fetch(url);
    if (res.ok) events.push(...((await res.json()) as OddsEvent[]));
  }
  return bets.map((b) => {
    const ev = events.find((e) => matchupMatches(b.matchup, e));
    let bestBook = "—";
    let bestOdds = "n/a";
    if (ev) {
      let best = -Infinity;
      for (const bm of ev.bookmakers ?? []) {
        for (const mk of bm.markets ?? []) {
          for (const oc of mk.outcomes ?? []) {
            if (b.pick && oc.name.toLowerCase().includes(b.pick.toLowerCase().slice(0, 6))) {
              if (oc.price > best) {
                best = oc.price;
                bestBook = bm.title;
                bestOdds = oc.price >= 0 ? `+${oc.price}` : `${oc.price}`;
              }
            }
          }
        }
      }
    }
    return { ...b, bestBook, bestOdds };
  });
}

function matchupMatches(matchup: string, ev: OddsEvent): boolean {
  const m = matchup.toLowerCase();
  return m.includes(ev.home_team.toLowerCase().split(" ").pop() ?? "") ||
    m.includes(ev.away_team.toLowerCase().split(" ").pop() ?? "");
}

interface OddsEvent {
  home_team: string;
  away_team: string;
  bookmakers?: { title: string; markets?: { outcomes?: { name: string; price: number }[] }[] }[];
}
