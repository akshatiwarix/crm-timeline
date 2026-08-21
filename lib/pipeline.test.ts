import { describe, expect, it } from "vitest";
import { activitySpan, runPipeline } from "./pipeline";
import { generateCorpus } from "@/data/generate";
import type { RawActivity } from "@/lib/types";

describe("runPipeline", () => {
  it("normalizes, dedupes, groups, and summarizes well-formed rows", () => {
    const raw: RawActivity[] = [
      { accountId: "acct-1", type: "Call", timestamp: "2026-08-01T00:00:00.000Z", text: "call one" },
      { accountId: "acct-1", type: "Email", timestamp: "2026-08-05T00:00:00.000Z", text: "email one" },
    ];
    const result = runPipeline(raw);
    expect(result.errors).toEqual([]);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0]?.summary).toBe("1 call, 1 email over 4 days");
  });

  it("reports unrecognized activity types as errors without failing the rest", () => {
    const raw: RawActivity[] = [
      { accountId: "acct-1", type: "carrier pigeon", timestamp: "2026-08-01T00:00:00.000Z", text: "??" },
      { accountId: "acct-1", type: "Call", timestamp: "2026-08-02T00:00:00.000Z", text: "real call" },
    ];
    const result = runPipeline(raw);
    expect(result.errors).toEqual([{ row: 1, reason: expect.stringContaining("carrier pigeon") }]);
    expect(result.normalized).toHaveLength(1);
  });

  it("buckets unparseable timestamps as undated, with a summary line", () => {
    const raw: RawActivity[] = [{ accountId: "acct-1", type: "Note", timestamp: "", text: "no date" }];
    const result = runPipeline(raw);
    expect(result.undated).toHaveLength(1);
    expect(result.undatedSummary).toBe("1 activity without a usable date.");
    expect(result.groups).toEqual([]);
  });
});

describe("activitySpan", () => {
  it("counts activities and finds the latest timestamp", () => {
    const result = runPipeline([
      { accountId: "acct-1", type: "call", timestamp: "2026-08-01T00:00:00.000Z", text: "" },
      { accountId: "acct-1", type: "call", timestamp: "2026-08-10T00:00:00.000Z", text: "" },
    ]);
    const span = activitySpan(result.normalized);
    expect(span.count).toBe(2);
    expect(span.lastTouch?.toISOString()).toBe("2026-08-10T00:00:00.000Z");
  });

  it("handles no activities", () => {
    expect(activitySpan([])).toEqual({ count: 0, lastTouch: null });
  });
});

describe("runPipeline against the demo corpus signature accounts", () => {
  const { activities } = generateCorpus();
  const byAccount = (id: string) => activities.filter((a) => a.accountId === id);

  it("dedupes the bramble-analytics near-duplicate call pair", () => {
    const result = runPipeline(byAccount("bramble-analytics"));
    const merged = result.groups.flatMap((g) => g.clusters).find((c) => c.merged.length > 0);
    expect(merged).toBeDefined();
    expect(merged?.merged).toHaveLength(1);
  });

  it("flags the dune-systems 45-day silence with a gap marker", () => {
    const result = runPipeline(byAccount("dune-systems"));
    const gapGroup = result.groups.find((g) => g.gapBeforeDays !== undefined);
    expect(gapGroup).toBeDefined();
    expect(gapGroup!.gapBeforeDays!).toBeGreaterThanOrEqual(14);
  });

  it("buckets the emberwood-health unparseable timestamp as undated", () => {
    const result = runPipeline(byAccount("emberwood-health"));
    expect(result.undated.length).toBeGreaterThanOrEqual(1);
  });

  it("produces zero normalization errors across the whole demo corpus", () => {
    const result = runPipeline(activities);
    expect(result.errors).toEqual([]);
  });
});
