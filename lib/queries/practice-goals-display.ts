export function formatGoalsTextForDisplay(goal: {
  goalsText: string;
  targetTempoBpm: number | null;
  dynamicsNotes: string;
  emotionNotes: string;
  passageNotes: string;
} | null) {
  if (!goal) return "";
  if (goal.goalsText.trim()) return goal.goalsText.trim();

  const parts: string[] = [];
  if (goal.targetTempoBpm) parts.push(`Target tempo: ${goal.targetTempoBpm} bpm`);
  if (goal.passageNotes.trim()) parts.push(`Passage: ${goal.passageNotes.trim()}`);
  if (goal.dynamicsNotes.trim()) parts.push(`Dynamics: ${goal.dynamicsNotes.trim()}`);
  if (goal.emotionNotes.trim()) parts.push(`Character: ${goal.emotionNotes.trim()}`);
  return parts.join("\n");
}

export function formatParsedGoalsSummary(parsed: {
  targetTempoBpm: number | null;
  passageNotes: string;
  dynamicsNotes: string;
  emotionNotes: string;
}) {
  const parts: string[] = [];
  if (parsed.targetTempoBpm) parts.push(`${parsed.targetTempoBpm} bpm`);
  if (parsed.passageNotes) parts.push(parsed.passageNotes);
  if (parsed.dynamicsNotes) parts.push(parsed.dynamicsNotes);
  if (parsed.emotionNotes) parts.push(parsed.emotionNotes);
  return parts.length ? parts.join(" · ") : null;
}
