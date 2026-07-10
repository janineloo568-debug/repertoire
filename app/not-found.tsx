import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-2xl text-sheet-ink">Page not found</h1>
      <p className="mt-2 text-sm text-sheet-muted">That page doesn&apos;t exist or was moved.</p>
      <Link href="/" className="mt-6 inline-block text-sm font-medium text-sheet-accent underline">
        Back home
      </Link>
    </div>
  );
}
