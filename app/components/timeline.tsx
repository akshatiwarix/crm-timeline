import type { PipelineResult } from "@/lib/pipeline";
import { ClusterCard } from "./cluster-card";
import { GapMarker } from "./gap-marker";

/** Renders newest-first: reverses both the month groups and each group's clusters. */
export function Timeline({ result }: { result: PipelineResult }) {
  const groups = [...result.groups].reverse();

  if (groups.length === 0 && result.undated.length === 0) {
    return <p className="text-sm text-ink-dim">No activity recorded for this account.</p>;
  }

  return (
    <div className="space-y-8">
      {result.undated.length > 0 && (
        <section>
          <h2 className="font-display text-lg italic text-ink-dim">Undated</h2>
          <p className="mt-1 text-xs text-ink-dim">{result.undatedSummary}</p>
          <div className="mt-3 space-y-3">
            {result.undated.map((activity) => (
              <ClusterCard key={activity.id} cluster={{ primary: activity, merged: [] }} />
            ))}
          </div>
        </section>
      )}

      {groups.map((group) => (
        <section key={group.monthLabel}>
          <h2 className="font-display text-lg italic text-ink">{group.monthLabel}</h2>
          <p className="mt-1 text-xs text-ink-dim">{group.summary}</p>
          <div className="mt-3 space-y-3">
            {[...group.clusters].reverse().map((cluster) => (
              <ClusterCard key={cluster.primary.id} cluster={cluster} />
            ))}
          </div>
          {group.gapBeforeDays !== undefined && (
            <div className="mt-4">
              <GapMarker days={group.gapBeforeDays} />
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
