"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

type Props = { fileUrl: string; title: string };

export function PdfViewerInner({ fileUrl, title }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.1);
  const [autoScroll, setAutoScroll] = useState(false);
  const [speed, setSpeed] = useState(30);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const onDocumentLoad = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
  }, []);

  useEffect(() => {
    if (!autoScroll || !containerRef.current) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }
    const el = containerRef.current;
    let last = performance.now();
    const step = (t: number) => {
      const dt = t - last;
      last = t;
      el.scrollTop += (speed * dt) / 1000;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
        setAutoScroll(false);
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [autoScroll, speed]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-sheet-border bg-white p-3 shadow-sm">
        <span className="text-sm font-medium text-sheet-ink">{title}</span>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}>
            −
          </Button>
          <span className="text-xs text-sheet-muted">{Math.round(scale * 100)}%</span>
          <Button type="button" variant="outline" size="sm" onClick={() => setScale((s) => Math.min(3, s + 0.1))}>
            +
          </Button>
        </div>
        <div className="flex items-center gap-2 border-l border-sheet-border pl-3">
          <Label className="text-xs text-sheet-muted">Auto-scroll</Label>
          <Button type="button" variant={autoScroll ? "default" : "outline"} size="sm" onClick={() => setAutoScroll((a) => !a)}>
            {autoScroll ? "On" : "Off"}
          </Button>
          <input
            type="range"
            min={10}
            max={120}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-28"
            aria-label="Scroll speed"
          />
        </div>
      </div>
      <div
        ref={containerRef}
        className="max-h-[calc(100vh-12rem)] overflow-auto rounded-lg border border-sheet-border bg-sheet-cream p-4 touch-pan-y"
        onWheel={() => setAutoScroll(false)}
      >
        <Document file={fileUrl} onLoadSuccess={onDocumentLoad} loading={<p className="p-8 text-sheet-muted">Loading PDF…</p>}>
          {Array.from(new Array(numPages), (_, i) => (
            <Page
              key={`p_${i + 1}`}
              pageNumber={i + 1}
              scale={scale}
              className="mb-4 shadow-md"
              renderTextLayer
              renderAnnotationLayer
            />
          ))}
        </Document>
      </div>
    </div>
  );
}
