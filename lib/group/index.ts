import type { ActivityCluster } from "@/lib/types";

export const GAP_THRESHOLD_DAYS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** A month's worth of clusters, before summarize.ts fills in the one-liner. */
export type MonthGroup = {
  monthLabel: string;
  clusters: ActivityCluster[];
  gapBeforeDays?: number;
};

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth()).padStart(2, "0")}`;
}

/**
 * Groups dated clusters into month buckets in chronological order, and
 * separates undated ones out entirely — they have no month to belong to.
 * A month with no activity produces no group at all, so a gap spanning
 * several silent months collapses onto the single `gapBeforeDays` value
 * carried by the next month that actually has something in it.
 */
export function groupByMonth(clusters: ActivityCluster[]): {
  groups: MonthGroup[];
  undated: ActivityCluster[];
} {
  const dated = clusters.filter((c) => c.primary.timestamp !== null);
  const undated = clusters.filter((c) => c.primary.timestamp === null);

  const sorted = [...dated].sort(
    (a, b) => a.primary.timestamp!.getTime() - b.primary.timestamp!.getTime(),
  );

  const groups: MonthGroup[] = [];
  let currentKey: string | null = null;
  let currentGroup: MonthGroup | null = null;
  let lastSeenMs: number | null = null;

  for (const cluster of sorted) {
    const date = cluster.primary.timestamp!;
    const ts = date.getTime();
    const key = monthKey(date);

    if (key !== currentKey) {
      const gapDays = lastSeenMs !== null ? (ts - lastSeenMs) / MS_PER_DAY : undefined;
      currentGroup = {
        monthLabel: monthLabel(date),
        clusters: [],
        gapBeforeDays: gapDays !== undefined && gapDays >= GAP_THRESHOLD_DAYS ? Math.round(gapDays) : undefined,
      };
      groups.push(currentGroup);
      currentKey = key;
    }

    currentGroup!.clusters.push(cluster);
    lastSeenMs = ts;
  }

  return { groups, undated };
}
