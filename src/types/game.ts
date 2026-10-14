export type Faction = "NAWAB" | "EIC";

export type CharacterId =
  | "mir_madan"
  | "mohan_lal"
  | "siraj_ud_daulah"
  | "lutfunnisa_begum"
  | "st_frais"
  | "loyal_ally_1"
  | "loyal_ally_2"
  | "mir_jafar"
  | "ghoseti_begum"
  | "ray_durlabh"
  | "umichand"
  | "rajballabh"
  | "jagat_seth"
  | "robert_clive";

export interface CharacterDef {
  id: CharacterId;
  nameBn: string;
  nameEn: string;
  faction: Faction;
  isSpecial: boolean;
  isExtra: boolean; // Part of otirikto niyom
  descriptionBn: string;
  descriptionEn: string;
  powerBn: string;
  powerEn: string;
}

export type GameMode = "BASIC" | "EXTRA";

export interface GameSettings {
  playerCount: number; // 5 to 10
  mode: GameMode;
  useTimers: boolean;
  nominationTimeSeconds: number; // default: 180 (3 mins)
  votingTimeSeconds: number; // default: 60 (1 min)
  assassinationTimeSeconds: number; // default: 300 (5 mins)
}

export interface Player {
  id: string; // unique ID or peer ID
  name: string;
  isHost: boolean;
  avatarIndex: number;
  character?: CharacterDef;
  faction?: Faction;
  isConnected: boolean;
  isBot?: boolean;
  hasAcknowledgedNight?: boolean;
  vote?: "YES" | "NO" | null;
  chapterAction?: "SUCCESS" | "FAIL" | null;
}

export type GamePhase =
  | "LOBBY"
  | "NIGHT"
  | "NOMINATION" // Senapati chooses team
  | "VOTING" // All players vote on nominated team
  | "VOTE_REVEAL" // Showing vote results
  | "MISSION" // Nominated players choose Success or Fail
  | "MISSION_REVEAL" // Showing anonymous shuffled mission results
  | "ASSASSINATION" // Mir Jafar identifies Mir Madan
  | "GAME_OVER";

export interface ChapterHistory {
  chapterIndex: number; // 0 to 4 (Chapters 1 to 5)
  squadSize: number;
  failsRequired: number;
  senapatiId: string;
  nominatedPlayerIds: string[];
  votes: Record<string, "YES" | "NO">;
  votePassed: boolean;
  successCount: number;
  failCount: number;
  chapterPassed: boolean;
}

export interface GameState {
  roomCode: string;
  settings: GameSettings;
  phase: GamePhase;
  players: Player[];
  currentSenapatiIndex: number;
  nominatedPlayerIds: string[];
  failedVoteCount: number; // 0 to 5. At 5, EIC instantly wins
  currentChapter: number; // 0 to 4
  chapterOutcomes: ("NAWAB" | "EIC" | null)[]; // 5 entries
  history: ChapterHistory[];
  
  // Timer state
  timerRemaining: number | null;
  timerActive: boolean;

  // Assassination state
  assassinationTargetId?: string;
  assassinationResult?: boolean; // true if Mir Madan was correctly assassinated

  // Winner & End reason
  winner?: Faction;
  winReason?: string;
}

export type ClientAction =
  | { type: "JOIN_ROOM"; player: Omit<Player, "isHost"> }
  | { type: "UPDATE_SETTINGS"; settings: Partial<GameSettings> }
  | { type: "START_GAME" }
  | { type: "ACKNOWLEDGE_NIGHT"; playerId: string }
  | { type: "TOGGLE_NOMINATION"; playerId: string }
  | { type: "CONFIRM_NOMINATION" }
  | { type: "CAST_VOTE"; playerId: string; vote: "YES" | "NO" }
  | { type: "CONTINUE_AFTER_VOTE" }
  | { type: "SUBMIT_MISSION_ACTION"; playerId: string; action: "SUCCESS" | "FAIL" }
  | { type: "CONTINUE_AFTER_MISSION" }
  | { type: "MIR_JAFAR_ASSASSINATE"; targetPlayerId: string }
  | { type: "ADD_BOT" }
  | { type: "REMOVE_BOT"; botId: string }
  | { type: "FILL_BOTS" }
  | { type: "REMATCH" };
