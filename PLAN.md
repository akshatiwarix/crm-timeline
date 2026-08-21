# Day 025 — CRM Timeline — Implementation Plan

Day 025 of a 100-day building challenge. The concept is fixed by the master backlog
(`~/Desktop/100-days-portfolio-execution-plan.md`): *a visual account timeline built from messy
CRM activity records.* Portfolio angle: data transformation, visualization, account intelligence.

`crm-doctor`'s `PLAN.md` (Day 010) already reserves this territory on its behalf: "Day 025
`crm-timeline` owns activity records. No activities, no tasks, no emails." `meeting-to-crm`
(Day 021) defers the same way — rolling several transcripts into one account timeline is explicitly
listed as this repo's territory, not its own. This build stays inside that boundary and does not
reach into the neighbours':

- Day 022 `pipeline-inspector` owns stall/risk scoring.
- Day 030 `stage-validator` owns stage-vs-activity contradiction detection.
- Day 097 `crm-time-machine` owns full change-history/audit trail.

This file records the decisions settled across a three-round grilling session before any code was
written. They are decided, not open. Do not relitigate them mid-build, and do not quietly expand
the MVP — the "Out" list is as binding as the "In" list.

## Problem

Real CRM activity logs are messy: inconsistent type casing ("call" / "Call" / "Phone Call"),
inconsistent date formats, duplicate entries from double-logging or notes-plus-auto-activity, and
free-text notes with no structure. A rep or manager looking at raw activity rows can't quickly see
the shape of engagement with an account — when it was hot, when it went quiet, what actually
happened. This project turns that raw mess into a clean, explainable, chronological account
timeline.

## Intended user

A sales rep or manager reviewing an account's history, or a RevOps person auditing what a CRM
export actually contains.

## User journey

1. Land on the account list — a handful of demo accounts, each showing a one-line engagement
   summary (activity count, span, last-touch date).
2. Click into an account → see its timeline: activities grouped by month, deduped clusters
   collapsed with an expand-to-see-originals affordance, gap markers where the account went quiet
   for 14+ days.
3. Optionally: upload a CSV of your own messy activity records and see the same pipeline
   (normalize → dedupe → group → summarize) run against it, client-side, ephemeral, no
   persistence.

## Settled decisions (grilling session, 3 rounds)

1. **Pipeline scope** — normalize + dedupe + group + summarize + visualize. All four
   transformation steps, not a subset. (Round 1, Q1)
2. **Activity types** — calls, emails, meetings, notes, deal-stage changes. Five types. (Round 1,
   Q2)
3. **Input** — demo dataset by default, optional CSV upload for a visitor's own data. (Round 1,
   Q3)
4. **Account scope** — multi-account: a list/switcher, not a single hardcoded account. (Round 1,
   Q4)
5. **Stack** — inherited unchanged from Days 017–021: Next.js 16.3.1, React 19.2.8, Tailwind 4,
   TypeScript, Zod, Vitest. (Round 1, Q5)
6. **Time budget** — one full-day sprint, matching the pace of recent days. (Round 1, Q6)
7. **Deploy target** — GitHub repo `akshatiwarix/crm-timeline` (public, MIT, matches sibling
   convention), Vercel project under the same team as the rest of the portfolio. (Round 1, Q7)
