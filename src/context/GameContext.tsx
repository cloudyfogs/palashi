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

const DEFAULT_SETTINGS: GameSettings = {
  playerCount: 5,
  mode: "BASIC",
  useTimers: true,
  nominationTimeSeconds: 180,
  votingTimeSeconds: 60,
  assassinationTimeSeconds: 300,
};

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

  const peerRef = useRef<any>(null);
  const connectionsRef = useRef<Map<string, any>>(new Map());
  const hostConnRef = useRef<any>(null);
  const gameStateRef = useRef<GameState | null>(null);
  gameStateRef.current = gameState;

  const localPlayer = gameState?.players.find((p) => p.id === localPlayerId) || null;
  const isHost = localPlayer?.isHost ?? false;

  // Compute night vision for current local player
  const nightVision =
    localPlayer && gameState?.players
      ? computeNightVision(localPlayer, gameState.players)
      : null;

  // Broadcast state to all connected peers if host
  const broadcastState = useCallback((state: GameState) => {
    setGameState(state);

    if (connectionsRef.current.size > 0) {
      connectionsRef.current.forEach((conn, peerId) => {
        if (conn.open) {
          // Sanitize state for peer: hide secret roles unless GAME_OVER or permitted by vision
          const peerPlayer = state.players.find((p) => p.id === peerId);
          if (!peerPlayer) {
            conn.send({ type: "SYNC_STATE", state });
            return;
          }

          const vision = computeNightVision(peerPlayer, state.players);
          const sanitizedPlayers = state.players.map((p) => {
            const isSelf = p.id === peerPlayer.id;
            const isGameOver = state.phase === "GAME_OVER";
            const isKnownEic = vision.knownConspirators.some((k) => k.id === p.id);
            const isFellowEic = vision.fellowEicMembers.some((k) => k.id === p.id);

            if (isSelf || isGameOver) {
              return p;
            }

            return {
              ...p,
              // Only reveal faction if revealed by vision rules
              faction: isKnownEic || isFellowEic ? p.faction : undefined,
              // Hide specific character card unless game is over
              character: undefined,
              // Hide chapter action submission until reveal
              chapterAction: state.phase === "MISSION_REVEAL" ? p.chapterAction : null,
              // Hide vote until reveal
              vote: state.phase === "VOTE_REVEAL" || state.phase === "GAME_OVER" ? p.vote : null,
            };
          });

          conn.send({
            type: "SYNC_STATE",
            state: {
              ...state,
              players: sanitizedPlayers,
            },
          });
        }
      });
    }
  }, []);

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
          // Pick random First Senapati
          const firstSenapatiIndex = Math.floor(Math.random() * assignedPlayers.length);

          const updated: GameState = {
            ...current,
            phase: "NIGHT",
            players: assignedPlayers,
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

          // Clear previous votes
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

          playVoteSound();
          if (allVoted) {
            broadcastState({
              ...current,
              players: updatedPlayers,
              phase: "VOTE_REVEAL",
              timerActive: false,
            });
          } else {
            broadcastState({
              ...current,
              players: updatedPlayers,
            });
          }
          break;
        }

        case "CONTINUE_AFTER_VOTE": {
          if (current.phase !== "VOTE_REVEAL") return;
          const yesVotes = current.players.filter((p) => p.vote === "YES").length;
          const votePassed = yesVotes > current.players.length / 2;

          if (votePassed) {
            // Team approved! Reset failed vote count and proceed to Chapter Mission
            playSuccessSound();
            const preparedPlayers = current.players.map((p) => ({
              ...p,
              chapterAction: null,
            }));
            broadcastState({
              ...current,
              players: preparedPlayers,
              failedVoteCount: 0,
              phase: "MISSION",
              timerActive: false,
            });
          } else {
            // Team rejected! Move Senapati to next player on left
            playFailSound();
            const newFailedCount = current.failedVoteCount + 1;
            const nextSenapatiIndex = (current.currentSenapatiIndex + 1) % current.players.length;

            const winCheck = checkOverallWinner(current.chapterOutcomes, newFailedCount);
            if (winCheck.winner) {
              broadcastState({
                ...current,
                failedVoteCount: newFailedCount,
                currentSenapatiIndex: nextSenapatiIndex,
                nominatedPlayerIds: [],
                phase: "GAME_OVER",
                winner: winCheck.winner,
                winReason: winCheck.reason,
                timerActive: false,
              });
            } else {
              broadcastState({
                ...current,
                failedVoteCount: newFailedCount,
                currentSenapatiIndex: nextSenapatiIndex,
                nominatedPlayerIds: [],
                phase: "NOMINATION",
                timerRemaining: current.settings.useTimers ? current.settings.nominationTimeSeconds : null,
                timerActive: current.settings.useTimers,
              });
            }
          }
          break;
        }

        case "SUBMIT_MISSION_ACTION": {
          if (current.phase !== "MISSION") return;
          const updatedPlayers = current.players.map((p) =>
            p.id === action.playerId ? { ...p, chapterAction: action.action } : p
          );

          // Check if all nominated players submitted action
          const nominatedDone = current.nominatedPlayerIds.every((id) => {
            const player = updatedPlayers.find((p) => p.id === id);
            return player?.chapterAction !== null && player?.chapterAction !== undefined;
          });

          playClickSound();
          if (nominatedDone) {
            broadcastState({
              ...current,
              players: updatedPlayers,
              phase: "MISSION_REVEAL",
              timerActive: false,
            });
          } else {
            broadcastState({
              ...current,
              players: updatedPlayers,
            });
          }
          break;
        }

        case "CONTINUE_AFTER_MISSION": {
          if (current.phase !== "MISSION_REVEAL") return;
          const squadActions = current.nominatedPlayerIds.map((id) => {
            const p = current.players.find((player) => player.id === id);
            return p?.chapterAction || "SUCCESS";
          });

          const { passed, successCount, failCount, failsRequired } = checkChapterSuccess(
            current.currentChapter,
            current.settings.playerCount,
            squadActions
          );

          const chapterOutcome: "NAWAB" | "EIC" = passed ? "NAWAB" : "EIC";
          if (passed) playSuccessSound();
          else playFailSound();

          const updatedOutcomes = [...current.chapterOutcomes];
          updatedOutcomes[current.currentChapter] = chapterOutcome;

          const historyEntry: ChapterHistory = {
            chapterIndex: current.currentChapter,
            squadSize: current.nominatedPlayerIds.length,
            failsRequired,
            senapatiId: current.players[current.currentSenapatiIndex].id,
            nominatedPlayerIds: current.nominatedPlayerIds,
            votes: current.players.reduce((acc, p) => {
              if (p.vote) acc[p.id] = p.vote;
              return acc;
            }, {} as Record<string, "YES" | "NO">),
            votePassed: true,
            successCount,
            failCount,
            chapterPassed: passed,
          };

          // Count wins
          const nawabWins = updatedOutcomes.filter((o) => o === "NAWAB").length;
          const eicWins = updatedOutcomes.filter((o) => o === "EIC").length;

          // Next Senapati
          const nextSenapati = (current.currentSenapatiIndex + 1) % current.players.length;

          if (eicWins >= 3) {
            // EIC direct win
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
            // Enters ASSASSINATION phase for Mir Jafar!
            confetti({ particleCount: 80, spread: 60 });
            broadcastState({
              ...current,
              chapterOutcomes: updatedOutcomes,
              history: [...current.history, historyEntry],
              phase: "ASSASSINATION",
              timerRemaining: current.settings.useTimers ? current.settings.assassinationTimeSeconds : null,
              timerActive: current.settings.useTimers,
            });
          } else {
            // Next chapter
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
          const isMirMadan = targetPlayer?.character?.id === "mir_madan";

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
          const botNames = [
            "Alex (Bot)",
            "Jordan (Bot)",
            "Taylor (Bot)",
            "Morgan (Bot)",
            "Sam (Bot)",
            "Chris (Bot)",
            "Casey (Bot)",
            "Riley (Bot)",
            "Jamie (Bot)",
          ];
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
          const botNames = [
            "Alex (Bot)",
            "Jordan (Bot)",
            "Taylor (Bot)",
            "Morgan (Bot)",
            "Sam (Bot)",
            "Chris (Bot)",
            "Casey (Bot)",
            "Riley (Bot)",
            "Jamie (Bot)",
          ];
          const addedBots: Player[] = [];
          for (let i = 0; i < needed; i++) {
            const idx = current.players.length + i;
            addedBots.push({
              id: "bot_" + Math.random().toString(36).substring(2, 8),
              name: botNames[idx - 1] || `Bot ${idx}`,
              isHost: false,
              isBot: true,
              avatarIndex: idx,
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
          const resetPlayers = current.players.map((p) => ({
            ...p,
            vote: null,
            chapterAction: null,
            character: undefined,
            faction: undefined,
            hasAcknowledgedNight: false,
          }));

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
    [broadcastState]
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
        if (hostConnRef.current && hostConnRef.current.open) {
          hostConnRef.current.send(action);
        }
      }
    },
    [isHost, isHotseat, handleHostAction]
  );

  // Initialize Room (Host)
  const createRoom = useCallback(
    async (hostName: string, settings: GameSettings, isHotseatMode = false, botCount = 0) => {
      const code = generateRoomCode();
      const hostId = "player_" + Math.random().toString(36).substring(2, 9);
      setRoomCode(code);
      setLocalPlayerIdState(hostId);
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
        const botNames = [
          "Alex (Bot)",
          "Jordan (Bot)",
          "Taylor (Bot)",
          "Morgan (Bot)",
          "Sam (Bot)",
          "Chris (Bot)",
          "Casey (Bot)",
          "Riley (Bot)",
          "Jamie (Bot)",
        ];
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

      // In hotseat mode, pre-populate dummy players up to playerCount for local testing
      if (isHotseatMode) {
        const neutralNames = [
          "Alex",
          "Jordan",
          "Taylor",
          "Morgan",
          "Sam",
          "Chris",
          "Casey",
          "Riley",
          "Jamie",
        ];
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

      const state: GameState = {
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
      };

      setGameState(state);
      setConnectionStatus("connected");

      if (!isHotseatMode) {
        try {
          const { default: Peer } = await import("peerjs");
          const peer = new Peer(`palashi-${code}`);
          peerRef.current = peer;

          peer.on("open", () => {
            setConnectionStatus("connected");
          });

          peer.on("connection", (conn) => {
            conn.on("open", () => {
              connectionsRef.current.set(conn.peer, conn);
            });

            conn.on("data", (data: any) => {
              if (data.type === "JOIN_ROOM") {
                const newPlayer: Player = {
                  id: conn.peer,
                  name: data.player.name,
                  isHost: false,
                  avatarIndex: data.player.avatarIndex,
                  isConnected: true,
                };
                setGameState((prev) => {
                  if (!prev) return prev;
                  if (prev.players.length >= prev.settings.playerCount) {
                    conn.send({ type: "ERROR", message: "Room is full!" });
                    return prev;
                  }
                  const updatedPlayers = [...prev.players, newPlayer];
                  const nextState: GameState = {
                    ...prev,
                    players: updatedPlayers,
                  };
                  broadcastState(nextState);
                  return nextState;
                });
              } else {
                handleHostAction(data as ClientAction);
              }
            });

            conn.on("close", () => {
              connectionsRef.current.delete(conn.peer);
              setGameState((prev) => {
                if (!prev) return prev;
                const updatedPlayers = prev.players.map((p) =>
                  p.id === conn.peer ? { ...p, isConnected: false } : p
                );
                return { ...prev, players: updatedPlayers };
              });
            });
          });

          peer.on("error", (err) => {
            console.error("Peer error:", err);
            setErrorMessage("Connection error: " + err.message);
          });
        } catch (err) {
          console.error("Failed to load PeerJS:", err);
        }
      }
    },
    [broadcastState, handleHostAction]
  );

  // Join Room (Client)
  const joinRoom = useCallback(async (code: string, playerName: string) => {
    const formattedCode = code.trim().toUpperCase();
    setRoomCode(formattedCode);
    setConnectionStatus("connecting");
    setErrorMessage(null);

    try {
      const { default: Peer } = await import("peerjs");
      const clientPeer = new Peer();
      peerRef.current = clientPeer;

      clientPeer.on("open", (clientId) => {
        setLocalPlayerIdState(clientId);
        const conn = clientPeer.connect(`palashi-${formattedCode}`);
        hostConnRef.current = conn;

        conn.on("open", () => {
          setConnectionStatus("connected");
          conn.send({
            type: "JOIN_ROOM",
            player: {
              id: clientId,
              name: playerName.trim() || `Player-${clientId.slice(0, 4)}`,
              avatarIndex: Math.floor(Math.random() * 6),
              isConnected: true,
            },
          });
        });

        conn.on("data", (data: any) => {
          if (data.type === "SYNC_STATE") {
            setGameState(data.state);
          } else if (data.type === "ERROR") {
            setErrorMessage(data.message);
            setConnectionStatus("error");
          }
        });

        conn.on("close", () => {
          setConnectionStatus("disconnected");
          setErrorMessage("Disconnected from Host.");
        });

        conn.on("error", (err) => {
          setConnectionStatus("error");
          setErrorMessage("Connection error: " + err);
        });
      });

      clientPeer.on("error", (err) => {
        setConnectionStatus("error");
        setErrorMessage("Room not found or Host disconnected: " + err.message);
      });
    } catch (err: any) {
      setConnectionStatus("error");
      setErrorMessage("Could not connect to PeerJS network: " + err.message);
    }
  }, []);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    setGameState(null);
    setRoomCode("");
    setConnectionStatus("disconnected");
    setIsHotseat(false);
  }, []);

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
