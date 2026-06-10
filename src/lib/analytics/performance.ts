import { engagementRate, type Metrics } from "./metrics";

export interface PerfRow {
  key: string;
  metrics: Metrics;
}

export interface PerfSummary {
  key: string;
  posts: number;
  totalViews: number;
  avgEngagement: number;
}

// Aggregates per-key performance (key = source / category / hook / caption /
// platform) and ranks by average engagement. Pure function reused by the
// analytics page and the producer feedback loop.
export function summarize(rows: PerfRow[]): PerfSummary[] {
  const groups = new Map<string, { posts: number; views: number; engSum: number }>();
  for (const r of rows) {
    const g = groups.get(r.key) ?? { posts: 0, views: 0, engSum: 0 };
    g.posts += 1;
    g.views += r.metrics.views;
    g.engSum += engagementRate(r.metrics);
    groups.set(r.key, g);
  }
  return Array.from(groups.entries())
    .map(([key, g]) => ({ key, posts: g.posts, totalViews: g.views, avgEngagement: g.engSum / g.posts }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement);
}
