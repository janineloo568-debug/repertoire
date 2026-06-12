import { z } from "zod";
import { instrumentValues } from "@/lib/validations/piece";

export const profileFormSchema = z.object({
  bio: z.string().max(320).optional().nullable(),
  instrumentsPlayed: z
    .array(z.enum(instrumentValues))
    .max(8)
    .optional()
    .default([]),
});
