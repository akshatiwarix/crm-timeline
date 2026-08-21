import { describe, expect, it } from "vitest";
import { groupByMonth } from "./index";
import type { ActivityCluster, NormalizedActivity } from "@/lib/types";

function cluster(id: string, timestamp: string | null): ActivityCluster {
  const activity: NormalizedActivity = {
    id,
    accountId: "acct-1",
    type: "call",
    timestamp: timestamp ? new Date(timestamp) : null,
    text: "text",
  };
  return { primary: activity, merged: [] };
}

describe("groupByMonth", () => {
  it("groups clusters within the same month together", () => {
    const { groups } = groupByMonth([
      cluster("a", "2026-08-01T00:00:00.000Z"),
      cluster("b", "2026-08-15T00:00:00.000Z"),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.monthLabel).toBe("August 2026");
    expect(groups[0]?.clusters.map((c) => c.primary.id)).toEqual(["a", "b"]);
  });

  it("splits clusters across month boundaries", () => {
    const { groups } = groupByMonth([
      cluster("a", "2026-08-01T00:00:00.000Z"),
      cluster("b", "2026-09-01T00:00:00.000Z"),
    ]);
    expect(groups.map((g) => g.monthLabel)).toEqual(["August 2026", "September 2026"]);
  });

  it("flags a gap of 14+ days on the following group, spanning skipped months", () => {
    const { groups } = groupByMonth([
      cluster("a", "2026-08-01T00:00:00.000Z"),
      cluster("b", "2026-10-05T00:00:00.000Z"), // 65 days later, skips September entirely
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.gapBeforeDays).toBeUndefined();
    expect(groups[1]?.monthLabel).toBe("October 2026");
    expect(groups[1]?.gapBeforeDays).toBe(65);
  });

  it("does not flag a gap under 14 days, even across a month boundary", () => {
    const { groups } = groupByMonth([
      cluster("a", "2026-08-25T00:00:00.000Z"),
      cluster("b", "2026-09-03T00:00:00.000Z"), // 9 days later, under threshold
    ]);
    expect(groups[1]?.gapBeforeDays).toBeUndefined();
  });

  it("separates undated clusters out entirely", () => {
    const { groups, undated } = groupByMonth([
      cluster("a", "2026-08-01T00:00:00.000Z"),
      cluster("u", null),
    ]);
    expect(groups).toHaveLength(1);
    expect(undated.map((c) => c.primary.id)).toEqual(["u"]);
  });
});
