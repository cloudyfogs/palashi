import { GameState, Player, CharacterDef } from "@/types/game";
import { SQUAD_SIZES, getFailsRequired } from "@/constants/rules";
import { shuffle } from "@/utils/gameLogic";

// ==========================================
// 1. SQUAD NOMINATION HEURISTIC FOR BOTS
// ==========================================
export function botNominateSquad(
  bot: Player,
  gameState: GameState
): string[] {
  const playerCount = gameState.settings.playerCount;
  const currentChapter = gameState.currentChapter;
  const requiredSize = SQUAD_SIZES[playerCount]?.[currentChapter] || 2;
  const allPlayers = gameState.players;
  const isRed = bot.faction === "EIC";

  if (isRed) {
    // Red Bot: Sneak self or 1 Red ally, and fill rest with unsuspecting Green players
    const redAllies = allPlayers.filter(
      (p) => p.faction === "EIC" && p.id !== bot.id
    );
    const greenPlayers = allPlayers.filter((p) => p.faction === "NAWAB");

    const squad: string[] = [bot.id]; // Red bot nominates self

    // If squad size >= 3, maybe add 1 Red ally (30% chance) or keep it 1 Red to look pure Green
    if (requiredSize >= 3 && Math.random() < 0.35 && redAllies.length > 0) {
      squad.push(shuffle(redAllies)[0].id);
    }

    // Fill the rest with randomly selected Green players
    const shuffledGreen = shuffle(greenPlayers);
    for (const g of shuffledGreen) {
      if (squad.length < requiredSize && !squad.includes(g.id)) {
        squad.push(g.id);
      }
    }

    // Fallback if needed
    for (const p of shuffle(allPlayers)) {
      if (squad.length < requiredSize && !squad.includes(p.id)) {
        squad.push(p.id);
      }
    }

    return squad;
  } else {
    // Green Bot: Calculate trust based on past chapter history
    const trustScores: Record<string, number> = {};
    allPlayers.forEach((p) => {
      trustScores[p.id] = 5; // Base neutral trust
    });

    // Green bot trusts self 100%
    trustScores[bot.id] = 10;

    // Analyze past chapters
    gameState.history.forEach((hist) => {
      if (!hist.chapterPassed) {
        // Mission failed: decrease trust for all players who were on that mission
        hist.nominatedPlayerIds.forEach((id) => {
          trustScores[id] = (trustScores[id] || 5) - 3.5;
        });
      } else {
        // Mission passed: increase trust for clean squad members
        hist.nominatedPlayerIds.forEach((id) => {
          trustScores[id] = (trustScores[id] || 5) + 2;
        });
      }
    });

    // Sort players by highest trust
    const sorted = [...allPlayers]
      .filter((p) => p.id !== bot.id)
      .sort((a, b) => (trustScores[b.id] || 0) - (trustScores[a.id] || 0));

    // Squad starts with self + most trusted players
    const squad: string[] = [bot.id];
    for (const p of sorted) {
      if (squad.length < requiredSize) {
        squad.push(p.id);
      }
    }

    return squad;
  }
}

// ==========================================
// 2. VOTING HEURISTIC FOR BOTS
// ==========================================
export function botCastVote(
  bot: Player,
  gameState: GameState
): "YES" | "NO" {
  // Safety rule: 5th failed vote results in instant EIC victory. Green bots will ALWAYS vote YES on the 5th attempt!
  if (bot.faction === "NAWAB" && gameState.failedVoteCount >= 4) {
    return "YES";
  }

  const squadIds = gameState.nominatedPlayerIds;
  const isBotOnSquad = squadIds.includes(bot.id);
  const isRed = bot.faction === "EIC";

  if (isRed) {
    // Red Bot voting strategy:
    // Count how many Red members are on this squad
    const redMembersOnSquad = gameState.players.filter(
      (p) => p.faction === "EIC" && squadIds.includes(p.id)
    );

    if (redMembersOnSquad.length > 0) {
      // Squad has a saboteur! Vote YES to get in
      return "YES";
    } else {
      // Squad is 100% Green! Vote NO to stop a clean Green mission
      // Small 15% bluff to vote Yes and pretend to be an agreeable Green player
      return Math.random() < 0.15 ? "YES" : "NO";
    }
  } else {
    // Green Bot voting strategy:
    // If bot is on the squad: vote YES 85% of the time (unless high suspicion of other member)
    if (isBotOnSquad) {
      // Check if squad contains someone who failed a previous mission
      const containsSuspect = gameState.history.some(
        (hist) => !hist.chapterPassed && hist.nominatedPlayerIds.some((id) => squadIds.includes(id) && id !== bot.id)
      );
      if (containsSuspect && Math.random() < 0.6) {
        return "NO"; // Reject suspect
      }
      return "YES";
    }

    // Bot is not on squad:
    // Check if squad contains known clean members
    const cleanMembersCount = squadIds.filter((id) =>
      gameState.history.some((hist) => hist.chapterPassed && hist.nominatedPlayerIds.includes(id))
    ).length;

    if (cleanMembersCount >= 1 && Math.random() < 0.7) {
      return "YES";
    }

    // Early rounds: 65% vote YES to allow testing
    if (gameState.currentChapter === 0) {
      return Math.random() < 0.65 ? "YES" : "NO";
    }

    return Math.random() < 0.4 ? "YES" : "NO";
  }
}

