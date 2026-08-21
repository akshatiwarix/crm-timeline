/**
 * The corpus generator.
 *
 * Plants a fixed set of demo accounts and a messy activity stream for each —
 * inconsistent type casing, inconsistent timestamp formats, one genuinely
 * unparseable timestamp, one deliberate near-duplicate pair, one deliberate
 * 45-day silence. The pipeline's tests assert it finds exactly what's
 * planted here, so the plant and the find can't quietly drift apart.
 *
 * Runs once via `npm run corpus`; the output is committed and the app
 * imports it directly. The app never generates at runtime.
 *
 * Everything is synthetic. Every email domain ends in `.example`.
 */

import type { Account, RawActivity } from "@/lib/types";

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

/** mulberry32 — seeded, tiny, identical across platforms. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(r: () => number, arr: readonly T[]): T {
  const v = arr[Math.floor(r() * arr.length)];
  if (v === undefined) throw new Error("pick from empty array");
  return v;
}

function int(r: () => number, min: number, max: number): number {
  return min + Math.floor(r() * (max - min + 1));
}

/** Anchor "now" so the corpus is reproducible regardless of when it's regenerated. */
const ANCHOR = Date.UTC(2026, 7, 21); // 2026-08-21, UTC
const DAY_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Messiness pools
// ---------------------------------------------------------------------------

const TYPE_CASINGS = {
  call: ["call", "Call", "CALL", "Phone Call", "phone call"],
  email: ["email", "Email", "EMAIL", "e-mail", "Sent Email"],
  meeting: ["meeting", "Meeting", "MEETING", "Mtg", "Meeting "],
  note: ["note", "Note", "NOTE", "Notes", "note "],
  stage_change: ["stage_change", "Stage Change", "STAGE_CHANGE", "Stage changed", "stage-change"],
} as const;

type CanonicalType = keyof typeof TYPE_CASINGS;

function formatTimestamp(r: () => number, date: Date): string {
  const variant = int(r, 0, 4);
  const y = date.getUTCFullYear();
  const mo = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const h = date.getUTCHours();
  const mi = date.getUTCMinutes();
  const pad = (n: number) => String(n).padStart(2, "0");
  switch (variant) {
    case 0:
      return date.toISOString();
    case 1:
      return `${pad(mo)}/${pad(d)}/${y} ${pad(h)}:${pad(mi)}`; // US slash
    case 2:
      return `${pad(d)}-${pad(mo)}-${y} ${pad(h)}:${pad(mi)}`; // EU dash
    case 3:
      return String(date.getTime()); // epoch ms as string
    default:
      return `${y}-${pad(mo)}-${pad(d)}`; // date only, no time
  }
}

const CALL_TEXT = [
  "Discovery call — walked through current workflow and pain points.",
  "Follow-up call to confirm budget and timeline.",
  "Quick check-in, no major updates.",
  "Technical call with their eng team about integration.",
  "Call went to voicemail, left a message.",
];
const EMAIL_TEXT = [
  "Sent pricing sheet and case study.",
  "Follow-up email after the demo.",
  "Replied with answers to their security questionnaire.",
  "Checking in — haven't heard back in a week.",
  "Sent contract redline for legal review.",
];
const MEETING_TEXT = [
  "Kickoff meeting with the full buying committee.",
  "Technical deep-dive with their platform team.",
  "Executive review — champion presented internally.",
  "Renewal discussion.",
  "Onboarding planning session.",
];
const NOTE_TEXT = [
  "Champion mentioned budget is approved for Q3.",
  "Competitor also in the mix — need a differentiation angle.",
  "",
  "Economic buyer is the VP, not the director.",
  "Flagged: security review is the long pole.",
];
const STAGES = ["Discovery", "Qualification", "Proposal", "Negotiation", "Closed Won"] as const;

// ---------------------------------------------------------------------------
// Demo accounts
// ---------------------------------------------------------------------------

export const ACCOUNTS: Account[] = [
  { id: "anchor-freight", name: "Anchor Freight Co.", industry: "Logistics" },
  { id: "bramble-analytics", name: "Bramble Analytics", industry: "Data & Analytics" },
  { id: "cedarline-robotics", name: "Cedarline Robotics", industry: "Robotics" },
  { id: "dune-systems", name: "Dune Systems", industry: "Cloud Infrastructure" },
  { id: "emberwood-health", name: "Emberwood Health", industry: "Healthcare" },
  { id: "fenwick-root", name: "Fenwick & Root", industry: "Legal Tech" },
  { id: "glasswing-media", name: "Glasswing Media", industry: "AdTech" },
  { id: "harlow-biotech", name: "Harlow Biotech", industry: "Biotech" },
];

