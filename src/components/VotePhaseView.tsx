"use client";

import React from "react";
import { useGame } from "@/context/GameContext";
import { Swords, Flame, Skull, Check, X, ArrowRight, ShieldCheck } from "lucide-react";

export const VotePhaseView: React.FC = () => {
  const { gameState, localPlayer, dispatchAction } = useGame();

  if (!gameState || !localPlayer) return null;

  const isVoting = gameState.phase === "VOTING";
  const isReveal = gameState.phase === "VOTE_REVEAL";

  const nominatedIds = Array.isArray(gameState.nominatedPlayerIds)
    ? gameState.nominatedPlayerIds
    : [];
  const players = Array.isArray(gameState.players) ? gameState.players : [];

  const nominatedPlayers = players.filter((p) => nominatedIds.includes(p.id));

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

  const yesVotes = players.filter((p) => p.vote === "YES");
  const noVotes = players.filter((p) => p.vote === "NO");
  const hasVotedCount = players.filter((p) => p.vote !== null && p.vote !== undefined).length;
  const totalCount = players.length;
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

      {/* Voting Actions Area (During VOTING Phase) */}
      {isVoting && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 text-center">
          <div>
            <h3 className="text-lg font-black text-slate-100">
              আপনি কি এই সৈন্যদলে সম্মত?
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              সকল খেলোয়াড়ের সম্মতি/অসম্মতি একসাথে উন্মোচিত হবে
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleCastVote("YES")}
              className={`py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border-2 transition-all cursor-pointer shadow-lg ${
                localPlayer.vote === "YES"
                  ? "bg-emerald-600 border-emerald-400 text-white shadow-emerald-950/60 ring-2 ring-emerald-400/30 scale-[1.02]"
                  : "bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-700/60 text-emerald-300"
              }`}
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>হ্যাঁ (সমর্থন)</span>
            </button>

            <button
              onClick={() => handleCastVote("NO")}
              className={`py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border-2 transition-all cursor-pointer shadow-lg ${
                localPlayer.vote === "NO"
                  ? "bg-rose-600 border-rose-400 text-white shadow-rose-950/60 ring-2 ring-rose-400/30 scale-[1.02]"
                  : "bg-rose-950/40 hover:bg-rose-900/50 border-rose-700/60 text-rose-300"
              }`}
            >
              <X className="w-5 h-5 stroke-[3]" />
              <span>না (প্রত্যাখ্যান)</span>
            </button>
          </div>

          {localPlayer.vote && (
            <p className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5 animate-pulse">
              <ShieldCheck className="w-4 h-4" /> আপনার ভোট গৃহীত হয়েছে! বাকিদের ভোটের অপেক্ষা...
            </p>
          )}
        </div>
      )}

      {/* Vote Reveal Podium (During VOTE_REVEAL Phase) */}
      {isReveal && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div
            className={`p-4 rounded-2xl text-center border-2 space-y-1 ${
              votePassed
                ? "bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-emerald-950/50"
                : "bg-rose-950/70 border-rose-500 text-rose-300 shadow-rose-950/50"
            }`}
          >
            <div className="text-xl sm:text-2xl font-black flex items-center justify-center gap-2">
              {votePassed ? (
                <>
                  <Check className="w-6 h-6 stroke-[3]" /> কমিটি অনুমোদিত হয়েছে!
                </>
              ) : (
                <>
                  <X className="w-6 h-6 stroke-[3]" /> কমিটি প্রত্যাখ্যাত হয়েছে!
                </>
              )}
            </div>
            <p className="text-xs text-slate-300">
              হ্যাঁ ভোট: {yesVotes.length} • না ভোট: {noVotes.length}
            </p>
          </div>

          {/* Individual Player Votes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {players.map((p) => {
              const isYes = p.vote === "YES";
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold ${
                    isYes
                      ? "bg-emerald-950/50 border-emerald-700/60 text-emerald-300"
                      : "bg-rose-950/50 border-rose-700/60 text-rose-300"
                  }`}
                >
                  <span className="truncate mr-1">{p.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-black ${
                      isYes ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                    }`}
                  >
                    {isYes ? "হ্যাঁ" : "না"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Continue button for Host or All */}
          <button
            onClick={handleContinue}
            className="w-full py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
          >
            <span>{votePassed ? "অভিযানে প্রবেশ করুন" : "পরবর্তী সেনাপতির টেবিলে যান"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
