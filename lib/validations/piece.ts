import { z } from "zod";

export const instrumentValues = [
  "piano",
  "guitar",
  "violin",
  "viola",
  "cello",
  "voice",
  "flute",
  "clarinet",
  "saxophone",
  "trumpet",
  "trombone",
  "harp",
  "drums",
  "bass",
  "ukulele",
  "other",
] as const;

export const pieceFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  composer: z.string().max(500).optional().nullable(),
  instrument: z.enum(instrumentValues),
  difficulty: z.coerce.number().int().min(1).max(5),
  sourceType: z.enum(["upload", "external_link"]),
  externalUrl: z.string().url().optional().nullable(),
});

export type PieceFormInput = z.infer<typeof pieceFormSchema>;
