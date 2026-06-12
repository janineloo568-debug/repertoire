import type { FeedItem } from "@/lib/queries/feed";
import type { PublicProfileData } from "@/lib/profile/types";
import { dedupePiecesInSwimlane } from "@/lib/profile/dedupe-pieces";
import {
  collectProfileVibeTags,
  type PublicPieceRow,
} from "@/lib/queries/public-profile";

export type MockPublicProfile = PublicProfileData;

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000);

function piece(
  id: string,
  title: string,
  composer: string,
  instrument: string,
  status: PublicPieceRow["repertoireStatus"],
  opts: Partial<PublicPieceRow> = {}
): PublicPieceRow {
  return {
    id,
    title,
    composer,
    instrument,
    difficulty: opts.difficulty ?? 3,
    difficultyUser: opts.difficultyUser ?? null,
    repertoireStatus: status,
    overallRating: opts.overallRating ?? null,
    tags: opts.tags ?? [],
    publicNote: opts.publicNote ?? null,
  };
}

function tag(id: string, displayName: string, fitScore: number | null = null) {
  return { id, displayName, fitScore };
}

function buildProfile(
  user: MockPublicProfile["user"],
  sections: {
    learning: PublicPieceRow[];
    mastered: PublicPieceRow[];
    saved: PublicPieceRow[];
  },
  totalLibraryCount: number
): MockPublicProfile {
  const learning = dedupePiecesInSwimlane(sections.learning);
  const mastered = dedupePiecesInSwimlane(sections.mastered);
  const saved = dedupePiecesInSwimlane(sections.saved);
  const publicPieceCount = learning.length + mastered.length + saved.length;
  return {
    user,
    totalLibraryCount,
    publicPieceCount,
    vibeTags: collectProfileVibeTags([learning, mastered, saved]),
    learning,
    mastered,
    saved,
  };
}

