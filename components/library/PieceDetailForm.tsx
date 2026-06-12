"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PracticeCoachPanel } from "@/components/library/PracticeCoachPanel";
import type { PracticeCoachResponseParsed } from "@/lib/ai/schemas";
import { formatRelativeTime } from "@/lib/format/relative-time";
import { formatGoalsTextForDisplay } from "@/lib/queries/practice-goals-display";
import type { getPieceForUser } from "@/lib/queries/pieces";
import { instrumentValues, type PieceFormInput } from "@/lib/validations/piece";
import { deletePiece, setPieceTags, updatePiece } from "@/server/actions/pieces";
import { upsertNote } from "@/server/actions/notes";
import { upsertPracticeGoals } from "@/server/actions/practice-goals";
import { createPracticeLog } from "@/server/actions/practice-logs";
import { upsertRating, upsertVibeScore } from "@/server/actions/ratings";
import { createCustomTag } from "@/server/actions/tags";

type Data = NonNullable<Awaited<ReturnType<typeof getPieceForUser>>>;
type TagRow = Data["tags"][number];
type Instrument = PieceFormInput["instrument"];

export function PieceDetailForm({
  data,
  allTags,
  profileUsername,
}: {
  data: Data;
  allTags: { id: string; displayName: string; isPreset: boolean }[];
  profileUsername: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const p = data.piece;
  const practiceLogs = data.practiceLogs;
  const [title, setTitle] = useState(p.title);
  const [composer, setComposer] = useState(p.composer ?? "");
  const [instrument, setInstrument] = useState<Instrument>(p.instrument);
  const [difficulty, setDifficulty] = useState(p.difficulty);
  const [externalUrl, setExternalUrl] = useState(p.externalUrl ?? "");
  const [noteBody, setNoteBody] = useState(data.note?.body ?? "");
  const [notePublic, setNotePublic] = useState(data.note?.isPublic ?? false);
  const [isPublic, setIsPublic] = useState(p.isPublic);
  const [repertoireStatus, setRepertoireStatus] = useState<
    "learning" | "mastered" | "saved"
  >(p.repertoireStatus);
  const [overall, setOverall] = useState(data.rating?.overall ?? 3);
  const [difficultyUser, setDifficultyUser] = useState(data.rating?.difficultyUser ?? 3);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(
    () => new Set(data.tags.map((t) => t.id))
  );
  const [newTag, setNewTag] = useState("");
  const [goalsText, setGoalsText] = useState(() => formatGoalsTextForDisplay(data.practiceGoal));
  const [goalsSaved, setGoalsSaved] = useState(data.goalsConfigured);
  const [passageNotes, setPassageNotes] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioInputKey, setAudioInputKey] = useState(0);
  const [coachResult, setCoachResult] = useState<{
    coach: PracticeCoachResponseParsed | null;
    coachError: string | null;
    coachMessage: string | null;
  } | null>(null);
  const [loggingSession, startLogTransition] = useTransition();
  const [savingGoals, startGoalsTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const vibeScoreMap = new Map(data.vibeScores.map((v) => [v.tagId, v.fitScore]));

  function toggleTag(id: string) {
    setSelectedTagIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function saveShelfSettings(nextPublic: boolean, nextStatus?: typeof repertoireStatus) {
    setError(null);
    const status = nextStatus ?? repertoireStatus;
    const publicFlag = nextPublic;
    startTransition(async () => {
      const res = await updatePiece({
        id: p.id,
        repertoireStatus: status,
        isPublic: publicFlag,
      });
      if (res && "error" in res && res.error) {
        setError("Could not update shelf");
        return;
      }
      setIsPublic(publicFlag);
      if (nextStatus) setRepertoireStatus(status);
      router.refresh();
      setMessage(
        publicFlag ? "Added to your public shelf." : "Removed from your public shelf."
      );
      setTimeout(() => setMessage(null), 3000);
    });
  }

  async function saveMetadata() {
    setError(null);
    startTransition(async () => {
      await updatePiece({
        id: p.id,
        title,
        composer: composer || null,
        instrument,
        difficulty,
        externalUrl: p.sourceType === "external_link" ? externalUrl || null : undefined,
        repertoireStatus,
        isPublic,
      });
      await setPieceTags({ pieceId: p.id, tagIds: [...selectedTagIds] });
      await upsertRating({
        pieceId: p.id,
        overall,
        difficultyUser,
      });
      await upsertNote({ pieceId: p.id, body: noteBody, isPublic: notePublic });
      router.refresh();
      setMessage("Saved.");
      setTimeout(() => setMessage(null), 2000);
    });
  }

  async function savePracticeGoals() {
    setError(null);
    startGoalsTransition(async () => {
      const res = await upsertPracticeGoals({
        pieceId: p.id,
        goalsText,
      });
      if (res && "error" in res && res.error) {
        setError(typeof res.error === "string" ? res.error : "Could not save goals");
        return;
      }
      setGoalsSaved(true);
      router.refresh();
      setMessage("Practice goals saved.");
      setTimeout(() => setMessage(null), 2500);
    });
  }

  async function logPracticeSession() {
    setError(null);
    setCoachResult(null);
    if (!audioFile) {
      setError("Upload a 15–30 second clip of your playing.");
      return;
    }
    startLogTransition(async () => {
      const formData = new FormData();
      formData.set("pieceId", p.id);
      formData.set("passageNotes", passageNotes);
      formData.set("audio", audioFile);

      const res = await createPracticeLog(formData);
      if (res && "error" in res && res.error) {
        setError(typeof res.error === "string" ? res.error : "Could not save session");
        return;
      }
      if (res && "ok" in res && res.ok) {
        setPassageNotes("");
        setAudioFile(null);
        setAudioInputKey((k) => k + 1);
        setCoachResult({
          coach: res.coachResponse,
          coachError: null,
          coachMessage: res.coachResponse ? null : res.coachMessage,
        });
        router.refresh();
        setMessage(res.coachResponse ? "Coach feedback ready." : "Practice session logged.");
        setTimeout(() => setMessage(null), 3000);
      }
    });
  }

  async function addCustomTag() {
    if (!newTag.trim()) return;
    setError(null);
    const res = await createCustomTag({ displayName: newTag.trim() });
    setNewTag("");
    if (res && "error" in res && res.error) {
      setError("Could not create tag");
      return;
    }
    if (res && "id" in res && res.id) {
      setSelectedTagIds((s) => new Set([...s, res.id as string]));
      router.refresh();
    }
  }

  async function removePiece() {
    if (!confirm("Delete this piece from your library?")) return;
    startTransition(async () => {
      await deletePiece(p.id);
      router.push("/library");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        {p.storageKey ? (
          <Button asChild variant="secondary">
            <Link href={`/library/${p.id}/view`}>Open viewer</Link>
          </Button>
        ) : null}
        {p.externalUrl ? (
          <Button variant="outline" asChild>
            <a href={p.externalUrl} target="_blank" rel="noreferrer">
              Open external link
            </a>
          </Button>
        ) : null}
        <Button variant="destructive" type="button" onClick={removePiece} disabled={pending}>
          Delete
        </Button>
      </div>

      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="rounded-lg border border-sheet-border bg-white p-6 shadow-sm">
        <h2 className="font-display mb-2 text-lg font-normal text-sheet-ink">Public shelf</h2>
        <p className="mb-4 text-sm text-sheet-muted">
          Pieces on your public shelf appear on your profile at{" "}
          {profileUsername ? (
            <a href={`/u/${profileUsername}`} className="font-medium text-sheet-accent underline">
              /u/{profileUsername}
            </a>
          ) : (
            <Link href="/settings" className="font-medium text-sheet-accent underline">
              /u/your-username
            </Link>
          )}
          . Changes here save immediately.
        </p>
        {!profileUsername ? (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Set a username in{" "}
            <Link href="/settings" className="font-medium underline">
              Settings
            </Link>{" "}
            before visitors can view your shelf.
          </p>
        ) : null}
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-sheet-border bg-sheet-cream/50 px-4 py-3">
          <input
            type="checkbox"
            checked={isPublic}
            disabled={pending}
            onChange={(e) => saveShelfSettings(e.target.checked)}
            className="h-4 w-4 rounded border-sheet-border"
          />
          <span className="text-sm font-medium text-sheet-ink">Add to public shelf</span>
        </label>
        {isPublic ? (
          <div className="mt-4 space-y-2">
            <Label htmlFor="repertoireStatus">Show in section</Label>
            <select
              id="repertoireStatus"
              disabled={pending}
              className="flex h-9 w-full rounded-md border border-sheet-border bg-white px-3 text-sm text-sheet-ink"
              value={repertoireStatus}
              onChange={(e) => {
                const status = e.target.value as "learning" | "mastered" | "saved";
                saveShelfSettings(true, status);
              }}
            >
              <option value="learning">Currently learning</option>
              <option value="mastered">Mastered</option>
              <option value="saved">Saved for later</option>
            </select>
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-sheet-border bg-white p-6 shadow-sm">
        <h2 className="font-display mb-4 text-lg font-normal text-sheet-ink">Details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="composer">Composer</Label>
            <Input id="composer" value={composer} onChange={(e) => setComposer(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instrument">Instrument</Label>
            <select
              id="instrument"
              className="flex h-9 w-full rounded-md border border-sheet-border bg-white px-3 text-sm text-sheet-ink"
              value={instrument}
              onChange={(e) => setInstrument(e.target.value as Instrument)}
            >
              {instrumentValues.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="difficulty">Library difficulty (1–5)</Label>
            <Input
              id="difficulty"
              type="number"
              min={1}
              max={5}
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
            />
          </div>
          {p.sourceType === "external_link" ? (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="externalUrl">URL</Label>
              <Input
                id="externalUrl"
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-sheet-border bg-white p-6 shadow-sm">
        <h2 className="font-display mb-4 text-lg font-normal text-sheet-ink">Vibe tags</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          {allTags.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggleTag(t.id)}
              className={`rounded-full border px-3 py-1 text-sm ${
                selectedTagIds.has(t.id)
                  ? "border-black bg-black text-sheet-cream"
                  : "border-sheet-border bg-sheet-cream text-sheet-ink"
              }`}
            >
              {t.displayName}
              {t.isPreset ? "" : " · custom"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="New custom tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
          />
          <Button type="button" variant="outline" onClick={addCustomTag}>
            Add tag
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-sheet-border bg-white p-6 shadow-sm">
        <h2 className="font-display mb-4 text-lg font-normal text-sheet-ink">Ratings</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Overall (1–5)</Label>
            <Input
              type="number"
              min={1}
              max={5}
              value={overall}
              onChange={(e) => setOverall(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Difficulty for you (1–5)</Label>
            <Input
              type="number"
              min={1}
              max={5}
              value={difficultyUser}
              onChange={(e) => setDifficultyUser(Number(e.target.value))}
            />
          </div>
        </div>
        <p className="mt-4 text-sm text-sheet-muted">
          For each vibe tag on this piece, how well does it fit? (1–5)
        </p>
        <div className="mt-4 space-y-3">
          {data.tags.map((t: TagRow) => (
            <div key={t.id} className="flex items-center gap-4">
              <span className="w-40 shrink-0 text-sm text-sheet-ink">{t.displayName}</span>
              <Input
                type="number"
                min={1}
                max={5}
                className="w-24"
                defaultValue={vibeScoreMap.get(t.id) ?? 3}
                onBlur={async (e) => {
                  const v = Number(e.target.value);
                  if (v >= 1 && v <= 5) {
                    await upsertVibeScore({ pieceId: p.id, tagId: t.id, fitScore: v });
                    router.refresh();
                  }
                }}
              />
            </div>
          ))}
          {data.tags.length === 0 ? (
            <p className="text-sm text-sheet-muted">Add vibe tags above to score fit per vibe.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-sheet-border bg-white p-6 shadow-sm">
        <h2 className="font-display mb-1 text-lg font-normal text-sheet-ink">Practice goals</h2>
        <p className="mb-4 text-sm text-sheet-muted">
          Describe what you&apos;re aiming for (tempo, dynamics, feeling, etc.) and your coach will
          recommend next steps to get there!
        </p>
        <div className="space-y-2">
          <Textarea
            id="goalsText"
            rows={5}
            placeholder={`e.g.\n• 72 bpm, steady — bars 12–24 hands together\n• Soft opening, build to mf by bar 16\n• Warm and unhurried, not sentimental`}
            value={goalsText}
            onChange={(e) => setGoalsText(e.target.value)}
          />
        </div>
        <Button
          type="button"
          className="mt-4"
          variant="secondary"
          onClick={savePracticeGoals}
          disabled={savingGoals || !goalsText.trim()}
        >
          {savingGoals ? "Saving…" : "Save practice goals"}
        </Button>
      </section>

      <section className="rounded-lg border border-sheet-border bg-white p-6 shadow-sm">
        <h2 className="font-display mb-1 text-lg font-normal text-sheet-ink">Practice session</h2>
        <p className="mb-2 text-sm text-sheet-muted">
          Upload a 15–30 second clip of your playing (same passage each time works best). Coach feedback
          unlocks after 2 clips are uploaded.
        </p>
        <p className="mb-4 text-sm font-medium text-sheet-ink">
          Sessions: {data.clippedSessionCount}/2
          {!goalsSaved ? (
            <span className="ml-2 font-normal text-amber-700">· Save practice goals first</span>
          ) : data.clippedSessionCount < 2 ? (
            <span className="ml-2 font-normal text-sheet-muted">· One more clip to unlock coach</span>
          ) : (
            <span className="ml-2 font-normal text-green-700">· Coach unlocked</span>
          )}
        </p>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passageNotes">What did you record?</Label>
            <Input
              id="passageNotes"
              placeholder="e.g. Bars 12–24 at target tempo"
              value={passageNotes}
              onChange={(e) => setPassageNotes(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audioClip">Audio clip (required)</Label>
            <Input
              key={audioInputKey}
              id="audioClip"
              type="file"
              accept="audio/mpeg,audio/wav,audio/webm,audio/ogg,audio/mp4,audio/x-m4a"
              onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
            />
            {audioFile ? (
              <p className="text-xs text-sheet-muted">
                Selected: {audioFile.name} ({Math.round(audioFile.size / 1024)} KB)
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={logPracticeSession}
            disabled={loggingSession || !audioFile || !goalsSaved}
          >
            {loggingSession ? "Analyzing…" : "Log session"}
          </Button>
        </div>
        {coachResult ? (
          <div className="mt-5">
            <PracticeCoachPanel
              coach={coachResult.coach}
              coachError={coachResult.coachError}
              coachMessage={coachResult.coachMessage}
            />
          </div>
        ) : null}
        {practiceLogs.length > 0 ? (
          <div className="mt-6 border-t border-sheet-border pt-5">
            <h3 className="mb-3 text-sm font-medium text-sheet-ink">Recent sessions</h3>
            <ul className="space-y-3">
              {practiceLogs.map((log) => (
                <li key={log.id} className="rounded-md border border-sheet-border bg-sheet-cream/40 px-4 py-3">
                  <p className="text-xs text-sheet-muted">{formatRelativeTime(new Date(log.createdAt))}</p>
                  {log.passageNotes ? (
                    <p className="mt-1 text-sm font-medium text-sheet-ink">{log.passageNotes}</p>
                  ) : null}
                  {log.hasAudio ? (
                    <audio controls className="mt-2 w-full" src={`/api/practice-logs/${log.id}/audio`} />
                  ) : null}
                  {log.coachResponse ? (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-medium text-sheet-accent">
                        View coach plan
                      </summary>
                      <div className="mt-3">
                        <PracticeCoachPanel coach={log.coachResponse} />
                      </div>
                    </details>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-sheet-border bg-white p-6 shadow-sm">
        <h2 className="font-display mb-4 text-lg font-normal text-sheet-ink">Notes</h2>
        <Textarea
          rows={6}
          placeholder="Technique reminders, edition info, when you learned it…"
          value={noteBody}
          onChange={(e) => setNoteBody(e.target.value)}
        />
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-sheet-ink">
          <input
            type="checkbox"
            checked={notePublic}
            onChange={(e) => setNotePublic(e.target.checked)}
            disabled={!isPublic}
            className="h-4 w-4 rounded border-sheet-border"
          />
          Show this note on my public shelf
        </label>
        {!isPublic ? (
          <p className="mt-1 text-xs text-sheet-muted">Add this piece to your public shelf to share notes.</p>
        ) : null}
      </section>

      <Button type="button" onClick={saveMetadata} disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