// ==========================================
// 3. MISSION ACTION HEURISTIC (BLUFFING)
// ==========================================
export function botChooseMissionAction(
  bot: Player,
  gameState: GameState
): "SUCCESS" | "FAIL" {
  // Green Loyalists MUST play SUCCESS by game rules
  if (bot.faction === "NAWAB") {
    return "SUCCESS";
  }

  // Red Conspirators decision logic (Bluff vs Sabotage)
  const currentChapter = gameState.currentChapter;
  const nawabWins = gameState.chapterOutcomes.filter((o) => o === "NAWAB").length;
  const eicWins = gameState.chapterOutcomes.filter((o) => o === "EIC").length;

  // 1. If EIC has 2 wins, this sabotage wins the whole game! -> 100% FAIL
  if (eicWins >= 2) {
    return "FAIL";
  }

  // 2. If Nawab has 2 wins, letting this succeed lets Nawab win! -> 100% FAIL
  if (nawabWins >= 2) {
    return "FAIL";
  }

  // 3. Coordination check: If multiple Red bots are on this squad
  const redSquadMembers = gameState.players.filter(
    (p) => p.faction === "EIC" && gameState.nominatedPlayerIds.includes(p.id)
  );

  const playerCount = gameState.settings.playerCount;
  const failsRequired = getFailsRequired(currentChapter, playerCount);

  // If chapter 4 requires 2 fails (starred rule) and there are 2 Red players: both fail
  if (failsRequired >= 2 && redSquadMembers.length >= 2) {
    return "FAIL";
  }

  // If multiple Red members on normal round, only the first one sabotages, others play SUCCESS to blend in
  if (redSquadMembers.length > 1) {
    const isPrimarySaboteur = redSquadMembers[0].id === bot.id;
    if (!isPrimarySaboteur) {
      return "SUCCESS"; // Disguise as innocent
    }
  }

  // 4. Chapter 1 Bluff: 50% chance to play SUCCESS on Chapter 1 to gain total trust for Chapters 3/4/5
  if (currentChapter === 0) {
    return Math.random() < 0.5 ? "FAIL" : "SUCCESS";
  }

  // 5. Chapters 2, 3, 4, 5: 85% chance to sabotage
  return Math.random() < 0.85 ? "FAIL" : "SUCCESS";
}

// ==========================================
// 4. MIR JAFAR BOT: ASSASSINATING MIR MADAN
// ==========================================
export function botIdentifyMirMadan(
  gameState: GameState
): string {
  // Candidate pool: All Nawab players
  const nawabPlayers = gameState.players.filter((p) => p.faction === "NAWAB");
  if (nawabPlayers.length === 0) return gameState.players[0].id;

  // Mir Madan knows who Red is (except Ray Durlabh).
  // Thus, Mir Madan consistently:
  // 1. Votes NO on squads that contain Red members.
  // 2. Never nominates Red members in his own proposals.
  // 3. Votes YES on clean Green squads.
  const mirMadanScores: Record<string, number> = {};
  nawabPlayers.forEach((p) => {
    mirMadanScores[p.id] = 0;
  });

  const redPlayerIds = gameState.players
    .filter((p) => p.faction === "EIC")
    .map((p) => p.id);

  // Analyze voting history
  gameState.history.forEach((hist) => {
    const squadHasRed = hist.nominatedPlayerIds.some((id) => redPlayerIds.includes(id));
    const isSenapatiNawab = nawabPlayers.some((p) => p.id === hist.senapatiId);

    // If a Nawab player nominated the squad:
    if (isSenapatiNawab) {
      if (!squadHasRed) {
        // Mir Madan would deliberately avoid Red
        mirMadanScores[hist.senapatiId] = (mirMadanScores[hist.senapatiId] || 0) + 3;
      } else {
        // Mir Madan would almost NEVER nominate a Red member
        mirMadanScores[hist.senapatiId] = (mirMadanScores[hist.senapatiId] || 0) - 5;
      }
    }

    // Look at how Nawab players voted:
    Object.entries(hist.votes).forEach(([playerId, vote]) => {
      if (mirMadanScores[playerId] !== undefined) {
        if (squadHasRed) {
          if (vote === "NO") {
            // Mir Madan knows it's dirty and votes NO!
            mirMadanScores[playerId] = (mirMadanScores[playerId] || 0) + 4;
          } else {
            // Voted YES on a dirty squad -> less likely to be Mir Madan
            mirMadanScores[playerId] = (mirMadanScores[playerId] || 0) - 3;
          }
        } else {
          if (vote === "YES") {
            // Mir Madan knows it's clean and votes YES
            mirMadanScores[playerId] = (mirMadanScores[playerId] || 0) + 2;
          }
        }
      }
    });
  });

  // Pick the player with the highest score
  let bestTarget = nawabPlayers[0].id;
  let highestScore = -Infinity;

  nawabPlayers.forEach((p) => {
    const score = (mirMadanScores[p.id] || 0) + (Math.random() * 1.5); // slight noise for variety
    if (score > highestScore) {
      highestScore = score;
      bestTarget = p.id;
    }
  });

  return bestTarget;
}
