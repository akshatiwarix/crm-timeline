import { describe, expect, it } from "vitest";
import { normalizeActivity } from "./index";
import type { RawActivity } from "@/lib/types";

const base: RawActivity = {
  accountId: "acct-1",
  type: "Phone Call",
  timestamp: "2026-08-21T14:30:00.000Z",
  text: "  Discovery call   with VP Eng.  ",
};

describe("normalizeActivity", () => {
  it("normalizes a well-formed row", () => {
    const result = normalizeActivity(base, "act-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.activity).toEqual({
      id: "act-1",
      accountId: "acct-1",
      type: "call",
      timestamp: new Date("2026-08-21T14:30:00.000Z"),
      text: "Discovery call with VP Eng.",
      fromStage: undefined,
      toStage: undefined,
    });
  });

  it("degrades an unparseable timestamp to null instead of failing", () => {
    const result = normalizeActivity({ ...base, timestamp: "" }, "act-2");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.activity.timestamp).toBeNull();
  });

  it("fails on an unrecognized activity type", () => {
    const result = normalizeActivity({ ...base, type: "task" }, "act-3");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain("task");
  });

  it("carries and normalizes stage fields on stage_change rows", () => {
    const result = normalizeActivity(
      { ...base, type: "Stage Change", fromStage: " Discovery ", toStage: "Proposal" },
      "act-4",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.activity.fromStage).toBe("Discovery");
    expect(result.activity.toStage).toBe("Proposal");
  });
});
