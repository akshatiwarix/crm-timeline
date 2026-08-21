"use client";

import { useState } from "react";
import type { ActivityCluster, NormalizedActivity } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { TYPE_COLOR_CLASS, TYPE_LABEL } from "./type-meta";

function activityLine(activity: NormalizedActivity): string {
  if (activity.type === "stage_change") {
    return `${activity.fromStage ?? "?"} → ${activity.toStage ?? "?"}`;
  }
  return activity.text || "(no notes)";
}

export function ClusterCard({ cluster }: { cluster: ActivityCluster }) {
  const [expanded, setExpanded] = useState(false);
  const { primary, merged } = cluster;
  const total = 1 + merged.length;

  return (
    <div className="rounded-lg border border-line bg-paper-raised p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLOR_CLASS[primary.type]}`}>
            {TYPE_LABEL[primary.type]}
          </span>
          {primary.timestamp && (
            <span className="text-xs tabular-nums text-ink-dim">{formatDateTime(primary.timestamp)}</span>
          )}
        </div>
        {total > 1 && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            className="rounded-full border border-line-strong px-2 py-0.5 text-xs font-medium text-ink-dim hover:text-ink"
          >
            ×{total} {expanded ? "▲" : "▼"}
          </button>
        )}
      </div>
      <p className="mt-2 text-sm text-ink">{activityLine(primary)}</p>
      {expanded && (
        <div className="mt-3 space-y-2 border-t border-line pt-3">
          {[primary, ...merged].map((a) => (
            <div key={a.id} className="text-xs text-ink-dim">
              <span className="tabular-nums">{a.timestamp ? formatDateTime(a.timestamp) : "undated"}</span>
              {" — "}
              {activityLine(a)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
