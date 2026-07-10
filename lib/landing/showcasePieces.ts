export type ShowcaseStatusTone = "mastered" | "learning" | "new";

export type ShowcasePiece = {
  title: string;
  composer: string;
  genreLabel: string;
  statusLabel: string;
  statusTone: ShowcaseStatusTone;
};

export const featureShowcasePieces: ShowcasePiece[] = [
  {
    title: "Comptine d'un Autre été",
    composer: "Yann Tiersen",
    statusLabel: "Mastered",
    statusTone: "mastered",
    genreLabel: "Contemporary Classical",
  },
  {
    title: "Interstellar Main Theme",
    composer: "Hans Zimmer",
    statusLabel: "Learning",
    statusTone: "learning",
    genreLabel: "Contemporary",
  },
];

export const dailyMixShowcasePieces: ShowcasePiece[] = [
  {
    title: "Wagon Wheel",
    composer: "Darius Rucker",
    statusLabel: "New",
    statusTone: "new",
    genreLabel: "Country Pop",
  },
  {
    title: "Clair de Lune",
    composer: "Claude Debussy",
    statusLabel: "New",
    statusTone: "new",
    genreLabel: "Impressionism",
  },
  {
    title: "Married Life",
    composer: "Michael Giacchino",
    statusLabel: "New",
    statusTone: "new",
    genreLabel: "Contemporary",
  },
  {
    title: "Summer of '69",
    composer: "Bryan Adams",
    statusLabel: "New",
    statusTone: "new",
    genreLabel: "Rock",
  },
];

export function showcasePieceKey(piece: Pick<ShowcasePiece, "title" | "composer">): string {
  return `${piece.title}::${piece.composer}`;
}
