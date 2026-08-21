import { describe, expect, it } from "vitest";
import { parseTimestamp } from "./timestamp";

describe("parseTimestamp", () => {
  it("parses ISO 8601", () => {
    const d = parseTimestamp("2026-08-21T14:30:00.000Z");
    expect(d?.toISOString()).toBe("2026-08-21T14:30:00.000Z");
  });

  it("parses date-only ISO", () => {
    const d = parseTimestamp("2026-08-21");
    expect(d?.toISOString()).toBe("2026-08-21T00:00:00.000Z");
  });

  it("parses epoch milliseconds", () => {
    const d = parseTimestamp("1755781800000");
    expect(d?.getTime()).toBe(1755781800000);
  });

  it("parses US slash MM/DD/YYYY HH:mm", () => {
    const d = parseTimestamp("08/21/2026 14:30");
    expect(d?.toISOString()).toBe("2026-08-21T14:30:00.000Z");
  });

  it("parses EU dash DD-MM-YYYY HH:mm", () => {
    const d = parseTimestamp("21-08-2026 14:30");
    expect(d?.toISOString()).toBe("2026-08-21T14:30:00.000Z");
  });

  it("returns null for empty input", () => {
    expect(parseTimestamp("")).toBeNull();
    expect(parseTimestamp("   ")).toBeNull();
  });

  it("returns null for genuinely unparseable input", () => {
    expect(parseTimestamp("TBD")).toBeNull();
    expect(parseTimestamp("unknown date")).toBeNull();
  });
});
