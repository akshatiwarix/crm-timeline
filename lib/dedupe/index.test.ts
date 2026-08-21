import { describe, expect, it } from "vitest";
import { clusterActivities, isDuplicate } from "./index";
import type { NormalizedActivity } from "@/lib/types";

function activity(overrides: Partial<NormalizedActivity>): NormalizedActivity {
  return {
    id: "id",
    accountId: "acct-1",
    type: "call",
    timestamp: new Date("2026-08-21T14:30:00.000Z"),
    text: "Discovery call with VP Eng.",
    ...overrides,
  };
}

describe("isDuplicate", () => {
  const a = activity({ id: "a" });

  it("matches near-identical text within the window", () => {
    const b = activity({
      id: "b",
      timestamp: new Date("2026-08-21T14:33:00.000Z"),
      text: "Discovery call with VP Eng",
    });
    expect(isDuplicate(a, b)).toBe(true);
  });

  it("rejects a different account", () => {
    const b = activity({ id: "b", accountId: "acct-2" });
    expect(isDuplicate(a, b)).toBe(false);
  });

  it("rejects a different type", () => {
    const b = activity({ id: "b", type: "email" });
    expect(isDuplicate(a, b)).toBe(false);
  });

  it("rejects timestamps more than 5 minutes apart", () => {
    const b = activity({ id: "b", timestamp: new Date("2026-08-21T14:36:01.000Z") });
    expect(isDuplicate(a, b)).toBe(false);
  });

  it("rejects dissimilar text within the window", () => {
    const b = activity({
      id: "b",
      timestamp: new Date("2026-08-21T14:31:00.000Z"),
      text: "Sent pricing sheet and case study.",
    });
    expect(isDuplicate(a, b)).toBe(false);
  });

  it("rejects when either timestamp is null", () => {
    const b = activity({ id: "b", timestamp: null });
    expect(isDuplicate(a, b)).toBe(false);
    expect(isDuplicate(b, a)).toBe(false);
  });

  it("requires an exact stage match for stage_change rows, ignoring text", () => {
    const s1 = activity({ id: "s1", type: "stage_change", text: "", fromStage: "Discovery", toStage: "Proposal" });
    const s2 = activity({
      id: "s2",
      type: "stage_change",
      text: "",
      timestamp: new Date("2026-08-21T14:31:00.000Z"),
      fromStage: "Discovery",
      toStage: "Proposal",
    });
    const s3 = activity({
      id: "s3",
      type: "stage_change",
      text: "",
      timestamp: new Date("2026-08-21T14:31:00.000Z"),
      fromStage: "Proposal",
      toStage: "Negotiation",
    });
    expect(isDuplicate(s1, s2)).toBe(true);
    expect(isDuplicate(s1, s3)).toBe(false);
  });
});

describe("clusterActivities", () => {
  it("merges a chain of near-duplicates into one cluster with a badge count", () => {
    const activities = [
      activity({ id: "a1", timestamp: new Date("2026-08-21T14:30:00.000Z") }),
      activity({ id: "a2", timestamp: new Date("2026-08-21T14:33:00.000Z") }),
      activity({
        id: "a3",
        timestamp: new Date("2026-08-21T14:50:00.000Z"),
        text: "Sent pricing sheet and case study.",
        type: "email",
      }),
    ];
    const clusters = clusterActivities(activities);
    expect(clusters).toHaveLength(2);
    const merged = clusters.find((c) => c.primary.id === "a1");
    expect(merged?.merged.map((m) => m.id)).toEqual(["a2"]);
    const solo = clusters.find((c) => c.primary.id === "a3");
    expect(solo?.merged).toEqual([]);
  });

  it("keeps clusters scoped per account even with overlapping timestamps", () => {
    const activities = [
      activity({ id: "a1", accountId: "acct-1" }),
      activity({ id: "a2", accountId: "acct-2", timestamp: new Date("2026-08-21T14:31:00.000Z") }),
    ];
    const clusters = clusterActivities(activities);
    expect(clusters).toHaveLength(2);
  });

  it("never merges undated activities, each gets its own cluster", () => {
    const activities = [
      activity({ id: "u1", timestamp: null }),
      activity({ id: "u2", timestamp: null }),
    ];
    const clusters = clusterActivities(activities);
    expect(clusters).toHaveLength(2);
    expect(clusters.every((c) => c.merged.length === 0)).toBe(true);
  });
});
