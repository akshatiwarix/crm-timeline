import type { NormalizedActivity, RawActivity } from "@/lib/types";
import { normalizeActivityType } from "./type";
import { parseTimestamp } from "./timestamp";
import { normalizeText } from "./text";

export type NormalizeResult =
  | { ok: true; activity: NormalizedActivity }
  | { ok: false; reason: string };

/**
 * Normalizes one raw activity. Only an unrecognized activity type is a
 * failure — an unparseable timestamp degrades to `null` (undated) rather
 * than rejecting the row, since the activity itself is still real.
 */
export function normalizeActivity(raw: RawActivity, id: string): NormalizeResult {
  const type = normalizeActivityType(raw.type);
  if (!type) {
    return { ok: false, reason: `unrecognized activity type: "${raw.type}"` };
  }

  const activity: NormalizedActivity = {
    id,
    accountId: raw.accountId,
    type,
    timestamp: parseTimestamp(raw.timestamp),
    text: normalizeText(raw.text),
    fromStage: raw.fromStage ? normalizeText(raw.fromStage) : undefined,
    toStage: raw.toStage ? normalizeText(raw.toStage) : undefined,
  };
  return { ok: true, activity };
}
