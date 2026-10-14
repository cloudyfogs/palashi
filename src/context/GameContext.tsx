"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import {
  GameState,
  Player,
  GameSettings,
  ClientAction,
  ChapterHistory,
  Faction,
} from "@/types/game";
import {
  assignCharacters,
  checkChapterSuccess,
  checkOverallWinner,
  computeNightVision,
  NightVision,
} from "@/utils/gameLogic";
import { SQUAD_SIZES } from "@/constants/rules";
import {
  setRoomState,
  getRoomState,
  updateRoomPlayers,
  deleteRoom,
  subscribeToRoomState,
  setPlayerSecret,
  getPlayerSecret,
  pushAction,
  getActions,
  deleteAction,
  sendHeartbeat,
  removeHeartbeat,
  getHeartbeats,
  normalizeGameState,
} from "@/utils/firebaseRealtime";
import { playClickSound, playVoteSound, playSuccessSound, playFailSound, playTickSound } from "@/utils/sound";
import { botNominateSquad, botCastVote, botChooseMissionAction, botIdentifyMirMadan } from "@/utils/botAI";
import confetti from "canvas-confetti";

interface GameContextType {
  gameState: GameState | null;
  localPlayer: Player | null;
  isHost: boolean;
  roomCode: string;
  isHotseat: boolean;
  nightVision: NightVision | null;
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";
  errorMessage: string | null;

  // Actions
  createRoom: (hostName: string, settings: GameSettings, isHotseatMode?: boolean, botCount?: number) => void;
  joinRoom: (code: string, playerName: string) => void;
  leaveRoom: () => void;
  dispatchAction: (action: ClientAction) => void;
  setLocalPlayerId: (id: string) => void; // for hotseat player switching
}

