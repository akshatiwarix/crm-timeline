import { describe, expect, it } from "vitest";
import { parseCsvActivities, tokenizeCsv } from "./index";

describe("tokenizeCsv", () => {
  it("splits plain rows", () => {
    expect(tokenizeCsv("a,b,c\n1,2,3\n")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles quoted fields containing commas", () => {
    expect(tokenizeCsv('a,b\n"hello, world",2\n')).toEqual([
      ["a", "b"],
      ["hello, world", "2"],
    ]);
  });

  it("handles doubled quotes as an escaped literal quote", () => {
    expect(tokenizeCsv('a\n"she said ""hi"""\n')).toEqual([["a"], ['she said "hi"']]);
  });

  it("handles quoted fields containing newlines", () => {
    expect(tokenizeCsv('a\n"line one\nline two"\n')).toEqual([["a"], ["line one\nline two"]]);
  });

  it("handles a file with no trailing newline", () => {
    expect(tokenizeCsv("a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("returns nothing for an empty string", () => {
    expect(tokenizeCsv("")).toEqual([]);
  });
});

const HEADER = "accountId,type,timestamp,text,fromStage,toStage";

describe("parseCsvActivities", () => {
  it("parses well-formed rows", () => {
    const csv = `${HEADER}\nacct-1,Call,2026-08-21T14:30:00.000Z,Discovery call,,\n`;
    const { activities, errors } = parseCsvActivities(csv);
    expect(errors).toEqual([]);
    expect(activities).toEqual([
      { accountId: "acct-1", type: "Call", timestamp: "2026-08-21T14:30:00.000Z", text: "Discovery call" },
    ]);
  });

  it("carries optional stage columns when present", () => {
    const csv = `${HEADER}\nacct-1,Stage Change,2026-08-21,,Discovery,Proposal\n`;
    const { activities, errors } = parseCsvActivities(csv);
    expect(errors).toEqual([]);
    expect(activities[0]).toMatchObject({ fromStage: "Discovery", toStage: "Proposal" });
  });

  it("allows empty timestamp and text — those are normalize's job, not csv's", () => {
    const csv = `${HEADER}\nacct-1,Note,,,,\n`;
    const { activities, errors } = parseCsvActivities(csv);
    expect(errors).toEqual([]);
    expect(activities[0]).toMatchObject({ timestamp: "", text: "" });
  });

  it("reports a whole-file error for missing required columns", () => {
    const { activities, errors } = parseCsvActivities("accountId,type\nacct-1,Call\n");
    expect(activities).toEqual([]);
    expect(errors).toEqual([{ row: 0, reason: expect.stringContaining("timestamp") }]);
  });

  it("reports a whole-file error for an empty file", () => {
    const { errors } = parseCsvActivities("");
    expect(errors).toEqual([{ row: 0, reason: "file is empty" }]);
  });

  it("skips a row missing accountId and reports why, without failing the rest", () => {
    const csv = `${HEADER}\n,Call,2026-08-21,text,,\nacct-2,Call,2026-08-21,text,,\n`;
    const { activities, errors } = parseCsvActivities(csv);
    expect(activities).toHaveLength(1);
    expect(activities[0]?.accountId).toBe("acct-2");
    expect(errors).toEqual([{ row: 1, reason: "missing accountId" }]);
  });

  it("skips a row missing type and reports why", () => {
    const csv = `${HEADER}\nacct-1,,2026-08-21,text,,\n`;
    const { activities, errors } = parseCsvActivities(csv);
    expect(activities).toEqual([]);
    expect(errors).toEqual([{ row: 1, reason: "missing type" }]);
  });

  it("skips a row with the wrong column count and reports why", () => {
    const csv = `${HEADER}\nacct-1,Call,2026-08-21\n`;
    const { activities, errors } = parseCsvActivities(csv);
    expect(activities).toEqual([]);
    expect(errors).toEqual([{ row: 1, reason: "expected 6 columns, got 3" }]);
  });
});
