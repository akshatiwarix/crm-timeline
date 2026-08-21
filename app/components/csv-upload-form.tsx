"use client";

import { useState } from "react";
import { parseCsvActivities } from "@/lib/csv";
import { runPipeline, type PipelineResult } from "@/lib/pipeline";
import { Timeline } from "./timeline";

const EXAMPLE_URL = "/example-activities.csv";

type SkippedRow = { row: number; reason: string; source: "csv" | "normalize" };

export function CsvUploadForm() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<SkippedRow[]>([]);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  function process(text: string, name: string) {
    setFileName(name);
    setLoadError(null);

    const { activities, rowNumbers, errors: csvErrors } = parseCsvActivities(text);
    if (activities.length === 0 && csvErrors.some((e) => e.row === 0)) {
      setSkipped(csvErrors.map((e) => ({ ...e, source: "csv" as const })));
      setResult(null);
      return;
    }

    const pipelineResult = runPipeline(activities);
    const combined: SkippedRow[] = [
      ...csvErrors.map((e) => ({ ...e, source: "csv" as const })),
      // pipelineResult.errors are indexed against `activities`, which already
      // has skipped rows removed — remap back through rowNumbers so a
      // normalize failure reports the CSV line it actually came from.
      ...pipelineResult.errors.map((e) => ({
        row: rowNumbers[e.row - 1] ?? e.row,
        reason: e.reason,
        source: "normalize" as const,
      })),
    ];
    combined.sort((a, b) => a.row - b.row);
    setSkipped(combined);
    setResult(pipelineResult);
  }

  async function handleFile(file: File) {
    try {
      const text = await file.text();
      process(text, file.name);
    } catch {
      setLoadError("Couldn't read that file.");
    }
  }

  async function loadExample() {
    try {
      const res = await fetch(EXAMPLE_URL);
      const text = await res.text();
      process(text, "example-activities.csv");
    } catch {
      setLoadError("Couldn't load the example file.");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-full border border-line-strong px-4 py-2 text-sm font-medium text-ink hover:bg-paper-raised">
          Upload CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => void loadExample()}
          className="rounded-full border border-line-strong px-4 py-2 text-sm font-medium text-ink hover:bg-paper-raised"
        >
          Try the bundled example
        </button>
        <a href={EXAMPLE_URL} download className="text-xs text-ink-dim underline">
          download example CSV
        </a>
      </div>

      {fileName && <p className="mt-3 text-xs text-ink-dim">Loaded {fileName}</p>}
      {loadError && <p className="mt-3 text-xs text-type-stage">{loadError}</p>}

      {skipped.length > 0 && (
        <div className="mt-4 rounded-lg border border-type-stage-dim bg-type-stage-dim p-4">
          <p className="text-xs font-medium text-type-stage">
            {skipped.length} row{skipped.length === 1 ? "" : "s"} skipped
          </p>
          <ul className="mt-2 space-y-1 text-xs text-ink-dim">
            {skipped.map((e, i) => (
              <li key={i}>
                {e.row === 0 ? "file" : `row ${e.row}`}: {e.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result && (
        <div className="mt-6">
          <Timeline result={result} />
        </div>
      )}
    </div>
  );
}
