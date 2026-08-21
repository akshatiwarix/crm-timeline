/** Trims and collapses internal whitespace runs without touching punctuation or casing. */
export function normalizeText(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}