export const MOCK_PROFILES: Record<string, MockPublicProfile> = {
  "maya-cello": buildProfile(
    {
      id: "mock-user-maya",
      name: "Maya Okonkwo",
      username: "maya-cello",
      bio: "🎻 Chamber musician in Montréal · Bach & French romantics · coffee before rehearsal ☕",
      instrumentsPlayed: ["cello", "piano"],
      avatarUrl: null,
    },
    {
      learning: [
        piece("mock-piece-maya-1", "Cello Suite No. 1 in G", "Bach", "cello", "learning", {
          difficulty: 4,
          difficultyUser: 4,
          overallRating: 4,
          tags: [tag("mock-tag-practice", "Active practice", 5)],
          publicNote:
            "Working the prelude — intonation on the low strings is the focus this month.",
        }),
        piece("mock-piece-maya-4", "Cello Suite No. 3 in C", "Bach", "cello", "learning", {
          difficulty: 5,
          difficultyUser: 5,
          overallRating: 3,
          tags: [tag("mock-tag-practice", "Active practice", 4)],
        }),
        piece("mock-piece-maya-5", "Sonata in G minor", "Chopin", "cello", "learning", {
          difficulty: 4,
          tags: [tag("mock-tag-rainy", "Rainy day", 4)],
        }),
        piece("mock-piece-maya-6", "Adagio from Concierto de Aranjuez", "Rodrigo", "cello", "learning", {
          difficulty: 4,
          overallRating: 4,
          tags: [tag("mock-tag-bg", "Background music", 3)],
        }),
      ],
      mastered: [
        piece("mock-piece-maya-2", "The Swan", "Saint-Saëns", "cello", "mastered", {
          overallRating: 5,
          difficultyUser: 3,
          tags: [tag("mock-tag-wedding", "Wedding", 4)],
        }),
        piece("mock-piece-maya-7", "Après un rêve", "Fauré", "cello", "mastered", {
          overallRating: 5,
          difficultyUser: 3,
          tags: [tag("mock-tag-wedding", "Wedding", 5)],
        }),
        piece("mock-piece-maya-8", "Sonata in E minor, Op. 38", "Brahms", "cello", "mastered", {
          overallRating: 5,
          difficultyUser: 4,
          tags: [tag("mock-tag-comfort", "Comfort piece", 5)],
        }),
        piece("mock-piece-maya-9", "Kol Nidrei", "Bruch", "cello", "mastered", {
          overallRating: 4,
          difficultyUser: 4,
          tags: [tag("mock-tag-rainy", "Rainy day", 5)],
          publicNote: "My recital closer — always lands emotionally.",
        }),
        piece("mock-piece-maya-10", "Cello Sonata in A", "Franck", "cello", "mastered", {
          overallRating: 5,
          difficultyUser: 5,
          tags: [tag("mock-tag-showoff", "Show-off piece", 4)],
        }),
      ],
      saved: [
        piece("mock-piece-maya-3", "Élégie", "Fauré", "cello", "saved", {
          tags: [tag("mock-tag-rainy", "Rainy day", 5)],
        }),
        piece("mock-piece-maya-11", "Concerto in B minor", "Dvořák", "cello", "saved", {
          difficulty: 5,
          tags: [tag("mock-tag-showoff", "Show-off piece", 3)],
        }),
        piece("mock-piece-maya-12", "Pavane", "Fauré", "cello", "saved", {
          tags: [tag("mock-tag-bg", "Background music", 4), tag("mock-tag-wedding", "Wedding", 3)],
        }),
      ],
    },
    42
  ),
  "leo-keys": buildProfile(
    {
      id: "mock-user-leo",
      name: "Leo Hartmann",
      username: "leo-keys",
      bio: "🎹 Jazz-adjacent pianist · Bach preludes at 2am · always chasing that Debussy wash 🌙",
      instrumentsPlayed: ["piano"],
      avatarUrl: null,
    },
    {
      learning: [
        piece("mock-piece-leo-1", "Clair de Lune", "Debussy", "piano", "learning", {
          difficulty: 4,
          difficultyUser: 4,
          tags: [tag("mock-tag-rainy", "Rainy day", 5)],
        }),
        piece("mock-piece-leo-3", "Arabesque No. 1", "Debussy", "piano", "learning", {
          difficulty: 3,
          tags: [tag("mock-tag-rainy", "Rainy day", 4)],
        }),
        piece("mock-piece-leo-4", "Rhapsody in Blue", "Gershwin", "piano", "learning", {
          difficulty: 5,
          overallRating: 4,
          tags: [tag("mock-tag-showoff", "Show-off piece", 4)],
        }),
      ],
      mastered: [
        piece("mock-piece-leo-2", "Prelude in C Major", "Bach", "piano", "mastered", {
          overallRating: 5,
          difficultyUser: 2,
          tags: [tag("mock-tag-comfort", "Comfort piece", 5)],
        }),
        piece("mock-piece-leo-5", "Für Elise", "Beethoven", "piano", "mastered", {
          overallRating: 4,
          tags: [tag("mock-tag-comfort", "Comfort piece", 4)],
        }),
        piece("mock-piece-leo-6", "Nocturne Op. 9 No. 2", "Chopin", "piano", "mastered", {
          overallRating: 5,
          tags: [tag("mock-tag-rainy", "Rainy day", 5)],
        }),
        piece("mock-piece-leo-7", "Maple Leaf Rag", "Joplin", "piano", "mastered", {
          overallRating: 4,
          tags: [tag("mock-tag-campfire", "Campfire", 5)],
        }),
        piece("mock-piece-leo-8", "Gymnopédie No. 1", "Satie", "piano", "mastered", {
          overallRating: 5,
          tags: [tag("mock-tag-bg", "Background music", 5)],
        }),
      ],
      saved: [
        piece("mock-piece-leo-9", "La Campanella", "Liszt", "piano", "saved", {
          difficulty: 5,
          tags: [tag("mock-tag-showoff", "Show-off piece", 2)],
        }),
        piece("mock-piece-leo-10", "Piano Sonata No. 14", "Beethoven", "piano", "saved", {
          tags: [tag("mock-tag-practice", "Active practice", 3)],
        }),
      ],
    },
    28
  ),
  "priya-violin": buildProfile(
    {
      id: "mock-user-priya",
      name: "Priya Sharma",
      username: "priya-violin",
      bio: "💒 Wedding & studio violinist · lyrical repertoire hunter · tea > coffee 🍵",
      instrumentsPlayed: ["violin", "viola"],
      avatarUrl: null,
    },
    {
      learning: [
        piece("mock-piece-priya-1", "Meditation from Thaïs", "Massenet", "violin", "learning", {
          tags: [tag("mock-tag-bg", "Background music", 4)],
        }),
        piece("mock-piece-priya-4", "Violin Concerto", "Mendelssohn", "violin", "learning", {
          difficulty: 5,
          tags: [tag("mock-tag-practice", "Active practice", 4)],
        }),
        piece("mock-piece-priya-5", "The Lark Ascending", "Vaughan Williams", "violin", "learning", {
          tags: [tag("mock-tag-rainy", "Rainy day", 5)],
        }),
      ],
      mastered: [
        piece("mock-piece-priya-2", "Après un rêve", "Fauré", "violin", "mastered", {
          overallRating: 5,
          difficultyUser: 3,
          publicNote:
            "Finally comfortable in the high register — my go-to for intimate gigs.",
        }),
        piece("mock-piece-priya-6", "Ave Maria", "Schubert", "violin", "mastered", {
          overallRating: 5,
          tags: [tag("mock-tag-wedding", "Wedding", 5)],
        }),
        piece("mock-piece-priya-7", "Canon in D", "Pachelbel", "violin", "mastered", {
          overallRating: 4,
          tags: [tag("mock-tag-wedding", "Wedding", 4)],
        }),
        piece("mock-piece-priya-8", "Salut d'amour", "Elgar", "violin", "mastered", {
          overallRating: 5,
          tags: [tag("mock-tag-wedding", "Wedding", 5)],
        }),
        piece("mock-piece-priya-9", "Csárdás", "Monti", "violin", "mastered", {
          overallRating: 4,
          tags: [tag("mock-tag-showoff", "Show-off piece", 5)],
        }),
      ],
      saved: [
        piece("mock-piece-priya-3", "Zigeunerweisen", "Sarasate", "violin", "saved", {
          difficulty: 5,
          tags: [tag("mock-tag-showoff", "Show-off piece", 3)],
        }),
        piece("mock-piece-priya-10", "Chaconne", "Bach", "violin", "saved", {
          difficulty: 5,
          tags: [tag("mock-tag-practice", "Active practice", 2)],
        }),
      ],
    },
    38
  ),
  "sam-guitar": buildProfile(
    {
      id: "mock-user-sam",
      name: "Sam Delgado",
      username: "sam-guitar",
      bio: "🔥 Classical guitar · community concerts & campfire encores when allowed",
      instrumentsPlayed: ["guitar"],
      avatarUrl: null,
    },
    {
      learning: [
        piece("mock-piece-sam-3", "Recuerdos de la Alhambra", "Tárrega", "guitar", "learning", {
          difficulty: 4,
          tags: [tag("mock-tag-practice", "Active practice", 4)],
        }),
        piece("mock-piece-sam-4", "Cavatina", "Myers", "guitar", "learning", {
          tags: [tag("mock-tag-bg", "Background music", 5)],
        }),
      ],
      mastered: [
        piece("mock-piece-sam-1", "Asturias", "Albéniz", "guitar", "mastered", {
          difficulty: 5,
          overallRating: 4,
          difficultyUser: 5,
          tags: [tag("mock-tag-campfire", "Campfire", 4)],
        }),
        piece("mock-piece-sam-5", "Romanza", "Anonymous", "guitar", "mastered", {
          overallRating: 5,
          tags: [tag("mock-tag-campfire", "Campfire", 5), tag("mock-tag-comfort", "Comfort piece", 5)],
        }),
        piece("mock-piece-sam-6", "Study in B minor", "Sor", "guitar", "mastered", {
          overallRating: 4,
          tags: [tag("mock-tag-practice", "Active practice", 4)],
        }),
        piece("mock-piece-sam-7", "Malagueña", "Lecuona", "guitar", "mastered", {
          overallRating: 4,
          tags: [tag("mock-tag-showoff", "Show-off piece", 4)],
        }),
        piece("mock-piece-sam-8", "Cello Suite No. 1 (arr.)", "Bach", "guitar", "mastered", {
          overallRating: 5,
          tags: [tag("mock-tag-comfort", "Comfort piece", 4)],
        }),
      ],
      saved: [
        piece("mock-piece-sam-2", "Lágrima", "Tárrega", "guitar", "saved", {
          tags: [tag("mock-tag-comfort", "Comfort piece", 5)],
        }),
        piece("mock-piece-sam-9", "Concierto de Aranjuez", "Rodrigo", "guitar", "saved", {
          difficulty: 5,
          tags: [tag("mock-tag-showoff", "Show-off piece", 3)],
        }),
        piece("mock-piece-sam-10", "Libra Sonatine", "Dutilleux", "guitar", "saved", {
          tags: [tag("mock-tag-rainy", "Rainy day", 4)],
        }),
      ],
    },
    22
  ),
};

