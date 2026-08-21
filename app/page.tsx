import Link from "next/link";
import { ACCOUNTS, ACTIVITIES } from "@/data";
import { activitySpan, runPipeline } from "@/lib/pipeline";
import { AccountCard } from "./components/account-card";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="font-display text-3xl italic text-ink">CRM Timeline</h1>
      <p className="mt-3 max-w-xl text-sm text-ink-dim">
        Real CRM activity logs are messy — inconsistent type casing, inconsistent date formats,
        double-logged calls, free-text notes with no structure. This turns that mess into a clean,
        explainable account timeline: normalized, deduplicated, grouped, and summarized. No
        external AI call — every step is a deterministic, inspectable function.
      </p>
      <Link href="/try-it" className="mt-4 inline-block text-sm font-medium text-ink underline">
        Try it with your own CSV →
      </Link>

      <h2 className="mt-10 font-display text-xl italic text-ink-dim">Demo accounts</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {ACCOUNTS.map((account) => {
          const raw = ACTIVITIES.filter((a) => a.accountId === account.id);
          const { normalized } = runPipeline(raw);
          const { count, lastTouch } = activitySpan(normalized);
          return <AccountCard key={account.id} account={account} count={count} lastTouch={lastTouch} />;
        })}
      </div>
    </main>
  );
}
