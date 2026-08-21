import { describe, expect, it } from "vitest";
import { jaccardSimilarity } from "./similarity";

describe("jaccardSimilarity", () => {
  it("is 1 for identical text", () => {
    expect(jaccardSimilarity("hello world", "hello world")).toBe(1);
  });

  it("is 1 for text differing only in punctuation and case", () => {
    const a = "Discovery call with VP Eng — walked through current workflow and pain points.";
    const b = "discovery call with vp eng - walked through current workflow and pain points";
    expect(jaccardSimilarity(a, b)).toBe(1);
  });

  it("is 0 for completely disjoint text", () => {
    expect(jaccardSimilarity("apples bananas", "trucks rockets")).toBe(0);
  });

  it("is 1 for two empty strings", () => {
    expect(jaccardSimilarity("", "")).toBe(1);
  });

  it("is 0 when only one side is empty", () => {
    expect(jaccardSimilarity("hello", "")).toBe(0);
  });

  it("is partial for overlapping-but-different text", () => {
    const score = jaccardSimilarity("quick check-in, no updates", "quick call, big updates");
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });
});
