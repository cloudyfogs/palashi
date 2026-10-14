"use client";

import React, { useState } from "react";
import { useGame } from "@/context/GameContext";
import { Navbar } from "@/components/Navbar";
import { RulesModal } from "@/components/RulesModal";
import { LobbyView } from "@/components/LobbyView";
import { PassAndPlayBar } from "@/components/PassAndPlayBar";
import { ChapterTracker } from "@/components/ChapterTracker";
import { NightPhaseView } from "@/components/NightPhaseView";
import { DiscussionView } from "@/components/DiscussionView";
import { VotePhaseView } from "@/components/VotePhaseView";
import { ChapterMissionView } from "@/components/ChapterMissionView";
import { AssassinationView } from "@/components/AssassinationView";
import { GameOverModal } from "@/components/GameOverModal";
import { CardView } from "@/components/CardView";
import { Shield, Eye, X } from "lucide-react";

export default function Home() {
  const { gameState, localPlayer, isHotseat } = useGame();
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
      <Navbar onOpenRules={() => setIsRulesOpen(true)} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-5 space-y-4">
        {/* If no game or in lobby */}
        {(!gameState || gameState.phase === "LOBBY") && <LobbyView />}

        {/* If game is actively playing */}
        {gameState && gameState.phase !== "LOBBY" && (
          <div className="space-y-4">
            {/* Prominent Pass & Play Controller Bar (if in Hotseat mode) */}
            {isHotseat && <PassAndPlayBar />}

            {/* 5-Chapter Visual Progression Tracker */}
            <ChapterTracker />

            {/* Dynamic Phase Routing */}
            {gameState.phase === "NIGHT" && <NightPhaseView />}
            {gameState.phase === "NOMINATION" && <DiscussionView />}
            {(gameState.phase === "VOTING" || gameState.phase === "VOTE_REVEAL") && (
              <VotePhaseView />
            )}
            {(gameState.phase === "MISSION" || gameState.phase === "MISSION_REVEAL") && (
              <ChapterMissionView />
            )}
            {gameState.phase === "ASSASSINATION" && <AssassinationView />}
            {gameState.phase === "GAME_OVER" && <GameOverModal />}
          </div>
        )}
      </main>

      {/* Floating "Peek My Card" Button */}
      {gameState && gameState.phase !== "LOBBY" && gameState.phase !== "GAME_OVER" && localPlayer && (
        <div className="fixed bottom-4 right-4 z-30">
          <button
            onClick={() => setIsCardModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900/95 hover:bg-slate-800 border-2 border-emerald-500/70 text-emerald-300 text-xs font-black shadow-2xl backdrop-blur-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>আমার কার্ড দেখুন</span>
          </button>
        </div>
      )}

      {/* Secret Card Popup Modal */}
      {isCardModalOpen && localPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-950 border-2 border-amber-600/60 rounded-3xl max-w-sm w-full p-5 shadow-2xl relative flex flex-col items-center">
            <button
              onClick={() => setIsCardModalOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-black text-amber-300 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
              <Eye className="w-4 h-4 text-amber-400" /> আপনার গোপন কার্ড
            </h3>
            <CardView
              character={localPlayer.character}
              faction={localPlayer.faction}
              isPeekable={true}
            />
          </div>
        </div>
      )}

      {/* Rules Reference Modal */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* Footer */}
      <footer className="py-3 text-center text-[11px] text-slate-600 border-t border-slate-900/60">
        পলাশী (Polashi) — ১৭৫৭ • সামাজিক ডিডাকশন বোর্ড গেম
      </footer>
    </div>
  );
}
