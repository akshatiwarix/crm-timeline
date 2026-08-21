import Link from "next/link";
import type { Account } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function AccountCard({
  account,
  count,
  lastTouch,
}: {
  account: Account;
  count: number;
  lastTouch: Date | null;
}) {
  return (
    <Link
      href={`/accounts/${account.id}`}
      className="block rounded-lg border border-line bg-paper-raised p-4 transition-colors hover:border-line-strong"
    >
      <h3 className="font-display text-lg italic text-ink">{account.name}</h3>
      <p className="mt-0.5 text-xs text-ink-dim">{account.industry}</p>
      <p className="mt-3 text-xs text-ink-dim">
        {count} {count === 1 ? "activity" : "activities"}
        {lastTouch && <> · last touch {formatDate(lastTouch)}</>}
      </p>
    </Link>
  );
}
