export interface PlayerBalance {
  nawabCount: number;
  eicCount: number;
}

// Exact Player distribution table from Page 1 of the official manual
export const PLAYER_BALANCE: Record<number, PlayerBalance> = {
  5: { nawabCount: 3, eicCount: 2 },
  6: { nawabCount: 4, eicCount: 2 },
  7: { nawabCount: 4, eicCount: 3 },
  8: { nawabCount: 5, eicCount: 3 },
  9: { nawabCount: 6, eicCount: 3 },
  10: { nawabCount: 6, eicCount: 4 },
};

// Exact Chapter squad sizes table from Page 2 of the official manual
// [Chapter 1, Chapter 2, Chapter 3, Chapter 4, Chapter 5]
export const SQUAD_SIZES: Record<number, number[]> = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
};

// Chapter 4 (index 3) requires 2 fails in games with 7 or more players
export function getFailsRequired(chapterIndex: number, playerCount: number): number {
  if (chapterIndex === 3 && playerCount >= 7) {
    return 2;
  }
  return 1;
}

export const CHAPTER_NAMES_BN = [
  "১ম অধ্যায় — ভাগীরথীর তীর",
  "২য় অধ্যায় — আম্রকাননের সমাবেশ",
  "৩য় অধ্যায় — কামানের গর্জন",
  "৪র্থ অধ্যায় — সেনাপতির বিশ্বাসঘাতকতা (*)",
  "৫ম অধ্যায় — মসনদের ভাগ্য নির্ধারণ",
];

export const CHAPTER_NAMES_EN = [
  "Chapter 1 — Banks of the Bhagirathi",
  "Chapter 2 — Council at the Mango Grove",
  "Chapter 3 — Roar of the Cannons",
  "Chapter 4 — Betrayal of the General (*)",
  "Chapter 5 — Fate of the Throne",
];
