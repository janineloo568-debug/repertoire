"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { instrumentValues } from "@/lib/validations/piece";

type TagOption = { id: string; displayName: string };

export function PieceFilters({ tags }: { tags: TagOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const qFromUrl = searchParams.get("q") ?? "";
  const [qInput, setQInput] = useState(qFromUrl);

  useEffect(() => {
    setQInput(qFromUrl);
  }, [qFromUrl]);

  const pushParams = useCallback(
    (next: Record<string, string | null>) => {
      const p = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v === null || v === "") p.delete(k);
        else p.set(k, v);
      }
      startTransition(() => {
        router.push(`/library?${p.toString()}`);
      });
    },
    [router, searchParams]
  );

  const selectedTags = new Set(
    (searchParams.get("tags") ?? "")
      .split(",")
      .filter(Boolean)
  );
  const instrument = searchParams.get("instrument") ?? "all";
  const minD = searchParams.get("min") ?? "";
  const maxD = searchParams.get("max") ?? "";

  function applySearch() {
    pushParams({ q: qInput || null });
  }

  function toggleTag(id: string) {
    const next = new Set(selectedTags);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    const s = [...next].join(",");
    pushParams({ tags: s || null });
  }

  return (
    <div className="mb-6 space-y-4 rounded-lg border border-sheet-border bg-white p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="q">Search</Label>
          <div className="flex gap-2">
            <Input
              id="q"
              name="q"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              placeholder="Title, composer…"
            />
            <Button type="button" variant="secondary" onClick={applySearch}>
              Search
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="instrument">Instrument</Label>
          <select
            id="instrument"
            className="flex h-9 w-full rounded-md border border-sheet-border bg-white px-3 text-sm text-sheet-ink shadow-sm"
            value={instrument}
            onChange={(e) =>
              pushParams({ instrument: e.target.value === "all" ? null : e.target.value })
            }
          >
            <option value="all">All</option>
            {instrumentValues.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Difficulty</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              max={5}
              placeholder="min"
              className="w-20"
              defaultValue={minD}
              key={`min-${minD}`}
              onBlur={(e) => pushParams({ min: e.target.value || null })}
            />
            <span className="py-2 text-sheet-muted">–</span>
            <Input
              type="number"
              min={1}
              max={5}
              placeholder="max"
              className="w-20"
              defaultValue={maxD}
              key={`max-${maxD}`}
              onBlur={(e) => pushParams({ max: e.target.value || null })}
            />
          </div>
        </div>
        <div className="flex items-end md:col-span-2 lg:col-span-1">
          <Button type="button" variant="outline" size="sm" onClick={() => router.push("/library")} disabled={pending}>
            Clear filters
          </Button>
        </div>
      </div>
      <div>
        <Label className="mb-2 block">Vibes (match all selected)</Label>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggleTag(t.id)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                selectedTags.has(t.id)
                  ? "border-black bg-black text-sheet-cream"
                  : "border-sheet-border bg-sheet-cream text-sheet-ink hover:bg-[#ebe6dc]"
              }`}
            >
              {t.displayName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
