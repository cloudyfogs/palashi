"use client";

import React from "react";
import { useGame } from "@/context/GameContext";
import { Swords, Flame, Skull, Check, X, ArrowRight, ShieldCheck } from "lucide-react";

export const VotePhaseView: React.FC = () => {
  const { gameState, localPlayer, dispatchAction } = useGame();

  if (!gameState || !localPlayer) return null;

  const isVoting = gameState.phase === "VOTING";
  const isReveal = gameState.phase === "VOTE_REVEAL";

  const nominatedPlayers = gameState.players.filter((p) =>
    gameState.nominatedPlayerIds.includes(p.id)
  );

  const handleCastVote = (vote: "YES" | "NO") => {
    dispatchAction({
      type: "CAST_VOTE",
      playerId: localPlayer.id,
      vote,
    });
  };

  const handleContinue = () => {
    dispatchAction({
      type: "CONTINUE_AFTER_VOTE",
    });
  };

  const yesVotes = gameState.players.filter((p) => p.vote === "YES");
  const noVotes = gameState.players.filter((p) => p.vote === "NO");
  const hasVotedCount = gameState.players.filter((p) => p.vote !== null).length;
  const totalCount = gameState.players.length;
  const votePassed = yesVotes.length > totalCount / 2;

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Proposed Squad Podium */}
      <div className="bg-slate-900/90 border-2 border-amber-600/50 rounded-2xl p-4 shadow-xl text-center space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-slate-800 pb-2">
          <span className="flex items-center gap-1.5 text-amber-300">
            <Swords className="w-4 h-4" /> অধ্যায় {gameState.currentChapter + 1} — প্রস্তাবিত সৈন্যদল
          </span>
          <span className="text-slate-400 font-mono">
            {isVoting ? `ভোট জমা: ${hasVotedCount}/${totalCount}` : "ফলাফল ঘোষিত"}
          </span>
        </div>

        {/* Squad Members Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {nominatedPlayers.map((p) => (
            <div
              key={p.id}
              className="px-3.5 py-1.5 rounded-xl bg-amber-950/60 border-2 border-amber-500/60 text-amber-200 text-xs font-black shadow-md flex items-center gap-1.5"
            >
              <Swords className="w-3.5 h-3.5 text-amber-400" />
              <span>{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Voting Phase: Physical Ceramic/Wax Vote Tokens */}
      {isVoting && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-black text-slate-100">আপনার ভোট টোকেন নির্বাচন করুন</h3>
            <p className="text-xs text-slate-400 mt-0.5">সবাই ভোট দিলে একযোগে প্রকাশ পাবে</p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-2">
            {/* Yes Vote Token (Blue Seal) */}
            <button
              onClick={() => handleCastVote("YES")}
              className={`p-6 rounded-2xl border-4 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer select-none active:scale-95 ${
                localPlayer.vote === "YES"
                  ? "bg-gradient-to-b from-blue-900 to-blue-950 border-blue-400 text-blue-100 shadow-2xl shadow-blue-950/80 scale-105 ring-4 ring-blue-500/40"
                  : "bg-slate-900/90 border-slate-700 hover:border-blue-500/70 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-800 border-4 border-blue-300 shadow-xl flex items-center justify-center text-white">
                <Flame className="w-10 h-10 fill-current drop-shadow" />
              </div>
              <div className="text-center">
                <span className="text-lg font-black text-blue-200 block">হ্যাঁ ভোট</span>
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">দলের পক্ষে</span>
              </div>
              {localPlayer.vote === "YES" && (
                <span className="text-[11px] font-bold text-white bg-blue-600 px-3 py-0.5 rounded-full shadow">
                  নির্বাচিত
                </span>
              )}
            </button>

            {/* No Vote Token (Red Seal) */}
            <button
              onClick={() => handleCastVote("NO")}
              className={`p-6 rounded-2xl border-4 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer select-none active:scale-95 ${
                localPlayer.vote === "NO"
                  ? "bg-gradient-to-b from-rose-900 to-rose-950 border-rose-400 text-rose-100 shadow-2xl shadow-rose-950/80 scale-105 ring-4 ring-rose-500/40"
                  : "bg-slate-900/90 border-slate-700 hover:border-rose-500/70 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 to-rose-800 border-4 border-rose-300 shadow-xl flex items-center justify-center text-white">
                <Skull className="w-10 h-10 fill-current drop-shadow" />
              </div>
              <div className="text-center">
                <span className="text-lg font-black text-rose-200 block">না ভোট</span>
                <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">দলের বিপক্ষে</span>
              </div>
              {localPlayer.vote === "NO" && (
                <span className="text-[11px] font-bold text-white bg-rose-600 px-3 py-0.5 rounded-full shadow">
                  নির্বাচিত
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Vote Reveal Phase */}
      {isReveal && (
        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
          {/* Result Banner */}
          <div
            className={`p-4 rounded-2xl border-2 text-center shadow-xl ${
              votePassed
                ? "bg-emerald-950/80 border-emerald-500 text-emerald-100 shadow-emerald-950/60"
                : "bg-rose-950/80 border-rose-500 text-rose-100 shadow-rose-950/60"
            }`}
          >
            <div className="text-xl sm:text-2xl font-black flex items-center justify-center gap-2">
              {votePassed ? <Check className="w-6 h-6 text-emerald-400" /> : <X className="w-6 h-6 text-rose-400" />}
              <span>{votePassed ? "দল অনুমোদিত হয়েছে!" : "দল প্রত্যাখ্যাত হয়েছে!"}</span>
            </div>
            <div className="text-xs font-mono font-bold mt-1 text-slate-300">
              হ্যাঁ ভোট: {yesVotes.length} | না ভোট: {noVotes.length}
            </div>
          </div>

          {/* Tokens Laid on Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
              দরবারের প্রকাশ্য মতামত:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {gameState.players.map((p) => {
                const isYes = p.vote === "YES";
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border-2 text-xs font-bold ${
                      isYes
                        ? "bg-blue-950/50 border-blue-500/70 text-blue-200"
                        : "bg-rose-950/50 border-rose-500/70 text-rose-200"
                    }`}
                  >
                    <span className="truncate max-w-[90px]">{p.name}</span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      {isYes ? (
                        <>
                          <Flame className="w-3.5 h-3.5 text-blue-400" /> হ্যাঁ
                        </>
                      ) : (
                        <>
                          <Skull className="w-3.5 h-3.5 text-rose-400" /> না
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={handleContinue}
            className="w-full py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>{votePassed ? "অভিযানে যান" : "পরবর্তী সেনাপতির কাছে যান"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
