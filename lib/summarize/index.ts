import type { MonthGroup } from "@/lib/group";

const COUNTED_TYPES = ["call", "email", "meeting", "note"] as const;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Builds a deterministic, templated one-liner for a month group — e.g.
 * "3 calls, 2 emails, stage moved Discovery → Proposal over 12 days". No
 * external API call: the counts, the net stage movement, and the span are
 * all read directly off the group.
 */
export function summarizeGroup(group: MonthGroup): string {
  const counts: Record<(typeof COUNTED_TYPES)[number], number> = {
    call: 0,
    email: 0,
    meeting: 0,
    note: 0,
  };
  const stageClusters = group.clusters.filter((c) => c.primary.type === "stage_change");
  let minTs: number | null = null;
  let maxTs: number | null = null;

  for (const cluster of group.clusters) {
    const { type, timestamp } = cluster.primary;
    if (timestamp) {
      const t = timestamp.getTime();
      minTs = minTs === null ? t : Math.min(minTs, t);
      maxTs = maxTs === null ? t : Math.max(maxTs, t);
    }
    if (type !== "stage_change") counts[type]++;
  }

  const parts = COUNTED_TYPES.filter((type) => counts[type] > 0).map(
    (type) => `${counts[type]} ${type}${counts[type] > 1 ? "s" : ""}`,
  );

  let text = parts.join(", ");

  if (stageClusters.length > 0) {
    const first = stageClusters[0]!.primary;
    const last = stageClusters[stageClusters.length - 1]!.primary;
    const movement = `stage moved ${first.fromStage ?? "?"} → ${last.toStage ?? "?"}`;
    text = text ? `${text}, ${movement}` : movement;
  }

  if (minTs !== null && maxTs !== null && maxTs > minTs) {
    const spanDays = Math.round((maxTs - minTs) / MS_PER_DAY);
    if (spanDays > 0) text += ` over ${spanDays} day${spanDays === 1 ? "" : "s"}`;
  }

  return text || "No notable activity this month.";
}

/** One-liner for the undated bucket — never hidden, always counted. */
export function summarizeUndated(count: number): string {
  return `${count} ${count === 1 ? "activity" : "activities"} without a usable date.`;
}
