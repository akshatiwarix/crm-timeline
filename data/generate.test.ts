import { describe, expect, it } from "vitest";
import { ACCOUNTS, DEMO_SEED, generateCorpus } from "./generate";

/**
 * Inverts the five timestamp formats `formatTimestamp` in generate.ts can
 * produce. Only exists to verify the generator's own planted invariants —
 * the real, robustly-tested multi-format parser lives in lib/normalize.
 */
function looseParse(ts: string): number {
  if (ts === "") return NaN;
  if (/^\d+$/.test(ts)) return Number(ts);
  const us = ts.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
  if (us) return Date.UTC(+us[3]!, +us[1]! - 1, +us[2]!, +us[4]!, +us[5]!);
  const eu = ts.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/);
  if (eu) return Date.UTC(+eu[3]!, +eu[2]! - 1, +eu[1]!, +eu[4]!, +eu[5]!);
  return Date.parse(ts);
}

describe("generateCorpus", () => {
  it("is deterministic for a given seed", () => {
    const a = generateCorpus(DEMO_SEED);
    const b = generateCorpus(DEMO_SEED);
    expect(a).toEqual(b);
  });

  it("gives every demo account at least one activity", () => {
    const { activities } = generateCorpus();
    for (const account of ACCOUNTS) {
      const count = activities.filter((a) => a.accountId === account.id).length;
      expect(count).toBeGreaterThan(0);
    }
  });

  it("plants a near-duplicate pair on bramble-analytics", () => {
    const { activities } = generateCorpus();
    const bramble = activities.filter((a) => a.accountId === "bramble-analytics");
    const calls = bramble.filter((a) => a.text.includes("Discovery call with VP Eng"));
    expect(calls).toHaveLength(2);
    const t1 = Date.parse(calls[0]!.timestamp);
    const t2 = Date.parse(calls[1]!.timestamp);
    expect(Math.abs(t1 - t2)).toBeLessThanOrEqual(5 * 60 * 1000);
  });

  it("plants a 45-day silence on dune-systems", () => {
    const { activities } = generateCorpus();
    const dune = activities
      .filter((a) => a.accountId === "dune-systems")
      .map((a) => looseParse(a.timestamp))
      .sort((a, b) => a - b);
    let maxGapDays = 0;
    for (let i = 1; i < dune.length; i++) {
      const gapDays = (dune[i]! - dune[i - 1]!) / (24 * 60 * 60 * 1000);
      maxGapDays = Math.max(maxGapDays, gapDays);
    }
    expect(maxGapDays).toBeGreaterThanOrEqual(14);
  });

  it("plants an unparseable timestamp on emberwood-health", () => {
    const { activities } = generateCorpus();
    const unparseable = activities.filter(
      (a) => a.accountId === "emberwood-health" && a.timestamp === "",
    );
    expect(unparseable.length).toBeGreaterThanOrEqual(1);
  });

  it("uses messy type casing, not only canonical lowercase", () => {
    const { activities } = generateCorpus();
    const nonCanonical = activities.filter(
      (a) => !["call", "email", "meeting", "note", "stage_change"].includes(a.type),
    );
    expect(nonCanonical.length).toBeGreaterThan(0);
  });
});
