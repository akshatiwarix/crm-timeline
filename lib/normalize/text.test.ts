import { describe, expect, it } from "vitest";
import { normalizeText } from "./text";

describe("normalizeText", () => {
  it("trims and collapses internal whitespace", () => {
    expect(normalizeText("  hello   world  ")).toBe("hello world");
  });

  it("leaves punctuation and casing untouched", () => {
    expect(normalizeText("Discovery call — VP Eng.")).toBe("Discovery call — VP Eng.");
  });

  it("handles empty input", () => {
    expect(normalizeText("")).toBe("");
  });
});
