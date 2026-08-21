import type { RawActivity } from "@/lib/types";

/**
 * Minimal RFC4180-style tokenizer: quoted fields, commas and newlines inside
 * quotes, doubled `""` as an escaped literal quote. Does not attempt CRLF
 * normalization inside quoted fields or BOM stripping — good enough for a
 * hand-exported CRM activity CSV, not a general-purpose CSV library.
 */
export function tokenizeCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const n = text.length;

  while (i < n) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      i++;
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const REQUIRED_HEADERS = ["accountId", "type", "timestamp", "text"] as const;

export type CsvRowError = { row: number; reason: string };
export type CsvParseResult = { activities: RawActivity[]; errors: CsvRowError[] };

/**
 * Parses a CSV upload into RawActivity rows plus a report of what was
 * skipped and why. `row: 0` marks a whole-file problem (empty file, or the
 * header is missing a required column — there's no per-row fix for that).
 * Every other error is a specific data row, 1-indexed against the rows
 * after the header, skipped individually rather than failing the upload.
 */
export function parseCsvActivities(text: string): CsvParseResult {
  const rows = tokenizeCsv(text);
  if (rows.length === 0) {
    return { activities: [], errors: [{ row: 0, reason: "file is empty" }] };
  }

  const header = rows[0]!.map((h) => h.trim());
  const headerLower = header.map((h) => h.toLowerCase());
  const indexOf = (name: string) => headerLower.indexOf(name.toLowerCase());

  const missing = REQUIRED_HEADERS.filter((h) => indexOf(h) === -1);
  if (missing.length > 0) {
    return {
      activities: [],
      errors: [{ row: 0, reason: `missing required column(s): ${missing.join(", ")}` }],
    };
  }

  const idx = {
    accountId: indexOf("accountId"),
    type: indexOf("type"),
    timestamp: indexOf("timestamp"),
    text: indexOf("text"),
    fromStage: indexOf("fromStage"),
    toStage: indexOf("toStage"),
  };

  const activities: RawActivity[] = [];
  const errors: CsvRowError[] = [];

  rows.slice(1).forEach((fields, i) => {
    const rowNumber = i + 1;
    if (fields.length !== header.length) {
      errors.push({ row: rowNumber, reason: `expected ${header.length} columns, got ${fields.length}` });
      return;
    }

    const accountId = fields[idx.accountId]?.trim() ?? "";
    const type = fields[idx.type]?.trim() ?? "";
    if (!accountId) {
      errors.push({ row: rowNumber, reason: "missing accountId" });
      return;
    }
    if (!type) {
      errors.push({ row: rowNumber, reason: "missing type" });
      return;
    }

    const fromStage = idx.fromStage !== -1 ? fields[idx.fromStage]?.trim() : undefined;
    const toStage = idx.toStage !== -1 ? fields[idx.toStage]?.trim() : undefined;

    activities.push({
      accountId,
      type,
      timestamp: fields[idx.timestamp] ?? "",
      text: fields[idx.text] ?? "",
      ...(fromStage ? { fromStage } : {}),
      ...(toStage ? { toStage } : {}),
    });
  });

  return { activities, errors };
}
