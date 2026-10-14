"use client";

import React, { useState } from "react";
import { useGame } from "@/context/GameContext";
import { Users, ArrowRight, Shield, Check, Clock, Eye, Crown, Swords } from "lucide-react";

export const PassAndPlayBar: React.FC = () => {
  const { gameState, localPlayer, setLocalPlayerId, isHotseat } = useGame();
  const [privacyHidden, setPrivacyHidden] = useState(false);

  if (!isHotseat || !gameState || gameState.phase === "LOBBY" || gameState.phase === "GAME_OVER") {
    return null;
  }

  const currentSenapati = gameState.players[gameState.currentSenapatiIndex];
  const currentIndex = gameState.players.findIndex((p) => p.id === localPlayer?.id);

  // Switch to specific player
  const handleSelectPlayer = (id: string) => {
    setLocalPlayerId(id);
    setPrivacyHidden(false);
  };

  // Switch to next player who needs to act
  const handlePassToNext = () => {
    const total = gameState.players.length;
    // Find next player needing an action based on phase
    let nextIndex = (currentIndex + 1) % total;

    if (gameState.phase === "VOTING") {
      const nextUnvoted = gameState.players.find((p, idx) => idx > currentIndex && p.vote === null)
        || gameState.players.find((p) => p.vote === null);
      if (nextUnvoted) {
        nextIndex = gameState.players.findIndex((p) => p.id === nextUnvoted.id);
      }
    } else if (gameState.phase === "MISSION") {
      const nominatedPlayers = gameState.players.filter((p) =>
        gameState.nominatedPlayerIds.includes(p.id)
      );
      const nextUnsubmitted = nominatedPlayers.find((p) => p.chapterAction === null);
      if (nextUnsubmitted) {
        nextIndex = gameState.players.findIndex((p) => p.id === nextUnsubmitted.id);
      }
    } else if (gameState.phase === "NIGHT") {
      const nextUnacked = gameState.players.find((p) => !p.hasAcknowledgedNight);
      if (nextUnacked) {
        nextIndex = gameState.players.findIndex((p) => p.id === nextUnacked.id);
      }
    }

    const nextPlayer = gameState.players[nextIndex];
    if (nextPlayer) {
      setLocalPlayerId(nextPlayer.id);
      setPrivacyHidden(true); // Privacy curtain so next person taps to reveal their screen
    }
  };

  return (
    <div className="w-full bg-slate-900/95 border-2 border-purple-500/50 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-md space-y-3">
      {/* Top Banner: Current Turn & Next Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-400 flex items-center justify-center text-purple-300 font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
              Pass & Play (হাতবদল মোড)
            </div>
            <div className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
              <span>ডিভাইস এখন:</span>
              <span className="text-amber-400 underline decoration-purple-500 underline-offset-4">
                {localPlayer?.name}
              </span>
              {localPlayer?.id === currentSenapati?.id && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-600/40 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" /> সেনাপতি
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Privacy Curtain Toggle */}
          <button
            onClick={() => setPrivacyHidden(!privacyHidden)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>{privacyHidden ? "স্ক্রিন উন্মোচন করুন" : "স্ক্রিন লুকান (Privacy)"}</span>
          </button>

          {/* Quick Pass to Next Player */}
          <button
            onClick={handlePassToNext}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-purple-950/60 cursor-pointer transition-all hover:scale-105"
          >
            <span>পরবর্তী খেলোয়াড়কে দিন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Player Switcher Chips */}
      <div>
        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">
          সরাসরি খেলোয়াড় নির্বাচন করুন (ক্লিক করুন):
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {gameState.players.map((p, idx) => {
            const isActive = p.id === localPlayer?.id;
            const isSenapati = p.id === currentSenapati?.id;
            const isSquad = gameState.nominatedPlayerIds.includes(p.id);

            // Check if player has completed action for current phase
            let hasActed = false;
            let needsAction = false;
            if (gameState.phase === "VOTING") {
              hasActed = p.vote !== null;
              needsAction = !hasActed;
            } else if (gameState.phase === "MISSION") {
              if (isSquad) {
                hasActed = p.chapterAction !== null && p.chapterAction !== undefined;
                needsAction = !hasActed;
              }
            } else if (gameState.phase === "NIGHT") {
              hasActed = !!p.hasAcknowledgedNight;
              needsAction = !hasActed;
            }

            return (
              <button
                key={p.id}
                onClick={() => handleSelectPlayer(p.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all cursor-pointer ${
                  isActive
                    ? "bg-purple-950 border-purple-400 text-purple-200 shadow-md ring-2 ring-purple-400/40 scale-105"
                    : "bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-200">
                  {idx + 1}
                </div>

                <div className="text-left">
                  <div className="text-xs font-bold leading-tight flex items-center gap-1">
                    <span>{p.name}</span>
                    {isSenapati && <Crown className="w-3 h-3 text-amber-400 inline" />}
                    {isSquad && <Swords className="w-3 h-3 text-amber-300 inline" />}
                  </div>
                </div>

                {/* Status indicator */}
                {hasActed && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                {needsAction && <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Privacy Curtain Overlay Modal */}
      {privacyHidden && (
        <div className="p-6 bg-slate-950 border-2 border-purple-500 rounded-2xl text-center space-y-3 animate-in fade-in">
          <Shield className="w-12 h-12 text-purple-400 mx-auto" />
          <h4 className="text-lg font-black text-slate-100">
            ডিভাইসটি <span className="text-amber-400">{localPlayer?.name}</span> এর হাতে তুলে দিন
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            আপনার গোপন পরিচয় ও সিদ্ধান্ত সুরক্ষিত রাখতে স্ক্রিনটি আড়াল করা হয়েছে।
          </p>
          <button
            onClick={() => setPrivacyHidden(false)}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-950 cursor-pointer transition-all"
          >
            <Eye className="w-4 h-4 inline mr-1.5" />
            আমি {localPlayer?.name} — স্ক্রিন খুলুন
          </button>
        </div>
      )}
    </div>
  );
};
