import { instrumentValues } from "@/lib/validations/piece";
import { formatInstrumentLabel } from "@/lib/utils/instrument";

const EMOJI: Record<(typeof instrumentValues)[number], string> = {
  piano: "🎹",
  guitar: "🎸",
  violin: "🎻",
  viola: "🎻",
  cello: "🎻",
  voice: "🎤",
  flute: "🪈",
  clarinet: "🎷",
  saxophone: "🎷",
  trumpet: "🎺",
  trombone: "🎺",
  harp: "🪕",
  drums: "🥁",
  bass: "🎸",
  ukulele: "🪕",
  other: "🎵",
};

export function instrumentEmoji(instrument: string): string {
  if (instrument in EMOJI) return EMOJI[instrument as keyof typeof EMOJI];
  return "🎵";
}

export function instrumentChipLabel(instrument: string): string {
  return `${instrumentEmoji(instrument)} ${formatInstrumentLabel(instrument)}`;
}