const GameContext = createContext<GameContextType | undefined>(undefined);

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [localPlayerId, setLocalPlayerIdState] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string>("");
  const [isHotseat, setIsHotseat] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cached secret character and night vision for local player
  const [localSecret, setLocalSecret] = useState<{ character: any; vision: NightVision } | null>(null);

  const gameStateRef = useRef<GameState | null>(null);
  gameStateRef.current = gameState;

  const localPlayerIdRef = useRef<string>("");
  localPlayerIdRef.current = localPlayerId;

  const roomCodeRef = useRef<string>("");
  roomCodeRef.current = roomCode;

  const isHostRef = useRef<boolean>(false);
  const hostIntervalsRef = useRef<{
    actionsInterval?: NodeJS.Timeout;
    heartbeatInterval?: NodeJS.Timeout;
    clientHeartbeat?: NodeJS.Timeout;
    stateUnsub?: () => void;
  }>({});

  const processedActionsRef = useRef<Set<string>>(new Set());

  // Find local player and merge with private secret character if available
  const rawLocalPlayer = gameState?.players.find((p) => p.id === localPlayerId) || null;
  const localPlayer = rawLocalPlayer
    ? {
        ...rawLocalPlayer,
        character: rawLocalPlayer.character || localSecret?.character,
        faction: rawLocalPlayer.faction || localSecret?.character?.faction,
      }
    : null;

  const isHost = localPlayer?.isHost ?? false;
  isHostRef.current = isHost;

  // Compute or read night vision for current local player
  const nightVision =
    localSecret?.vision ||
    (localPlayer && gameState?.players ? computeNightVision(localPlayer, gameState.players) : null);

  // Broadcast state to Firebase
  const broadcastState = useCallback((state: GameState) => {
    const safeState = normalizeGameState(state);
    setGameState(safeState);

    if (isHotseat) return;

    const currentCode = safeState.roomCode || roomCodeRef.current;
    if (!currentCode) return;

    // Publish public state to Firebase
    setRoomState(currentCode, safeState).catch(console.error);
  }, [isHotseat]);

  // Fetch private secret whenever phase transitions to NIGHT or GAME_OVER
  useEffect(() => {
    if (!roomCode || isHotseat || !localPlayerId || isHost) return;
    if (gameState?.phase && gameState.phase !== "LOBBY") {
      if (!localSecret) {
        getPlayerSecret(roomCode, localPlayerId).then((secret) => {
          if (secret) {
            setLocalSecret(secret);
          }
        });
      }
    }
  }, [roomCode, isHotseat, localPlayerId, isHost, gameState?.phase, localSecret]);

  // Host Action Reducer
  const handleHostAction = useCallback(
    (action: ClientAction) => {
      const current = gameStateRef.current;
      if (!current) return;

      switch (action.type) {
        case "UPDATE_SETTINGS": {
          if (current.phase !== "LOBBY") return;
          const updated: GameState = {
            ...current,
            settings: { ...current.settings, ...action.settings },
          };
          broadcastState(updated);
          break;
        }

        case "START_GAME": {
          if (current.phase !== "LOBBY") return;
          if (current.players.length !== current.settings.playerCount) {
            alert(`Requires exactly ${current.settings.playerCount} players! Current: ${current.players.length}`);
            return;
          }

          // Assign roles
          const assignedPlayers = assignCharacters(current.players, current.settings);
          const firstSenapatiIndex = Math.floor(Math.random() * assignedPlayers.length);

          // Save secrets in Firebase for each player so client can inspect their own role only
          if (!isHotseat) {
            const currentCode = current.roomCode || roomCodeRef.current;
            assignedPlayers.forEach((p) => {
              if (p.isBot) return;
              const vision = computeNightVision(p, assignedPlayers);
              setPlayerSecret(currentCode, p.id, {
                character: p.character,
                vision,
              }).catch(console.error);
            });
          }

          // For public state, hide characters unless Game Over
          const publicPlayers = assignedPlayers.map((p) => ({
            ...p,
            character: undefined, // Hidden in public state
            faction: undefined,   // Hidden in public state
          }));

          // Set host's local secret
          const hostAssigned = assignedPlayers.find((p) => p.isHost);
          if (hostAssigned) {
            setLocalSecret({
              character: hostAssigned.character,
              vision: computeNightVision(hostAssigned, assignedPlayers),
            });
          }

          const updated: GameState = {
            ...current,
            phase: "NIGHT",
            players: publicPlayers,
            currentSenapatiIndex: firstSenapatiIndex,
            currentChapter: 0,
            failedVoteCount: 0,
            nominatedPlayerIds: [],
            chapterOutcomes: [null, null, null, null, null],
            history: [],
            timerRemaining: null,
            timerActive: false,
          };
          playClickSound();
          broadcastState(updated);
          break;
        }

        case "ACKNOWLEDGE_NIGHT": {
          if (current.phase !== "NIGHT") return;
          const updatedPlayers = current.players.map((p) =>
            p.id === action.playerId ? { ...p, hasAcknowledgedNight: true } : p
          );
          const allAcknowledged = updatedPlayers.every((p) => p.hasAcknowledgedNight);

          const updated: GameState = {
            ...current,
            players: updatedPlayers,
            phase: allAcknowledged ? "NOMINATION" : "NIGHT",
            timerRemaining: allAcknowledged && current.settings.useTimers ? current.settings.nominationTimeSeconds : null,
            timerActive: allAcknowledged && current.settings.useTimers,
          };
          playClickSound();
          broadcastState(updated);
          break;
        }

        case "TOGGLE_NOMINATION": {
          if (current.phase !== "NOMINATION") return;
          const targetId = action.playerId;
          const requiredSquadSize =
            SQUAD_SIZES[current.settings.playerCount]?.[current.currentChapter] || 2;
          let selected = [...current.nominatedPlayerIds];

          if (selected.includes(targetId)) {
            selected = selected.filter((id) => id !== targetId);
          } else {
            if (selected.length < requiredSquadSize) {
              selected.push(targetId);
            }
          }

          playClickSound();
          broadcastState({
            ...current,
            nominatedPlayerIds: selected,
          });
          break;
        }

        case "CONFIRM_NOMINATION": {
          if (current.phase !== "NOMINATION") return;
          const requiredSquadSize =
            SQUAD_SIZES[current.settings.playerCount]?.[current.currentChapter] || 2;
          if (current.nominatedPlayerIds.length !== requiredSquadSize) return;

          const clearedPlayers = current.players.map((p) => ({ ...p, vote: null }));
          playVoteSound();
          broadcastState({
            ...current,
            players: clearedPlayers,
            phase: "VOTING",
            timerRemaining: current.settings.useTimers ? current.settings.votingTimeSeconds : null,
            timerActive: current.settings.useTimers,
          });
          break;
        }

        case "CAST_VOTE": {
          if (current.phase !== "VOTING") return;
          const updatedPlayers = current.players.map((p) =>
            p.id === action.playerId ? { ...p, vote: action.vote } : p
          );
          const allVoted = updatedPlayers.every((p) => p.vote !== null);

          if (!allVoted) {
            playVoteSound();
            broadcastState({
              ...current,
              players: updatedPlayers,
            });
            return;
          }

          // All votes in! Determine outcome
          const yesVotes = updatedPlayers.filter((p) => p.vote === "YES").length;
          const noVotes = updatedPlayers.filter((p) => p.vote === "NO").length;
          const votePassed = yesVotes > noVotes;

          if (votePassed) {
            playSuccessSound();
            broadcastState({
              ...current,
              players: updatedPlayers,
              phase: "VOTE_REVEAL",
              failedVoteCount: 0,
              timerActive: false,
            });
          } else {
            playFailSound();
            const newFailedCount = current.failedVoteCount + 1;
            const nextSenapati = (current.currentSenapatiIndex + 1) % current.players.length;

            if (newFailedCount >= 5) {
              broadcastState({
                ...current,
                players: updatedPlayers,
                phase: "GAME_OVER",
                failedVoteCount: 5,
                winner: "EIC",
                winReason: "একটানা ৫ বার কমিটি গঠন ব্যর্থ হওয়ায় মসনদে অরাজকতা সৃষ্টি হয়েছে — কোম্পানি বিজয়ী!",
                timerActive: false,
              });
            } else {
              broadcastState({
                ...current,
                players: updatedPlayers,
                phase: "VOTE_REVEAL",
                failedVoteCount: newFailedCount,
                currentSenapatiIndex: nextSenapati,
                timerActive: false,
              });
            }
          }
          break;
        }

        case "CONTINUE_AFTER_VOTE": {
          if (current.phase !== "VOTE_REVEAL") return;
          const yesVotes = current.players.filter((p) => p.vote === "YES").length;
          const noVotes = current.players.filter((p) => p.vote === "NO").length;
          const votePassed = yesVotes > noVotes;

          if (votePassed) {
            const clearedPlayers = current.players.map((p) => ({ ...p, chapterAction: null }));
            broadcastState({
              ...current,
              players: clearedPlayers,
              phase: "MISSION",
              timerRemaining: current.settings.useTimers ? 60 : null,
              timerActive: current.settings.useTimers,
            });
          } else {
            broadcastState({
              ...current,
              nominatedPlayerIds: [],
              phase: "NOMINATION",
              timerRemaining: current.settings.useTimers ? current.settings.nominationTimeSeconds : null,
              timerActive: current.settings.useTimers,
            });
          }
          break;
        }

        case "SUBMIT_MISSION_ACTION": {
          if (current.phase !== "MISSION") return;
          if (!current.nominatedPlayerIds.includes(action.playerId)) return;

          const updatedPlayers = current.players.map((p) =>
            p.id === action.playerId ? { ...p, chapterAction: action.action } : p
          );

          const squadPlayers = updatedPlayers.filter((p) =>
            current.nominatedPlayerIds.includes(p.id)
          );
          const allSubmitted = squadPlayers.every((p) => p.chapterAction !== null);

          if (!allSubmitted) {
            playVoteSound();
            broadcastState({
              ...current,
              players: updatedPlayers,
            });
            return;
          }

          // All submitted! Evaluate Chapter outcome
          const submittedActions = squadPlayers.map((p) => p.chapterAction as "SUCCESS" | "FAIL");
          const { passed, failCount, successCount } = checkChapterSuccess(
            current.currentChapter,
            current.settings.playerCount,
            submittedActions
          );

          const updatedOutcomes = [...current.chapterOutcomes];
          updatedOutcomes[current.currentChapter] = passed ? "NAWAB" : "EIC";

          const votesRecord: Record<string, "YES" | "NO"> = {};
          current.players.forEach((p) => {
            if (p.vote) votesRecord[p.id] = p.vote;
          });

          const historyEntry: ChapterHistory = {
            chapterIndex: current.currentChapter,
            squadSize: current.nominatedPlayerIds.length,
            failsRequired: current.currentChapter === 3 && current.settings.playerCount >= 7 ? 2 : 1,
            senapatiId: current.players[current.currentSenapatiIndex].id,
            nominatedPlayerIds: [...current.nominatedPlayerIds],
            votes: votesRecord,
            votePassed: true,
            successCount,
            failCount,
            chapterPassed: passed,
          };

          const nawabWins = updatedOutcomes.filter((o) => o === "NAWAB").length;
          const eicWins = updatedOutcomes.filter((o) => o === "EIC").length;
          const nextSenapati = (current.currentSenapatiIndex + 1) % current.players.length;

          if (eicWins >= 3) {
            playFailSound();
            broadcastState({
              ...current,
              chapterOutcomes: updatedOutcomes,
              history: [...current.history, historyEntry],
              phase: "GAME_OVER",
              winner: "EIC",
              winReason: "ইস্ট ইন্ডিয়া কোম্পানি ৩টি অধ্যায়ে নাশকতা চালিয়ে মসনদ দখল করেছে!",
              timerActive: false,
            });
          } else if (nawabWins >= 3) {
            confetti({ particleCount: 80, spread: 60 });
            playSuccessSound();
            broadcastState({
              ...current,
              chapterOutcomes: updatedOutcomes,
              history: [...current.history, historyEntry],
              phase: "ASSASSINATION",
              timerRemaining: current.settings.useTimers ? current.settings.assassinationTimeSeconds : null,
              timerActive: current.settings.useTimers,
            });
          } else {
            if (passed) playSuccessSound();
            else playFailSound();

            broadcastState({
              ...current,
              currentChapter: current.currentChapter + 1,
              currentSenapatiIndex: nextSenapati,
              nominatedPlayerIds: [],
              chapterOutcomes: updatedOutcomes,
              history: [...current.history, historyEntry],
              phase: "NOMINATION",
              timerRemaining: current.settings.useTimers ? current.settings.nominationTimeSeconds : null,
              timerActive: current.settings.useTimers,
            });
          }
          break;
        }

        case "MIR_JAFAR_ASSASSINATE": {
          if (current.phase !== "ASSASSINATION") return;
          const targetPlayer = current.players.find((p) => p.id === action.targetPlayerId);
          const isMirMadan = targetPlayer?.character?.id === "mir_madan" || localSecret?.character?.id === "mir_madan";

          if (isMirMadan) {
            playFailSound();
            broadcastState({
              ...current,
              assassinationTargetId: action.targetPlayerId,
              assassinationResult: true,
              phase: "GAME_OVER",
              winner: "EIC",
              winReason: `মীর জাফর সফলভাবে মীর মদন (${targetPlayer?.name})-কে হত্যা করেছে! ইতিহাস পুনরাবৃত্তি হলো — কোম্পানি বিজয়ী!`,
              timerActive: false,
            });
          } else {
            playSuccessSound();
            confetti({ particleCount: 150, spread: 80 });
            broadcastState({
              ...current,
              assassinationTargetId: action.targetPlayerId,
              assassinationResult: false,
              phase: "GAME_OVER",
              winner: "NAWAB",
              winReason: `মীর জাফরের চক্রান্ত ব্যর্থ হয়েছে! লক্ষ্যবস্তু ছিল (${targetPlayer?.name}), মীর মদন নয়। নবাবের বিশ্বস্ত বাহিনী বাংলাকে রক্ষা করেছে!`,
              timerActive: false,
            });
          }
          break;
        }

        case "ADD_BOT": {
          if (current.phase !== "LOBBY") return;
          if (current.players.length >= current.settings.playerCount) return;
          const botNames = ["Alex (Bot)", "Jordan (Bot)", "Taylor (Bot)", "Morgan (Bot)", "Sam (Bot)", "Chris (Bot)", "Casey (Bot)", "Riley (Bot)", "Jamie (Bot)"];
          const newBot: Player = {
            id: "bot_" + Math.random().toString(36).substring(2, 8),
            name: botNames[current.players.length - 1] || `Bot ${current.players.length}`,
            isHost: false,
            isBot: true,
            avatarIndex: current.players.length,
            isConnected: true,
          };
          playClickSound();
          broadcastState({
            ...current,
            players: [...current.players, newBot],
          });
          break;
        }

        case "REMOVE_BOT": {
          if (current.phase !== "LOBBY") return;
          const filtered = current.players.filter((p) => p.id !== action.botId);
          playClickSound();
          broadcastState({
            ...current,
            players: filtered,
          });
          break;
        }

        case "FILL_BOTS": {
          if (current.phase !== "LOBBY") return;
          const needed = current.settings.playerCount - current.players.length;
          if (needed <= 0) return;
          const botNames = ["Alex (Bot)", "Jordan (Bot)", "Taylor (Bot)", "Morgan (Bot)", "Sam (Bot)", "Chris (Bot)", "Casey (Bot)", "Riley (Bot)", "Jamie (Bot)"];
          const addedBots: Player[] = [];
          for (let i = 0; i < needed; i++) {
            addedBots.push({
              id: "bot_" + Math.random().toString(36).substring(2, 8),
              name: botNames[current.players.length + i - 1] || `Bot ${current.players.length + i}`,
              isHost: false,
              isBot: true,
              avatarIndex: current.players.length + i,
              isConnected: true,
            });
          }
          playClickSound();
          broadcastState({
            ...current,
            players: [...current.players, ...addedBots],
          });
          break;
        }

        case "REMATCH": {
          if (current.phase !== "GAME_OVER") return;
          const resetPlayers = current.players.map((p) => ({
            id: p.id,
            name: p.name,
            isHost: p.isHost,
            avatarIndex: p.avatarIndex,
            isBot: p.isBot,
            isConnected: true,
          }));
          setLocalSecret(null);
          playClickSound();
          broadcastState({
            ...current,
            phase: "LOBBY",
            players: resetPlayers,
            currentChapter: 0,
            failedVoteCount: 0,
            nominatedPlayerIds: [],
            chapterOutcomes: [null, null, null, null, null],
            history: [],
            winner: undefined,
            winReason: undefined,
            timerRemaining: null,
            timerActive: false,
          });
          break;
        }
      }
    },
    [broadcastState, isHotseat]
  );

  // Timer interval on Host
  useEffect(() => {
    if (!isHost || !gameState?.timerActive || gameState.timerRemaining === null) return;

    const interval = setInterval(() => {
      setGameState((prev) => {
        if (!prev || !prev.timerActive || prev.timerRemaining === null) return prev;
        if (prev.timerRemaining <= 1) {
          playTickSound();
          return {
            ...prev,
            timerRemaining: 0,
            timerActive: false,
          };
        }
        if (prev.timerRemaining <= 10) {
          playTickSound();
        }
        return {
          ...prev,
          timerRemaining: prev.timerRemaining - 1,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isHost, gameState?.timerActive, gameState?.timerRemaining]);

  // Automated Bot Decisions Controller (Runs on Host or Hotseat)
  useEffect(() => {
    if ((!isHost && !isHotseat) || !gameState) return;

    // 1. NIGHT PHASE: Bot Acknowledgment
    if (gameState.phase === "NIGHT") {
      const unackedBot = gameState.players.find((p) => p.isBot && !p.hasAcknowledgedNight);
      if (unackedBot) {
        const timer = setTimeout(() => {
          handleHostAction({
            type: "ACKNOWLEDGE_NIGHT",
            playerId: unackedBot.id,
          });
        }, 900 + Math.random() * 600);
        return () => clearTimeout(timer);
      }
    }

    // 2. NOMINATION PHASE: If Senapati is a Bot
    if (gameState.phase === "NOMINATION") {
      const currentSenapati = gameState.players[gameState.currentSenapatiIndex];
      const requiredSize =
        SQUAD_SIZES[gameState.settings.playerCount]?.[gameState.currentChapter] || 2;

      if (currentSenapati?.isBot) {
        if (gameState.nominatedPlayerIds.length !== requiredSize) {
          const timer = setTimeout(() => {
            const nominated = botNominateSquad(currentSenapati, gameState);
            broadcastState({
              ...gameState,
              nominatedPlayerIds: nominated,
            });
          }, 1400);
          return () => clearTimeout(timer);
        } else {
          const timer = setTimeout(() => {
            handleHostAction({ type: "CONFIRM_NOMINATION" });
          }, 1000);
          return () => clearTimeout(timer);
        }
      }
    }

    // 3. VOTING PHASE: Bots cast votes
    if (gameState.phase === "VOTING") {
      const unvotedBot = gameState.players.find((p) => p.isBot && p.vote === null);
      if (unvotedBot) {
        const timer = setTimeout(() => {
          const vote = botCastVote(unvotedBot, gameState);
          handleHostAction({
            type: "CAST_VOTE",
            playerId: unvotedBot.id,
            vote,
          });
        }, 700 + Math.random() * 1000);
        return () => clearTimeout(timer);
      }
    }

    // 4. MISSION PHASE: Bots in squad submit actions
    if (gameState.phase === "MISSION") {
      const unsubmittedBot = gameState.players.find(
        (p) =>
          p.isBot &&
          gameState.nominatedPlayerIds.includes(p.id) &&
          p.chapterAction === null
      );
      if (unsubmittedBot) {
        const timer = setTimeout(() => {
          const action = botChooseMissionAction(unsubmittedBot, gameState);
          handleHostAction({
            type: "SUBMIT_MISSION_ACTION",
            playerId: unsubmittedBot.id,
            action,
          });
        }, 1000 + Math.random() * 1200);
        return () => clearTimeout(timer);
      }
    }

    // 5. ASSASSINATION PHASE: Mir Jafar Bot identifies Mir Madan
    if (gameState.phase === "ASSASSINATION") {
      const mirJafar = gameState.players.find((p) => p.character?.id === "mir_jafar");
      if (mirJafar?.isBot) {
        const timer = setTimeout(() => {
          const targetId = botIdentifyMirMadan(gameState);
          handleHostAction({
            type: "MIR_JAFAR_ASSASSINATE",
            targetPlayerId: targetId,
          });
        }, 2800);
        return () => clearTimeout(timer);
      }
    }
  }, [isHost, isHotseat, gameState, handleHostAction, broadcastState]);

  // Dispatch Action
  const dispatchAction = useCallback(
    (action: ClientAction) => {
      if (isHost || isHotseat) {
        handleHostAction(action);
      } else {
        const code = roomCodeRef.current;
        if (code) {
          playClickSound();
          pushAction(code, action).catch(console.error);
        }
      }
    },
    [isHost, isHotseat, handleHostAction]
  );

  // Helper to cleanup all active polling/intervals
  const clearAllIntervals = useCallback(() => {
    if (hostIntervalsRef.current.actionsInterval) clearInterval(hostIntervalsRef.current.actionsInterval);
    if (hostIntervalsRef.current.heartbeatInterval) clearInterval(hostIntervalsRef.current.heartbeatInterval);
    if (hostIntervalsRef.current.clientHeartbeat) clearInterval(hostIntervalsRef.current.clientHeartbeat);
    if (hostIntervalsRef.current.stateUnsub) hostIntervalsRef.current.stateUnsub();
    hostIntervalsRef.current = {};
    processedActionsRef.current.clear();
  }, []);

  // Initialize Room (Host)
  const createRoom = useCallback(
    async (hostName: string, settings: GameSettings, isHotseatMode = false, botCount = 0) => {
      clearAllIntervals();
      setLocalSecret(null);
      const code = generateRoomCode();
      const hostId = "player_" + Math.random().toString(36).substring(2, 9);
      setRoomCode(code);
      roomCodeRef.current = code;
      setLocalPlayerIdState(hostId);
      localPlayerIdRef.current = hostId;
      setIsHotseat(isHotseatMode);

      const initialPlayers: Player[] = [
        {
          id: hostId,
          name: hostName.trim() || "Player 1",
          isHost: true,
          avatarIndex: 0,
          isConnected: true,
        },
      ];

      // If initial bot count is specified in regular online mode
      if (!isHotseatMode && botCount > 0) {
        const botNames = ["Alex (Bot)", "Jordan (Bot)", "Taylor (Bot)", "Morgan (Bot)", "Sam (Bot)", "Chris (Bot)", "Casey (Bot)", "Riley (Bot)", "Jamie (Bot)"];
        const numBots = Math.min(botCount, settings.playerCount - 1);
        for (let i = 0; i < numBots; i++) {
          initialPlayers.push({
            id: "bot_" + Math.random().toString(36).substring(2, 8),
            name: botNames[i] || `Bot ${i + 1}`,
            isHost: false,
            isBot: true,
            avatarIndex: i + 1,
            isConnected: true,
          });
        }
      }

      // In hotseat mode, pre-populate dummy players
      if (isHotseatMode) {
        const neutralNames = ["Alex", "Jordan", "Taylor", "Morgan", "Sam", "Chris", "Casey", "Riley", "Jamie"];
        for (let i = 1; i < settings.playerCount; i++) {
          initialPlayers.push({
            id: `hotseat_${i + 1}`,
            name: neutralNames[i - 1] || `Player ${i + 1}`,
            isHost: false,
            avatarIndex: i,
            isConnected: true,
          });
        }
      }

      const state: GameState = normalizeGameState({
        roomCode: code,
        settings,
        phase: "LOBBY",
        players: initialPlayers,
        currentSenapatiIndex: 0,
        nominatedPlayerIds: [],
        failedVoteCount: 0,
        currentChapter: 0,
        chapterOutcomes: [null, null, null, null, null],
        history: [],
        timerRemaining: null,
        timerActive: false,
      });

      setGameState(state);
      setConnectionStatus("connected");
      setErrorMessage(null);

      if (!isHotseatMode) {
        // Save initial Room State directly to Firebase
        await setRoomState(code, state);

        // Host subscribes to Room State
        const unsub = subscribeToRoomState(
          code,
          (remoteState) => {
            setGameState((prev) => {
              if (!prev) return remoteState;
              // If new player joined, play sound
              if (remoteState.players.length > prev.players.length) {
                playClickSound();
              }
              return remoteState;
            });
          },
          () => {
            setConnectionStatus("disconnected");
          }
        );
        hostIntervalsRef.current.stateUnsub = unsub;

        // Host heartbeat loop
        hostIntervalsRef.current.clientHeartbeat = setInterval(() => {
          sendHeartbeat(code, hostId).catch(console.error);
        }, 3500);

        // Host Actions Consumer Loop (processes non-host actions like votes, missions)
        hostIntervalsRef.current.actionsInterval = setInterval(async () => {
          const actions = await getActions(code);
          if (actions) {
            for (const [key, item] of Object.entries(actions)) {
              if (!processedActionsRef.current.has(key)) {
                processedActionsRef.current.add(key);

                if ((item as any).type === "PLAYER_LEFT") {
                  const current = gameStateRef.current;
                  if (current) {
                    const leftId = (item as any).playerId;
                    if (current.phase === "LOBBY") {
                      const filtered = current.players.filter((p) => p.id !== leftId);
                      broadcastState({ ...current, players: filtered });
                    } else {
                      const updated = current.players.map((p) =>
                        p.id === leftId ? { ...p, isConnected: false } : p
                      );
                      broadcastState({ ...current, players: updated });
                    }
                  }
                } else {
                  handleHostAction(item as ClientAction);
                }

                await deleteAction(code, key);
              }
            }
          }
        }, 600);

        // Host Presence / Heartbeats check
        hostIntervalsRef.current.heartbeatInterval = setInterval(async () => {
          const heartbeats = await getHeartbeats(code);
          const current = gameStateRef.current;
          if (heartbeats && current) {
            const now = Date.now();
            let changed = false;
            const updated = current.players.map((p) => {
              if (p.isBot || p.isHost) return p;
              const lastSeen = heartbeats[p.id] || 0;
              const isAlive = lastSeen > 0 && now - lastSeen <= 12000;
              if (p.isConnected !== isAlive) {
                changed = true;
                return { ...p, isConnected: isAlive };
              }
              return p;
            });

            if (changed) {
              broadcastState({ ...current, players: updated });
            }
          }
        }, 4000);
      }
    },
    [broadcastState, handleHostAction, clearAllIntervals]
  );

  // Join Room (Client) - Instant direct joining with fallback polling
  const joinRoom = useCallback(
    async (code: string, playerName: string) => {
      clearAllIntervals();
      setLocalSecret(null);
      const formattedCode = code.trim().toUpperCase();
      setRoomCode(formattedCode);
      roomCodeRef.current = formattedCode;
      setConnectionStatus("connecting");
      setErrorMessage("রুমে প্রবেশের চেষ্টা করা হচ্ছে...");

      try {
        const existingState = await getRoomState(formattedCode);
        if (!existingState) {
          setConnectionStatus("error");
          setErrorMessage(`রুম কোড "${formattedCode}" খুঁজে পাওয়া যায়নি। হোস্ট কি রুমে অপেক্ষা করছেন?`);
          return;
        }

        if (existingState.phase !== "LOBBY") {
          // Check if reconnecting
          const existing = existingState.players.find(
            (p) => p.name.toLowerCase() === playerName.trim().toLowerCase()
          );
          if (!existing) {
            setConnectionStatus("error");
            setErrorMessage("খেলাটি ইতিমধ্যেই শুরু হয়ে গেছে!");
            return;
          }
        }

        if (
          existingState.players.length >= existingState.settings.playerCount &&
          !existingState.players.some((p) => p.name.toLowerCase() === playerName.trim().toLowerCase())
        ) {
          setConnectionStatus("error");
          setErrorMessage("রুমটি ইতিমধ্যেই পূর্ণ হয়ে গেছে!");
          return;
        }

        const clientId = "player_" + Math.random().toString(36).substring(2, 9);
        setLocalPlayerIdState(clientId);
        localPlayerIdRef.current = clientId;

        // Directly register player in the room state
        const newPlayer: Player = {
          id: clientId,
          name: playerName.trim() || `Player ${existingState.players.length + 1}`,
          avatarIndex: Math.floor(Math.random() * 6),
          isHost: false,
          isConnected: true,
        };

        const updatedPlayers = [...existingState.players, newPlayer];
        await updateRoomPlayers(formattedCode, updatedPlayers);

        // Optimistically update local view
        setGameState({ ...existingState, players: updatedPlayers });
        setConnectionStatus("connected");
        setErrorMessage(null);
        playClickSound();

        // Start client heartbeat
        sendHeartbeat(formattedCode, clientId).catch(console.error);
        hostIntervalsRef.current.clientHeartbeat = setInterval(() => {
          sendHeartbeat(formattedCode, clientId).catch(console.error);
        }, 3500);

        // Subscribe to live Room State updates from Firebase
        const unsub = subscribeToRoomState(
          formattedCode,
          (state) => {
            setGameState(state);
            setConnectionStatus("connected");
            setErrorMessage(null);
          },
          () => {
            setConnectionStatus("disconnected");
            setErrorMessage("হোস্ট রুম বন্ধ করেছেন অথবা সংযোগ বিচ্ছিন্ন হয়েছে।");
          }
        );
        hostIntervalsRef.current.stateUnsub = unsub;

        // Auto-cleanup on window unload
        const handleUnload = () => {
          removeHeartbeat(formattedCode, clientId);
          pushAction(formattedCode, {
            type: "JOIN_ROOM" as any,
            playerId: clientId,
            type_override: "PLAYER_LEFT",
          } as any);
        };
        window.addEventListener("beforeunload", handleUnload);
      } catch (err: any) {
        console.error("Join room failed:", err);
        setConnectionStatus("error");
        setErrorMessage("সংযোগ ব্যর্থ হয়েছে: " + (err.message || "Unknown error"));
      }
    },
    [clearAllIntervals]
  );

  // Leave Room
  const leaveRoom = useCallback(async () => {
    const code = roomCodeRef.current;
    const myId = localPlayerIdRef.current;
    const amHost = isHostRef.current;

    clearAllIntervals();

    if (code && !isHotseat) {
      if (amHost) {
        await deleteRoom(code).catch(console.error);
      } else {
        await removeHeartbeat(code, myId).catch(console.error);
        await pushAction(code, {
          type: "JOIN_ROOM" as any,
          playerId: myId,
          type_override: "PLAYER_LEFT",
        } as any).catch(console.error);

        // Also remove player from room if in LOBBY
        const curr = gameStateRef.current;
        if (curr && curr.phase === "LOBBY") {
          const filtered = curr.players.filter((p) => p.id !== myId);
          await updateRoomPlayers(code, filtered).catch(console.error);
        }
      }
    }

    setGameState(null);
    setRoomCode("");
    roomCodeRef.current = "";
    setLocalPlayerIdState("");
    localPlayerIdRef.current = "";
    setLocalSecret(null);
    setConnectionStatus("disconnected");
    setIsHotseat(false);
    setErrorMessage(null);
  }, [clearAllIntervals, isHotseat]);

  return (
    <GameContext.Provider
      value={{
        gameState,
        localPlayer,
        isHost,
        roomCode,
        isHotseat,
        nightVision,
        connectionStatus,
        errorMessage,
        createRoom,
        joinRoom,
        leaveRoom,
        dispatchAction,
        setLocalPlayerId: setLocalPlayerIdState,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
