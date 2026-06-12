import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const instrumentValues = [
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

const sourceTypes = ["upload", "external_link"] as const;
const urlTypes = ["known_sheet_source", "search_fallback"] as const;
export const repertoireStatusValues = ["learning", "mastered", "saved"] as const;
export const feedActivityTypes = [
  "piece_added",
  "piece_mastered",
  "public_note",
  "tag_added",
] as const;

export const users = sqliteTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull().unique(),
    name: text("name"),
    username: text("username"),
    bio: text("bio"),
    instrumentsPlayed: text("instruments_played", { mode: "json" })
      .$type<(typeof instrumentValues)[number][]>()
      .default([]),
    avatarStorageKey: text("avatar_storage_key"),
    passwordHash: text("password_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => ({
    usernameUnique: uniqueIndex("users_username").on(t.username),
  })
);

export const pieces = sqliteTable(
  "pieces",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    composer: text("composer"),
    instrument: text("instrument", { enum: instrumentValues }).notNull(),
    difficulty: integer("difficulty").notNull(),
    sourceType: text("source_type", { enum: sourceTypes }).notNull(),
    storageKey: text("storage_key"),
    externalUrl: text("external_url"),
    mimeType: text("mime_type"),
    fileNameOriginal: text("file_name_original"),
    dateAdded: integer("date_added", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    repertoireStatus: text("repertoire_status", { enum: repertoireStatusValues })
      .notNull()
      .default("learning"),
    isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
    metadataJson: text("metadata_json", { mode: "json" }).$type<Record<string, unknown> | null>(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => ({
    userDateIdx: index("pieces_user_date_idx").on(t.userId, t.dateAdded),
  })
);

export const tags = sqliteTable(
  "tags",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    displayName: text("display_name").notNull(),
    isPreset: integer("is_preset", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => ({
    presetSlugUnique: uniqueIndex("tags_preset_slug").on(t.slug).where(sql`${t.userId} IS NULL`),
    userSlugUnique: uniqueIndex("tags_user_slug")
      .on(t.userId, t.slug)
      .where(sql`${t.userId} IS NOT NULL`),
  })
);

export const pieceTags = sqliteTable(
  "piece_tags",
  {
    pieceId: text("piece_id")
      .notNull()
      .references(() => pieces.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.pieceId, t.tagId] }),
  })
);

export const ratings = sqliteTable(
  "ratings",
  {
    pieceId: text("piece_id")
      .notNull()
      .references(() => pieces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    overall: integer("overall").notNull(),
    difficultyUser: integer("difficulty_user").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.pieceId, t.userId] }),
  })
);

export const pieceVibeScores = sqliteTable(
  "piece_vibe_scores",
  {
    pieceId: text("piece_id")
      .notNull()
      .references(() => pieces.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fitScore: integer("fit_score").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.pieceId, t.tagId, t.userId] }),
  })
);

export const notes = sqliteTable(
  "notes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    pieceId: text("piece_id")
      .notNull()
      .references(() => pieces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull().default(""),
    isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => ({
    pieceUserUnique: uniqueIndex("notes_piece_user").on(t.pieceId, t.userId),
  })
);

export type PracticeCoachResponse = {
  coach_feedback: string;
  tomorrow_focus: string;
  action_steps: string[];
  encouragement_nugget: string;
};

export type AudioClipAnalysis = {
  durationSec: number;
  estimatedTempoBpm: number | null;
  tempoStability: "steady" | "variable" | "unknown";
  averageRms: number;
  peakRms: number;
  dynamicRangeDb: number;
  onsetDensityPerMin: number;
};

export const piecePracticeGoals = sqliteTable(
  "piece_practice_goals",
  {
    pieceId: text("piece_id")
      .primaryKey()
      .references(() => pieces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetTempoBpm: integer("target_tempo_bpm"),
    dynamicsNotes: text("dynamics_notes").notNull().default(""),
    emotionNotes: text("emotion_notes").notNull().default(""),
    passageNotes: text("passage_notes").notNull().default(""),
    goalsText: text("goals_text").notNull().default(""),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => ({
    userIdx: index("piece_practice_goals_user_idx").on(t.userId),
  })
);

export const practiceLogs = sqliteTable(
  "practice_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    pieceId: text("piece_id")
      .notNull()
      .references(() => pieces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull().default(""),
    passageNotes: text("passage_notes").notNull().default(""),
    audioStorageKey: text("audio_storage_key"),
    audioMimeType: text("audio_mime_type"),
    audioAnalysis: text("audio_analysis", { mode: "json" }).$type<AudioClipAnalysis | null>(),
    coachResponse: text("coach_response", { mode: "json" }).$type<PracticeCoachResponse | null>(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => ({
    pieceUserCreatedIdx: index("practice_logs_piece_user_created_idx").on(
      t.pieceId,
      t.userId,
      t.createdAt
    ),
    userCreatedIdx: index("practice_logs_user_created_idx").on(t.userId, t.createdAt),
  })
);

export const follows = sqliteTable(
  "follows",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.followerId, t.followingId] }),
    followerIdx: index("follows_follower_idx").on(t.followerId),
    followingIdx: index("follows_following_idx").on(t.followingId),
  })
);

