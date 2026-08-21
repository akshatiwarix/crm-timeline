import type { ActivityType } from "@/lib/types";

/**
 * Exact matches for the messy casings/phrasings the demo corpus and real CRM
 * exports tend to use. Checked before the keyword fallback so known variants
 * never fall through to a guess.
 */
const EXACT_MAP: Record<string, ActivityType> = {
  call: "call",
  "phone call": "call",
  email: "email",
  "e-mail": "email",
  "sent email": "email",
  meeting: "meeting",
  mtg: "meeting",
  note: "note",
  notes: "note",
  stage_change: "stage_change",
  "stage change": "stage_change",
  "stage changed": "stage_change",
  "stage-change": "stage_change",
};

/**
 * Canonicalizes a messy activity-type string. Falls back to keyword sniffing
 * for uploads that don't match a known exact phrasing (e.g. "Cold Call" or
 * "Zoom Meeting"). Returns null when nothing plausible matches — the caller
 * treats that as a row to skip and report, not a crash.
 */
export function normalizeActivityType(raw: string): ActivityType | null {
  const key = raw.trim().toLowerCase();
  if (key in EXACT_MAP) return EXACT_MAP[key]!;
  if (key.includes("call")) return "call";
  if (key.includes("mail")) return "email";
  if (key.includes("meet") || key.includes("mtg")) return "meeting";
  if (key.includes("stage")) return "stage_change";
  if (key.includes("note")) return "note";
  return null;
}
