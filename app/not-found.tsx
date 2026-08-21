import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-2">
        <h1 className="font-display italic text-3xl">Not found</h1>
        <p className="text-ink-dim">
          That page doesn&apos;t exist.{" "}
          <Link href="/" className="underline">
            Back to the account list
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
