function isValidDate(d: Date): boolean {
  return !Number.isNaN(d.getTime());
}

/**
 * Parses the timestamp formats seen in the demo corpus and plausible in a
 * real CSV export: epoch milliseconds, `MM/DD/YYYY[ HH:mm]` (US),
 * `DD-MM-YYYY[ HH:mm]` (EU — the slash/dash split is the only signal
 * available to tell the two apart, so that's the assumption this makes), ISO
 * 8601, and date-only `YYYY-MM-DD`. Returns null for empty or genuinely
 * unparseable input rather than throwing — an activity with no date is still
 * real and still worth showing, just undated.
 */
export function parseTimestamp(raw: string): Date | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;

  if (/^\d+$/.test(trimmed)) {
    const d = new Date(Number(trimmed));
    return isValidDate(d) ? d : null;
  }

  const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (us) {
    const [, mo, day, y, h, mi] = us;
    const d = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(day), Number(h ?? 0), Number(mi ?? 0)));
    return isValidDate(d) ? d : null;
  }

  const eu = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (eu) {
    const [, day, mo, y, h, mi] = eu;
    const d = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(day), Number(h ?? 0), Number(mi ?? 0)));
    return isValidDate(d) ? d : null;
  }

  const iso = new Date(trimmed);
  return isValidDate(iso) ? iso : null;
}