export const feedActivities = sqliteTable(
  "feed_activities",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", { enum: feedActivityTypes }).notNull(),
    pieceId: text("piece_id")
      .notNull()
      .references(() => pieces.id, { onDelete: "cascade" }),
    tagId: text("tag_id").references(() => tags.id, { onDelete: "set null" }),
    noteExcerpt: text("note_excerpt"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => ({
    userCreatedIdx: index("feed_activities_user_created_idx").on(t.userId, t.createdAt),
  })
);

export const suggestionBatches = sqliteTable("suggestion_batches", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  model: text("model").notNull(),
  promptVersion: text("prompt_version").notNull().default("v1"),
});

export const suggestions = sqliteTable("suggestions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  batchId: text("batch_id")
    .notNull()
    .references(() => suggestionBatches.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  composer: text("composer"),
  difficultyEstimate: integer("difficulty_estimate").notNull(),
  whyBlurb: text("why_blurb").notNull(),
  findSheetMusicUrl: text("find_sheet_music_url").notNull(),
  urlType: text("url_type", { enum: urlTypes }).notNull(),
  /** Display hint for UI badges (e.g. piano, guitar). */
  instrumentHint: text("instrument_hint"),
  /** Short vibe labels for UI badges (e.g. chill, cinematic). JSON array of strings. */
  vibeHints: text("vibe_hints", { mode: "json" }).$type<string[] | null>(),
  sourcePieceIds: text("source_piece_ids", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .$defaultFn(() => []),
  dismissedAt: integer("dismissed_at", { mode: "timestamp_ms" }),
  addedPieceId: text("added_piece_id").references(() => pieces.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const usersRelations = relations(users, ({ many }) => ({
  pieces: many(pieces),
  followers: many(follows, { relationName: "following" }),
  following: many(follows, { relationName: "follower" }),
  feedActivities: many(feedActivities),
}));

export const piecesRelations = relations(pieces, ({ one, many }) => ({
  user: one(users, { fields: [pieces.userId], references: [users.id] }),
  pieceTags: many(pieceTags),
  ratings: many(ratings),
  vibeScores: many(pieceVibeScores),
  notes: many(notes),
  practiceLogs: many(practiceLogs),
  practiceGoal: one(piecePracticeGoals, {
    fields: [pieces.id],
    references: [piecePracticeGoals.pieceId],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  pieceTags: many(pieceTags),
}));

export const pieceTagsRelations = relations(pieceTags, ({ one }) => ({
  piece: one(pieces, { fields: [pieceTags.pieceId], references: [pieces.id] }),
  tag: one(tags, { fields: [pieceTags.tagId], references: [tags.id] }),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  piece: one(pieces, { fields: [ratings.pieceId], references: [pieces.id] }),
}));

export const pieceVibeScoresRelations = relations(pieceVibeScores, ({ one }) => ({
  piece: one(pieces, { fields: [pieceVibeScores.pieceId], references: [pieces.id] }),
  tag: one(tags, { fields: [pieceVibeScores.tagId], references: [tags.id] }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  piece: one(pieces, { fields: [notes.pieceId], references: [pieces.id] }),
}));

export const practiceLogsRelations = relations(practiceLogs, ({ one }) => ({
  piece: one(pieces, { fields: [practiceLogs.pieceId], references: [pieces.id] }),
  user: one(users, { fields: [practiceLogs.userId], references: [users.id] }),
}));

export const piecePracticeGoalsRelations = relations(piecePracticeGoals, ({ one }) => ({
  piece: one(pieces, { fields: [piecePracticeGoals.pieceId], references: [pieces.id] }),
  user: one(users, { fields: [piecePracticeGoals.userId], references: [users.id] }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, { fields: [follows.followerId], references: [users.id] }),
  following: one(users, { fields: [follows.followingId], references: [users.id] }),
}));

export const feedActivitiesRelations = relations(feedActivities, ({ one }) => ({
  user: one(users, { fields: [feedActivities.userId], references: [users.id] }),
  piece: one(pieces, { fields: [feedActivities.pieceId], references: [pieces.id] }),
  tag: one(tags, { fields: [feedActivities.tagId], references: [tags.id] }),
}));
