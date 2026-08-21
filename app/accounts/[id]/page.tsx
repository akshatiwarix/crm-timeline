import { notFound } from "next/navigation";
import Link from "next/link";
import { ACCOUNTS, ACTIVITIES } from "@/data";
import { runPipeline } from "@/lib/pipeline";
import { Timeline } from "@/app/components/timeline";

export function generateStaticParams() {
  return ACCOUNTS.map((account) => ({ id: account.id }));
}

export default async function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = ACCOUNTS.find((a) => a.id === id);
  if (!account) notFound();

  const raw = ACTIVITIES.filter((a) => a.accountId === id);
  const result = runPipeline(raw);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link href="/" className="text-xs text-ink-dim underline">
        ← all accounts
      </Link>
      <h1 className="mt-3 font-display text-3xl italic text-ink">{account.name}</h1>
      <p className="mt-1 text-sm text-ink-dim">{account.industry}</p>
      <div className="mt-8">
        <Timeline result={result} />
      </div>
    </main>
  );
}
