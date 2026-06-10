import type { Source } from "@/lib/types";

// Fictional sources for demo purposes. Provenance fields are first-class so the
// platform can SUPPORT licensing/attribution — the BallKnower team owns the
// legal side of which sources are cleared for use.
export const mockSources: Source[] = [
  {
    id: "src_highlight_wire",
    providerName: "HighlightWire",
    showName: "Daily Highlight Feed",
    type: "HIGHLIGHT_FEED",
    sportLeague: "Multi-sport",
    importMethod: "API",
    active: true,
    notes: "Primary highlight feed. Cleared for short-form use per partner agreement.",
    settings: {
      allowedPlatforms: ["TIKTOK", "INSTAGRAM_REELS", "YOUTUBE_SHORTS", "FACEBOOK_REELS"],
      maxClipSeconds: 30,
      attributionText: "Highlights via HighlightWire",
      watermarkNotes: "Keep provider bug in bottom-right when present.",
      notes: "Best source for game-winners and buzzer beaters.",
    },
  },
  {
    id: "src_hot_mics",
    providerName: "Hot Mics Network",
    showName: "The Daily Debate",
    type: "TALKING_HEAD_SHOW",
    sportLeague: "Multi-sport",
    importMethod: "RSS",
    active: true,
    notes: "Talking-head debate show. Great for Best Takes format.",
    settings: {
      allowedPlatforms: ["TIKTOK", "INSTAGRAM_REELS", "YOUTUBE_SHORTS"],
      maxClipSeconds: 45,
      attributionText: "Clip via The Daily Debate (Hot Mics Network)",
      watermarkNotes: "No watermark required.",
      notes: "Pull strongest hot takes and analyst disagreements.",
    },
  },
  {
    id: "src_court_vision",
    providerName: "Viral Social",
    showName: "Viral Sports Moments",
    type: "YOUTUBE_CHANNEL",
    sportLeague: "Cross-platform (TikTok / IG / YouTube / X)",
    importMethod: "YOUTUBE",
    active: true,
    notes:
      "Whatever blew up on social that day — a viral clip from TikTok, Instagram, YouTube or X. NOT a trick-shot show; trick shots are just one example. Real-athlete plays rank first, but a moment that blows up online is eligible for the Top 7.",
    settings: {
      allowedPlatforms: ["YOUTUBE_SHORTS", "INSTAGRAM_REELS", "TIKTOK"],
      maxClipSeconds: 30,
      attributionText: "Footage via original creator (credit on screen)",
      notes: "Always credit the original creator on screen.",
    },
  },
  {
    id: "src_pitchside",
    providerName: "Pitchside RSS",
    showName: "Pitchside Daily",
    type: "RSS_FEED",
    sportLeague: "Soccer",
    importMethod: "RSS",
    active: true,
    notes: "Soccer goals and skill moments.",
    settings: {
      allowedPlatforms: ["TIKTOK", "INSTAGRAM_REELS", "FACEBOOK_REELS"],
      maxClipSeconds: 20,
      attributionText: "Via Pitchside Daily",
      watermarkNotes: "Crop out broadcast logo per agreement.",
    },
  },
  {
    id: "src_breaking_desk",
    providerName: "Breaking Desk",
    showName: "Trade Alert",
    type: "API_SOURCE",
    sportLeague: "Multi-sport",
    importMethod: "API",
    active: true,
    notes: "Breaking news + reaction clips (trades, injuries, signings).",
    settings: {
      allowedPlatforms: ["TIKTOK", "YOUTUBE_SHORTS", "X"],
      maxClipSeconds: 40,
      attributionText: "Reporting via Breaking Desk",
    },
  },
  {
    id: "src_team_uploads",
    providerName: "BallKnower Uploads",
    showName: "Internal Captures",
    type: "UPLOADED_VIDEO",
    sportLeague: "Multi-sport",
    importMethod: "MANUAL_UPLOAD",
    active: false,
    notes: "Manually uploaded clips from the team. Currently inactive.",
    settings: {
      allowedPlatforms: ["TIKTOK", "INSTAGRAM_REELS", "YOUTUBE_SHORTS", "FACEBOOK_REELS", "X"],
      maxClipSeconds: 60,
      notes: "No attribution needed for owned footage.",
    },
  },
];
