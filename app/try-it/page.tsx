import Link from "next/link";
import { CsvUploadForm } from "@/app/components/csv-upload-form";

export default function TryItPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link href="/" className="text-xs text-ink-dim underline">
        ← all accounts
      </Link>
      <h1 className="mt-3 font-display text-3xl italic text-ink">Try it with your own data</h1>
      <p className="mt-3 max-w-xl text-sm text-ink-dim">
        Upload a CSV of activity records — columns{" "}
        <code className="font-mono text-xs">accountId,type,timestamp,text,fromStage,toStage</code>{" "}
        (the last two only matter for stage-change rows). Everything runs client-side in your
        browser, on the exact same pipeline as the demo accounts. Nothing is uploaded to a server
        or saved anywhere.
      </p>
      <div className="mt-8">
        <CsvUploadForm />
      </div>
    </main>
  );
}
