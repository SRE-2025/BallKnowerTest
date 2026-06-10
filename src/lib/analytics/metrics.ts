export interface Metrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  watchTimeSec: number;
}

// Deterministic pseudo-metrics derived from an id, so the analytics views render
// stable numbers without real platform data. The real importer (import.ts)
// fetches actual numbers in database mode.
export function pseudoMetrics(seed: string): Metrics {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const rand = (n: number) => (h = (h * 1103515245 + 12345) >>> 0) % n;
  const views = 5000 + rand(95000);
  const likes = Math.round(views * (0.04 + rand(60) / 1000));
  const comments = Math.round(likes * (0.05 + rand(50) / 1000));
  const shares = Math.round(likes * (0.02 + rand(40) / 1000));
  const watchTimeSec = Math.round(views * (8 + rand(20)));
  return { views, likes, comments, shares, watchTimeSec };
}

export function engagementRate(m: Metrics): number {
  if (m.views === 0) return 0;
  return (m.likes + m.comments + m.shares) / m.views;
}
