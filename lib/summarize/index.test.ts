import { describe, expect, it } from "vitest";
import { summarizeGroup, summarizeUndated } from "./index";
import type { MonthGroup } from "@/lib/group";
import type { ActivityCluster, NormalizedActivity } from "@/lib/types";

function activity(overrides: Partial<NormalizedActivity>): NormalizedActivity {
  return {
    id: "id",
    accountId: "acct-1",
    type: "call",
    timestamp: new Date("2026-08-01T00:00:00.000Z"),
    text: "",
    ...overrides,
  };
}

function solo(activityOverrides: Partial<NormalizedActivity>): ActivityCluster {
  return { primary: activity(activityOverrides), merged: [] };
}

function group(clusters: ActivityCluster[]): MonthGroup {
  return { monthLabel: "August 2026", clusters };
}

describe("summarizeGroup", () => {
  it("counts activity types, singular for 1", () => {
    const g = group([
      solo({ id: "a", type: "call", timestamp: new Date("2026-08-01T00:00:00.000Z") }),
      solo({ id: "b", type: "email", timestamp: new Date("2026-08-01T00:00:00.000Z") }),
    ]);
    expect(summarizeGroup(g)).toBe("1 call, 1 email");
  });

  it("pluralizes counts above 1", () => {
    const g = group([
      solo({ id: "a", type: "call", timestamp: new Date("2026-08-01T00:00:00.000Z") }),
      solo({ id: "b", type: "call", timestamp: new Date("2026-08-05T00:00:00.000Z") }),
    ]);
    expect(summarizeGroup(g)).toBe("2 calls over 4 days");
  });

  it("adds net stage movement across the group", () => {
    const g = group([
      solo({
        id: "s1",
        type: "stage_change",
        fromStage: "Discovery",
        toStage: "Qualification",
        timestamp: new Date("2026-08-01T00:00:00.000Z"),
      }),
      solo({
        id: "s2",
        type: "stage_change",
        fromStage: "Qualification",
        toStage: "Proposal",
        timestamp: new Date("2026-08-13T00:00:00.000Z"),
      }),
    ]);
    expect(summarizeGroup(g)).toBe("stage moved Discovery → Proposal over 12 days");
  });

  it("combines counts, stage movement, and span in one line", () => {
    const g = group([
      solo({ id: "a", type: "call", timestamp: new Date("2026-08-01T00:00:00.000Z") }),
      solo({ id: "b", type: "call", timestamp: new Date("2026-08-05T00:00:00.000Z") }),
      solo({ id: "c", type: "email", timestamp: new Date("2026-08-06T00:00:00.000Z") }),
      solo({ id: "d", type: "email", timestamp: new Date("2026-08-08T00:00:00.000Z") }),
      solo({
        id: "s1",
        type: "stage_change",
        fromStage: "Discovery",
        toStage: "Proposal",
        timestamp: new Date("2026-08-13T00:00:00.000Z"),
      }),
    ]);
    expect(summarizeGroup(g)).toBe("2 calls, 2 emails, stage moved Discovery → Proposal over 12 days");
  });

  it("omits the span clause when everything happens on the same day", () => {
    const g = group([
      solo({ id: "a", type: "call", timestamp: new Date("2026-08-01T09:00:00.000Z") }),
      solo({ id: "b", type: "email", timestamp: new Date("2026-08-01T15:00:00.000Z") }),
    ]);
    expect(summarizeGroup(g)).toBe("1 call, 1 email");
  });
});

describe("summarizeUndated", () => {
  it("uses singular for 1", () => {
    expect(summarizeUndated(1)).toBe("1 activity without a usable date.");
  });

  it("uses plural for other counts", () => {
    expect(summarizeUndated(3)).toBe("3 activities without a usable date.");
    expect(summarizeUndated(0)).toBe("0 activities without a usable date.");
  });
});
