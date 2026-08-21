import type { NormalizedActivity, RawActivity, TimelineGroup } from "@/lib/types";
import { normalizeActivity } from "@/lib/normalize";
import { clusterActivities } from "@/lib/dedupe";
import { groupByMonth } from "@/lib/group";
import { summarizeGroup, summarizeUndated } from "@/lib/summarize";

export type PipelineError = { row: number; reason: string };

export type PipelineResult = {
  groups: TimelineGroup[];
  undated: NormalizedActivity[];
  undatedSummary: string | null;
  normalized: NormalizedActivity[];
  errors: PipelineError[];
};

/**
 * The whole transformation, start to finish: normalize -> dedupe -> group ->
 * summarize. Runs identically over the committed demo corpus (server-side)
 * and a visitor's uploaded CSV (client-side) — same function, same rules,
 * because it's pure and synchronous.
 */
export function runPipeline(rawActivities: RawActivity[]): PipelineResult {
  const normalized: NormalizedActivity[] = [];
  const errors: PipelineError[] = [];

  rawActivities.forEach((raw, i) => {
    const result = normalizeActivity(raw, `act-${i}`);
    if (result.ok) normalized.push(result.activity);
    else errors.push({ row: i + 1, reason: result.reason });
  });

  const clusters = clusterActivities(normalized);
  const { groups: monthGroups, undated: undatedClusters } = groupByMonth(clusters);

  const groups: TimelineGroup[] = monthGroups.map((g) => ({
    monthLabel: g.monthLabel,
    clusters: g.clusters,
    summary: summarizeGroup(g),
    gapBeforeDays: g.gapBeforeDays,
  }));

  const undated = undatedClusters.map((c) => c.primary);

  return {
    groups,
    undated,
    undatedSummary: undated.length > 0 ? summarizeUndated(undated.length) : null,
    normalized,
    errors,
  };
}

/** Count and last-touch date for an account-list row — deliberately pre-dedupe, so it reads as raw engagement volume. */
export function activitySpan(normalized: NormalizedActivity[]): { count: number; lastTouch: Date | null } {
  let lastTouch: Date | null = null;
  for (const activity of normalized) {
    if (activity.timestamp && (!lastTouch || activity.timestamp > lastTouch)) {
      lastTouch = activity.timestamp;
    }
  }
  return { count: normalized.length, lastTouch };
}