export const DEMO_SEED = 20260821;

function textFor(r: () => number, type: CanonicalType): string {
  switch (type) {
    case "call":
      return pick(r, CALL_TEXT);
    case "email":
      return pick(r, EMAIL_TEXT);
    case "meeting":
      return pick(r, MEETING_TEXT);
    case "note":
      return pick(r, NOTE_TEXT);
    case "stage_change":
      return "";
  }
}

function makeActivity(
  r: () => number,
  accountId: string,
  type: CanonicalType,
  date: Date,
  overrides: Partial<RawActivity> = {},
): RawActivity {
  const stageIndex = STAGES.indexOf(overrides.toStage as (typeof STAGES)[number]);
  return {
    accountId,
    type: pick(r, TYPE_CASINGS[type]),
    timestamp: formatTimestamp(r, date),
    text: textFor(r, type),
    ...(type === "stage_change"
      ? {
          fromStage: overrides.fromStage ?? STAGES[Math.max(0, stageIndex - 1)] ?? STAGES[0],
          toStage: overrides.toStage,
        }
      : {}),
    ...overrides,
  };
}

/**
 * A baseline chronological stream for one account, before signature
 * mutations. `gap` inserts a deliberate silence of `gap.days` right before
 * the activity at index `gap.afterIndex` — used to plant the dune-systems
 * 45-day-quiet signature without a later pass having to fight the baseline
 * cadence that would otherwise fill the window back in.
 */
function baselineStream(
  r: () => number,
  accountId: string,
  startDate: Date,
  count: number,
  gap?: { afterIndex: number; days: number },
): RawActivity[] {
  const activities: RawActivity[] = [];
  let cursor = new Date(startDate);
  const types: CanonicalType[] = ["call", "email", "meeting", "note"];
  for (let i = 0; i < count; i++) {
    if (gap && i === gap.afterIndex) {
      cursor = new Date(cursor.getTime() + gap.days * DAY_MS);
    }
    cursor = new Date(cursor.getTime() + int(r, 2, 9) * DAY_MS + int(r, 0, 23) * 60 * 60 * 1000);
    const type = pick(r, types);
    activities.push(makeActivity(r, accountId, type, cursor));

    // Roughly every 5th activity, also log a stage change forward.
    if (i > 0 && i % 5 === 0) {
      const stageIdx = Math.min(Math.floor(i / 5) - 1, STAGES.length - 2);
      const from = STAGES[stageIdx] ?? STAGES[0];
      const to = STAGES[stageIdx + 1] ?? STAGES[STAGES.length - 1];
      cursor = new Date(cursor.getTime() + int(r, 0, 2) * 60 * 60 * 1000);
      activities.push(
        makeActivity(r, accountId, "stage_change", cursor, { fromStage: from, toStage: to }),
      );
    }
  }
  return activities;
}

export function generateCorpus(seed: number = DEMO_SEED): { accounts: Account[]; activities: RawActivity[] } {
  const r = rng(seed);
  const activities: RawActivity[] = [];

  for (const account of ACCOUNTS) {
    const startDate = new Date(ANCHOR - int(r, 150, 270) * DAY_MS);
    const count = int(r, 10, 18);
    const gap = account.id === "dune-systems" ? { afterIndex: Math.floor(count / 2), days: 45 } : undefined;
    const stream = baselineStream(r, account.id, startDate, count, gap);
    activities.push(...stream);
  }

  // Signature: Bramble Analytics gets a deliberate near-duplicate pair — same
  // call logged twice, three minutes apart, near-identical text (punctuation
  // differs only). This is what the dedupe heuristic must catch.
  const brambleFirstCall = new Date(ANCHOR - 40 * DAY_MS);
  const brambleSecondCall = new Date(brambleFirstCall.getTime() + 3 * 60 * 1000);
  activities.push({
    accountId: "bramble-analytics",
    type: "call",
    timestamp: brambleFirstCall.toISOString(),
    text: "Discovery call with VP Eng — walked through current workflow and pain points.",
  });
  activities.push({
    accountId: "bramble-analytics",
    type: "Phone Call",
    timestamp: brambleSecondCall.toISOString(),
    text: "Discovery call with VP Eng - walked through current workflow and pain points",
  });

  // Signature: Emberwood Health has one genuinely unparseable timestamp — the
  // normalizer must surface it as undated, not crash and not drop it.
  activities.push({
    accountId: "emberwood-health",
    type: "note",
    timestamp: "",
    text: "Backfilled from a spreadsheet import — original date unknown.",
  });

  return { accounts: ACCOUNTS, activities };
}
