import { CHARACTERS } from "@/constants/cards";
import { PLAYER_BALANCE, getFailsRequired, SQUAD_SIZES } from "@/constants/rules";
import { CharacterDef, GameSettings, Player, Faction } from "@/types/game";

// Shuffle array using Fisher-Yates
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function assignCharacters(players: Player[], settings: GameSettings): Player[] {
  const count = players.length;
  const balance = PLAYER_BALANCE[count] || PLAYER_BALANCE[5];

  // Nawab roles pool
  let nawabPool: CharacterDef[] = [CHARACTERS.mir_madan];
  if (settings.mode === "EXTRA") {
    nawabPool.push(CHARACTERS.mohan_lal);
  }
  const genericNawab = [
    CHARACTERS.siraj_ud_daulah,
    CHARACTERS.lutfunnisa_begum,
    CHARACTERS.st_frais,
    CHARACTERS.loyal_ally_1,
    CHARACTERS.loyal_ally_2,
  ];
  shuffle(genericNawab).forEach((char) => {
    if (nawabPool.length < balance.nawabCount) {
      nawabPool.push(char);
    }
  });

  // EIC roles pool
  let eicPool: CharacterDef[] = [CHARACTERS.mir_jafar];
  if (settings.mode === "EXTRA") {
    // Priority for extra mode roles
    const extraEic = [
      CHARACTERS.ghoseti_begum,
      CHARACTERS.ray_durlabh,
      CHARACTERS.umichand,
    ];
    extraEic.forEach((char) => {
      if (eicPool.length < balance.eicCount) {
        eicPool.push(char);
      }
    });
  }
  const genericEic = [
    CHARACTERS.rajballabh,
    CHARACTERS.jagat_seth,
    CHARACTERS.robert_clive,
  ];
  shuffle(genericEic).forEach((char) => {
    if (eicPool.length < balance.eicCount) {
      eicPool.push(char);
    }
  });

  // Combine and shuffle all roles
  const allRoles = shuffle([...nawabPool, ...eicPool]);
  const shuffledPlayers = shuffle([...players]);

  return shuffledPlayers.map((player, idx) => {
    const role = allRoles[idx];
    return {
      ...player,
      character: role,
      faction: role.faction,
      vote: null,
      chapterAction: null,
      hasAcknowledgedNight: false,
    };
  });
}

export interface NightVision {
  knownConspirators: Player[]; // Players known to be EIC (e.g. for Mir Madan or EIC peers)
  mirMadanCandidates: Player[]; // For Mohan Lal: Mir Madan + Ghoseti Begum in random order
  fellowEicMembers: Player[]; // For EIC peers
  isIsolated: boolean; // For Umichand
}

export function computeNightVision(observer: Player, allPlayers: Player[]): NightVision {
  const charId = observer.character?.id;
  const vision: NightVision = {
    knownConspirators: [],
    mirMadanCandidates: [],
    fellowEicMembers: [],
    isIsolated: false,
  };

  if (!observer.character) return vision;

  // 1. Mir Madan: Sees all EIC EXCEPT Ray Durlabh
  if (charId === "mir_madan") {
    vision.knownConspirators = allPlayers.filter(
      (p) => p.faction === "EIC" && p.character?.id !== "ray_durlabh" && p.id !== observer.id
    );
  }

  // 2. Mohan Lal: Sees Mir Madan AND Ghoseti Begum (shuffled so order doesn't leak identity)
  if (charId === "mohan_lal") {
    const candidates = allPlayers.filter(
      (p) => p.character?.id === "mir_madan" || p.character?.id === "ghoseti_begum"
    );
    vision.mirMadanCandidates = shuffle(candidates);
  }

  // 3. EIC Conspirators (except Umichand): See other EIC members except Umichand
  if (observer.faction === "EIC") {
    if (charId === "umichand") {
      vision.isIsolated = true;
    } else {
      vision.fellowEicMembers = allPlayers.filter(
        (p) => p.faction === "EIC" && p.character?.id !== "umichand" && p.id !== observer.id
      );
    }
  }

  return vision;
}

export function checkChapterSuccess(
  chapterIndex: number,
  playerCount: number,
  actions: ("SUCCESS" | "FAIL")[]
): { passed: boolean; successCount: number; failCount: number; failsRequired: number } {
  const failsRequired = getFailsRequired(chapterIndex, playerCount);
  let successCount = 0;
  let failCount = 0;

  for (const act of actions) {
    if (act === "FAIL") failCount++;
    else successCount++;
  }

  const passed = failCount < failsRequired;
  return { passed, successCount, failCount, failsRequired };
}

export function checkOverallWinner(
  chapterOutcomes: ("NAWAB" | "EIC" | null)[],
  failedVoteCount: number
): { winner: Faction | null; reason?: string } {
  // If 5 votes failed in a row, EIC wins instantly
  if (failedVoteCount >= 5) {
    return {
      winner: "EIC",
      reason: "দরবারে পরপর ৫ বার দল গঠনের ভোট ব্যর্থ হয়েছে — ইস্ট ইন্ডিয়া কোম্পানি সরাসরি জয়ী!",
    };
  }

  let nawabWins = 0;
  let eicWins = 0;

  for (const outcome of chapterOutcomes) {
    if (outcome === "NAWAB") nawabWins++;
    if (outcome === "EIC") eicWins++;
  }

  if (eicWins >= 3) {
    return {
      winner: "EIC",
      reason: "ইস্ট ইন্ডিয়া কোম্পানি ৩টি অধ্যায়ে নাশকতা চালিয়ে বাংলার মসনদ কব্জা করেছে!",
    };
  }

  // Note: If nawabWins >= 3, game does not end immediately; it enters ASSASSINATION phase.
  return { winner: null };
}
