export function GapMarker({ days }: { days: number }) {
  return (
    <div className="flex items-center gap-3 py-1 text-xs text-ink-dim">
      <span className="h-px flex-1 border-t border-dashed border-line-strong" />
      <span>{days} days of silence</span>
      <span className="h-px flex-1 border-t border-dashed border-line-strong" />
    </div>
  );
}
