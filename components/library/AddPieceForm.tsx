"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { instrumentValues } from "@/lib/validations/piece";
import { createPiece } from "@/server/actions/pieces";

export function AddPieceForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"link" | "upload">("link");
  const [title, setTitle] = useState("");
  const [composer, setComposer] = useState("");
  const [instrument, setInstrument] = useState<string>("piano");
  const [difficulty, setDifficulty] = useState(3);
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    if (mode === "link") {
      const res = await createPiece({
        title,
        composer: composer || null,
        instrument: instrument as (typeof instrumentValues)[number],
        difficulty,
        sourceType: "external_link",
        externalUrl: externalUrl || null,
        storageKey: null,
        mimeType: null,
        fileNameOriginal: null,
      });
      setPending(false);
      if (res && "error" in res && res.error) {
        setError(Object.values(res.error).flat().join(" ") || "Validation error");
        return;
      }
      if (res && "id" in res && res.id) {
        router.push(`/library/${res.id}`);
        return;
      }
      setError("Could not create piece");
      return;
    }

    if (!file) {
      setPending(false);
      setError("Choose a PDF file.");
      return;
    }

    const up = new FormData();
    up.append("file", file);
    const uploadRes = await fetch("/api/upload", { method: "POST", body: up });
    const uploadData = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) {
      setPending(false);
      setError(typeof uploadData.error === "string" ? uploadData.error : "Upload failed");
      return;
    }

    const res = await createPiece({
      title,
      composer: composer || null,
      instrument: instrument as (typeof instrumentValues)[number],
      difficulty,
      sourceType: "upload",
      externalUrl: null,
      storageKey: uploadData.storageKey,
      mimeType: uploadData.mimeType ?? "application/pdf",
      fileNameOriginal: uploadData.fileNameOriginal ?? file.name,
    });
    setPending(false);
    if (res && "error" in res && res.error) {
      setError(Object.values(res.error).flat().join(" ") || "Validation error");
      return;
    }
    if (res && "id" in res && res.id) {
      router.push(`/library/${res.id}`);
      return;
    }
    setError("Could not create piece");
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Add a piece</CardTitle>
        <CardDescription>Paste a link to sheet music or upload a PDF.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant={mode === "link" ? "default" : "outline"} size="sm" onClick={() => setMode("link")}>
              Link
            </Button>
            <Button
              type="button"
              variant={mode === "upload" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("upload")}
            >
              Upload PDF
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="composer">Composer</Label>
            <Input id="composer" value={composer} onChange={(e) => setComposer(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instrument">Instrument</Label>
              <select
                id="instrument"
                className="flex h-9 w-full rounded-md border border-sheet-border bg-white px-3 text-sm text-sheet-ink"
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
              >
                {instrumentValues.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty (1–5)</Label>
              <Input
                id="difficulty"
                type="number"
                min={1}
                max={5}
                required
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
              />
            </div>
          </div>
          {mode === "link" ? (
            <div className="space-y-2">
              <Label htmlFor="url">Sheet music URL</Label>
              <Input
                id="url"
                type="url"
                required
                placeholder="https://musescore.com/…"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="file">PDF file</Label>
              <Input
                id="file"
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save to library"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
