// Official YouTube channel IDs + search hints per league/source. "Pull from the
// league" in practice means their official highlight channel — that's where
// leagues publish public highlights. Partner/broadcast media APIs (which return
// direct MP4s) plug in via the "url" resolver instead.
export interface LeagueChannel {
  key: string;
  label: string;
  sport: string;
  channelId?: string; // YouTube channel id (UC...)
  query: string; // fallback/search query
}

export const LEAGUE_CHANNELS: LeagueChannel[] = [
  { key: "nba", label: "NBA", sport: "Basketball", channelId: "UCWJ2lWNubArHWmf3FIHbfcQ", query: "NBA top plays highlights" },
  { key: "wnba", label: "WNBA", sport: "Basketball", channelId: "UCq8Fm0Cv8L_6m5gVc5qcvKA", query: "WNBA highlights" },
  { key: "nhl", label: "NHL", sport: "Hockey", channelId: "UCqFMzb-4AUf6WAIbl132QKA", query: "NHL highlights" },
  { key: "mlb", label: "MLB", sport: "Baseball", channelId: "UCoLrcjPV5PbUrUyXq5mjc_A", query: "MLB highlights" },
  { key: "nfl", label: "NFL", sport: "Football", channelId: "UCDVYQ4Zhbm3S2dlz7P1GBDg", query: "NFL highlights" },
  { key: "mls", label: "MLS", sport: "Soccer", channelId: "UCSZbXT5TLLW_i-5W8FZpFsg", query: "MLS highlights" },
  { key: "savannah_bananas", label: "Savannah Bananas", sport: "Entertainment", channelId: "UC9XdpQ_iGfH8U6T-rImhrSg", query: "Savannah Bananas trick play" },
  { key: "dude_perfect", label: "Dude Perfect", sport: "Trick Shots", channelId: "UCRijo3ddMTht_IHyNSNXpNQ", query: "Dude Perfect trick shot" },
];

export function leagueByKey(key: string): LeagueChannel | undefined {
  return LEAGUE_CHANNELS.find((l) => l.key === key);
}
