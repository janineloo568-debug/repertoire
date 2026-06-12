"use client";

import dynamic from "next/dynamic";

const PdfViewerInner = dynamic(() => import("./PdfViewerInner").then((m) => m.PdfViewerInner), {
  ssr: false,
  loading: () => <div className="p-8 text-sheet-muted">Loading viewer…</div>,
});

export function ClientPdfShell(props: { fileUrl: string; title: string }) {
  return <PdfViewerInner {...props} />;
}
