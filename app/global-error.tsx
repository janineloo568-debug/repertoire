"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ margin: "4rem auto", maxWidth: 28, padding: "0 1rem", textAlign: "center", fontFamily: "system-ui" }}>
          <h1>Something went wrong</h1>
          <p style={{ color: "#666" }}>{error.message || "An unexpected error occurred."}</p>
          <button type="button" onClick={reset} style={{ marginTop: "1.5rem" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
