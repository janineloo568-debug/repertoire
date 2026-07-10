"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-2xl text-sheet-ink">Something went wrong</h1>
      <p className="mt-2 text-sm text-sheet-muted">{error.message || "An unexpected error occurred."}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-sheet-accent px-4 py-2 text-sm font-medium text-white"
      >
        Try again
      </button>
    </div>
  );
}
