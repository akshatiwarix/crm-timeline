import { describe, expect, it } from "vitest";
import { normalizeActivityType } from "./type";

describe("normalizeActivityType", () => {
  it.each([
    ["call", "call"],
    ["Call", "call"],
    ["CALL", "call"],
    ["Phone Call", "call"],
    ["phone call", "call"],
    ["Cold Call", "call"],
    ["email", "email"],
    ["Email", "email"],
    ["EMAIL", "email"],
    ["e-mail", "email"],
    ["Sent Email", "email"],
    ["meeting", "meeting"],
    ["Meeting", "meeting"],
    ["MEETING", "meeting"],
    ["Mtg", "meeting"],
    ["Zoom Meeting", "meeting"],
    ["note", "note"],
    ["Note", "note"],
    ["NOTE", "note"],
    ["Notes", "note"],
    ["stage_change", "stage_change"],
    ["Stage Change", "stage_change"],
    ["STAGE_CHANGE", "stage_change"],
    ["Stage changed", "stage_change"],
    ["stage-change", "stage_change"],
  ] as const)("maps %s -> %s", (input, expected) => {
    expect(normalizeActivityType(input)).toBe(expected);
  });

  it("returns null for unrecognized types", () => {
    expect(normalizeActivityType("task")).toBeNull();
    expect(normalizeActivityType("xyz")).toBeNull();
    expect(normalizeActivityType("")).toBeNull();
  });
});
