import type { ActivityCluster, NormalizedActivity } from "@/lib/types";
import { jaccardSimilarity } from "./similarity";

export const DEDUPE_WINDOW_MS = 5 * 60 * 1000;
export const SIMILARITY_THRESHOLD = 0.8;

/**
 * `stage_change` rows usually carry empty free text — their content is the
 * stage transition, not prose — so two stage changes only count as similar
 * when the transition itself matches exactly. Every other type falls back to
 * token-overlap similarity on the free text.
 */
function contentSimilarity(a: NormalizedActivity, b: NormalizedActivity): number {
  if (a.type === "stage_change" || b.type === "stage_change") {
    return a.fromStage === b.fromStage && a.toStage === b.toStage ? 1 : 0;
  }
  return jaccardSimilarity(a.text, b.text);
}

/**
 * Two activities are near-duplicates when: same account, same type,
 * timestamps within 5 minutes of each other, and content similarity at or
 * above 0.8. Undated activities never merge with anything — there's no
 * window to compare.
 */
export function isDuplicate(a: NormalizedActivity, b: NormalizedActivity): boolean {
  if (a.accountId !== b.accountId) return false;
  if (a.type !== b.type) return false;
  if (!a.timestamp || !b.timestamp) return false;
  const deltaMs = Math.abs(a.timestamp.getTime() - b.timestamp.getTime());
  if (deltaMs > DEDUPE_WINDOW_MS) return false;
  return contentSimilarity(a, b) >= SIMILARITY_THRESHOLD;
}

/**
 * Groups activities into clusters, merging near-duplicates. Each dated
 * activity is compared against the current cluster's primary (the earliest
 * in the run) — so a chain of near-identical logs collapses into one
 * cluster, always inspectable via `merged`, never silently dropped.
 * Undated activities each get their own singleton cluster.
 */
export function clusterActivities(activities: NormalizedActivity[]): ActivityCluster[] {
  const byAccount = new Map<string, NormalizedActivity[]>();
  for (const activity of activities) {
    const list = byAccount.get(activity.accountId) ?? [];
    list.push(activity);
    byAccount.set(activity.accountId, list);
  }

  const clusters: ActivityCluster[] = [];
  for (const list of byAccount.values()) {
    const dated = list
      .filter((a): a is NormalizedActivity & { timestamp: Date } => a.timestamp !== null)
      .sort((x, y) => x.timestamp.getTime() - y.timestamp.getTime());
    const undated = list.filter((a) => a.timestamp === null);

    let current: ActivityCluster | null = null;
    for (const activity of dated) {
      if (current && isDuplicate(current.primary, activity)) {
        current.merged.push(activity);
      } else {
        current = { primary: activity, merged: [] };
        clusters.push(current);
      }
    }
    for (const activity of undated) {
      clusters.push({ primary: activity, merged: [] });
    }
  }

  return clusters;
}