export const MOCK_FEED_ITEMS: FeedItem[] = [
  {
    id: "mock-feed-1",
    type: "piece_mastered",
    createdAt: hoursAgo(2),
    actor: { id: "mock-user-maya", name: "Maya Okonkwo", username: "maya-cello" },
    piece: {
      id: "mock-piece-maya-2",
      title: "The Swan",
      composer: "Saint-Saëns",
      instrument: "cello",
      difficulty: 3,
      externalUrl: "https://imslp.org",
      sourceType: "external_link",
    },
    tag: null,
    noteExcerpt: null,
  },
  {
    id: "mock-feed-2",
    type: "public_note",
    createdAt: hoursAgo(5),
    actor: { id: "mock-user-priya", name: "Priya Sharma", username: "priya-violin" },
    piece: {
      id: "mock-piece-priya-2",
      title: "Après un rêve",
      composer: "Fauré",
      instrument: "violin",
      difficulty: 3,
      externalUrl: "https://imslp.org",
      sourceType: "external_link",
    },
    tag: null,
    noteExcerpt:
      "Finally comfortable in the high register — my go-to for intimate gigs.",
  },
  {
    id: "mock-feed-3",
    type: "tag_added",
    createdAt: hoursAgo(8),
    actor: { id: "mock-user-leo", name: "Leo Hartmann", username: "leo-keys" },
    piece: {
      id: "mock-piece-leo-1",
      title: "Clair de Lune",
      composer: "Debussy",
      instrument: "piano",
      difficulty: 4,
      externalUrl: "https://imslp.org",
      sourceType: "external_link",
    },
    tag: { id: "mock-tag-rainy", displayName: "Rainy day" },
    noteExcerpt: null,
  },
  {
    id: "mock-feed-4",
    type: "piece_added",
    createdAt: hoursAgo(14),
    actor: { id: "mock-user-sam", name: "Sam Delgado", username: "sam-guitar" },
    piece: {
      id: "mock-piece-sam-2",
      title: "Lágrima",
      composer: "Tárrega",
      instrument: "guitar",
      difficulty: 2,
      externalUrl: "https://imslp.org",
      sourceType: "external_link",
    },
    tag: null,
    noteExcerpt: null,
  },
  {
    id: "mock-feed-5",
    type: "piece_added",
    createdAt: hoursAgo(20),
    actor: { id: "mock-user-maya", name: "Maya Okonkwo", username: "maya-cello" },
    piece: {
      id: "mock-piece-maya-1",
      title: "Cello Suite No. 1 in G",
      composer: "Bach",
      instrument: "cello",
      difficulty: 4,
      externalUrl: "https://imslp.org",
      sourceType: "external_link",
    },
    tag: null,
    noteExcerpt: null,
  },
  {
    id: "mock-feed-6",
    type: "tag_added",
    createdAt: hoursAgo(28),
    actor: { id: "mock-user-priya", name: "Priya Sharma", username: "priya-violin" },
    piece: {
      id: "mock-piece-priya-3",
      title: "Zigeunerweisen",
      composer: "Sarasate",
      instrument: "violin",
      difficulty: 5,
      externalUrl: "https://imslp.org",
      sourceType: "external_link",
    },
    tag: { id: "mock-tag-showoff", displayName: "Show-off piece" },
    noteExcerpt: null,
  },
  {
    id: "mock-feed-7",
    type: "piece_mastered",
    createdAt: hoursAgo(36),
    actor: { id: "mock-user-leo", name: "Leo Hartmann", username: "leo-keys" },
    piece: {
      id: "mock-piece-leo-2",
      title: "Prelude in C Major",
      composer: "Bach",
      instrument: "piano",
      difficulty: 2,
      externalUrl: "https://imslp.org",
      sourceType: "external_link",
    },
    tag: null,
    noteExcerpt: null,
  },
  {
    id: "mock-feed-8",
    type: "public_note",
    createdAt: hoursAgo(48),
    actor: { id: "mock-user-maya", name: "Maya Okonkwo", username: "maya-cello" },
    piece: {
      id: "mock-piece-maya-1",
      title: "Cello Suite No. 1 in G",
      composer: "Bach",
      instrument: "cello",
      difficulty: 4,
      externalUrl: "https://imslp.org",
      sourceType: "external_link",
    },
    tag: null,
    noteExcerpt:
      "Working the prelude — intonation on the low strings is the focus this month.",
  },
];

export function getMockProfile(username: string): MockPublicProfile | null {
  return MOCK_PROFILES[username.toLowerCase()] ?? null;
}

export function getMockPiece(username: string, pieceId: string): PublicPieceRow | null {
  const profile = getMockProfile(username);
  if (!profile) return null;
  const all = [...profile.learning, ...profile.mastered, ...profile.saved];
  return all.find((p) => p.id === pieceId) ?? null;
}

export function listMockSuggestedProfiles() {
  return Object.values(MOCK_PROFILES).map((p) => ({
    id: p.user.id,
    name: p.user.name,
    username: p.user.username,
    publicPieceCount: p.publicPieceCount,
  }));
}