8. **Summarization method** — deterministic templated one-liners (e.g. "3 calls, 2 emails, stage
   moved Discovery → Proposal over 12 days"). No external AI dependency — Days 016–021 already
   moved away from `@google/genai`, and this keeps the repo runnable by anyone with zero
   credentials. (Round 2, Q1)
9. **Dedup heuristic** — two activities merge when: same account + same activity type + timestamps
   within 5 minutes + normalized-text similarity ≥ 0.8. Merged entries render with a "×N" badge and
   expand to show the originals — the merge is always inspectable, never silently hidden. (Round 2,
   Q2)
10. **Demo data** — a seeded generator script (`data/generate.ts`) producing the messiness
    systematically (mixed casing, duplicate logs, missing/malformed timestamps, free-text notes),
    with the output committed as a corpus, mirroring `crm-doctor`/`lead-cleaner`'s
    `data/generate.ts` + `npm run corpus` convention. Not hand-authored JSON. (Round 2, Q3)
11. **Timeline layout** — vertical scrollable feed per account, grouped under month headers,
    activity-type icon + color coding, collapsible dedup clusters, gap markers for silence ≥ 14
    days. (Round 2, Q4)
12. **Upload format** — CSV only. Real CRM exports are CSV; per-row validation errors (skip bad
    rows, list which ones and why, never reject the whole file) demonstrate the pipeline's
    robustness instead of hiding it. (Round 3, Q1)

## In (explicitly)

- Seeded, reproducible demo corpus across several fictional accounts.
- Normalize: canonicalize activity-type strings, parse messy date formats, clean free text.
- Dedupe: the 5-minute + type + similarity-≥0.8 heuristic, with inspectable merge evidence.
- Group: month buckets, gap markers ≥ 14 days idle.
- Summarize: deterministic templated one-liners, no external API calls.
- Visualize: account list + per-account vertical timeline feed.
- CSV upload: client-side only, per-row validation with skip-and-report, no persistence.
- Unit tests for normalize/dedupe/group/summarize/csv-parse as pure functions.

## Out (explicitly)

- Stall/risk scoring or "what needs attention" prioritization (Day 022's territory).
- Stage-vs-activity contradiction detection (Day 030's territory).
- Full change-history/audit trail of field-level edits (Day 097's territory).
- Any external AI/LLM call.
- CRM write-back, server-side persistence, or accounts/auth.
- Editing timeline entries after generation/upload.

## System / architecture plan

Static-first Next.js App Router site. Demo accounts and their activities are a committed,
generator-produced corpus (`data/corpus/*.json`) read at build/request time — no database. The
transformation pipeline (`lib/pipeline.ts`) is pure, synchronous TypeScript with no I/O, so the
exact same code renders the committed demo corpus server-side and a visitor's uploaded CSV
client-side (`"use client"` component, `FileReader` → parse → same pipeline → render). No API
routes are needed since there's no server-side computation beyond what a React Server Component
already does by importing the pipeline directly.

```
app/
  page.tsx                 account list
  accounts/[id]/page.tsx   timeline detail (demo corpus)
  try-it/page.tsx          CSV upload → same pipeline, client-side, ephemeral
  components/
    timeline.tsx
    cluster-card.tsx
    gap-marker.tsx
    account-card.tsx
    csv-upload-form.tsx
lib/
  types.ts                 ActivityRecord, Account, ActivityType — zod schemas
  normalize/
  dedupe/
  group/
  summarize/
  csv/
  pipeline.ts               orchestrates normalize → dedupe → group → summarize
data/
  generate.ts                seeded generator
  corpus/*.json               committed output of `npm run corpus`
```

## Data model

```ts
type ActivityType = "call" | "email" | "meeting" | "note" | "stage_change";

type RawActivity = {
  accountId: string;
  type: string;          // messy: "Call", "phone call", "CALL", etc.
  timestamp: string;      // messy: multiple formats, sometimes missing
  text: string;            // free-text note/subject, sometimes empty
  fromStage?: string;      // only present on stage_change rows
  toStage?: string;
};

type NormalizedActivity = {
  id: string;
  accountId: string;
  type: ActivityType;
  timestamp: Date | null;  // null if unparseable — surfaced, not dropped
  text: string;
  fromStage?: string;
  toStage?: string;
};

type ActivityCluster = {
  primary: NormalizedActivity;
  merged: NormalizedActivity[];  // empty if no dedup happened
};

type TimelineGroup = {
  monthLabel: string;
  clusters: ActivityCluster[];
  summary: string;          // deterministic one-liner for the group
  gapBefore?: { days: number };
};
```

## Main states and workflows

- Account list: loading is instant (static demo data) — no loading state needed for the demo path.
- Timeline detail: empty state if an account somehow has zero activities (shouldn't happen with the
  generator, but the component handles it); cluster expand/collapse is local UI state.
- CSV upload: empty (no file chosen) → parsing (client-side, near-instant for reasonable file
  sizes) → results (valid rows rendered through the pipeline + a visible list of skipped rows with
  reasons) → error (file wasn't CSV / totally unparseable) states, all visible on one page.

## Implementation task order

Each step is one commit, pushed to `main` immediately.

1. Scaffold: package.json, tsconfig, eslint, postcss, vitest config, `.gitignore`, `LICENSE`,
   this `PLAN.md`. Init git, create GitHub repo, first push.
2. `lib/types.ts` — zod schemas for `RawActivity`, `NormalizedActivity`, `Account`.
3. `data/generate.ts` — seeded generator + committed corpus + `npm run corpus`.
4. `lib/normalize` — type/date/text normalization + tests.
5. `lib/dedupe` — merge heuristic + tests.
6. `lib/group` — month grouping + gap markers + tests.
7. `lib/summarize` — deterministic templated summaries + tests.
8. `lib/csv` — CSV parse + per-row validation + tests.
9. `lib/pipeline.ts` — orchestration + tests.
10. UI: layout, palette/fonts, account list, timeline detail page.
11. UI: CSV upload / "try it" page.
12. `README.md` using the reusable structure, screenshots.
13. `npm run build && npm run typecheck && npm run lint && npm test` all green.
14. Deploy to Vercel, verify live URL, mark Day 025 complete in the master tracker.

## Validation / test plan

- Vitest unit tests for every pure `lib/` module (normalize, dedupe, group, summarize, csv) —
  each with both well-formed and deliberately messy inputs.
- Generator invariant checks: every generated account has ≥ 1 activity, timestamps span a
  believable range, a known-seeded duplicate cluster exists so dedupe has something to prove it
  caught.
- Manual walkthrough: load account list, open each demo account, confirm dedup badges and gap
  markers render, upload a deliberately malformed CSV and confirm bad rows are skipped and
  reported, not silently dropped or fatal.

## Deployment plan

`vercel link` under the existing team, `vercel --prod` once the build is green. GitHub repo public
from the start (matches every sibling day).

## README plan

Use the reusable structure from the master backlog. Sections that don't apply (no real API,
no external data source) get removed rather than filled with filler, per the backlog's own
instruction.

## Definition of done

- Account list and every demo account's timeline render correctly.
- Dedup, grouping, and summarization are visibly correct against the seeded corpus (a known
  duplicate cluster collapses, a known gap shows a marker).
- CSV upload works end-to-end against a hand-crafted messy sample, with bad rows reported.
- `npm run build`, `typecheck`, `lint`, and `test` all pass.
- README complete, LICENSE present, no secrets committed.
- Live on Vercel, pushed to GitHub, Day 025 checked off in the master tracker.

## Post-MVP (not in this build)

- Real CRM OAuth import (Salesforce/HubSpot) instead of CSV upload.
- Cross-account rollup / territory-level activity view.
- Saved/shareable timelines for uploaded data (would require persistence — explicitly deferred).
