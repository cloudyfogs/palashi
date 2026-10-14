"use client";

import React, { useEffect } from "react";
import { useGame } from "@/context/GameContext";
import { Flame, Skull, RotateCcw, Trophy, Users } from "lucide-react";
import confetti from "canvas-confetti";

export const GameOverModal: React.FC = () => {
  const { gameState, isHost, isHotseat, dispatchAction } = useGame();

  if (!gameState || gameState.phase !== "GAME_OVER") return null;

  const isNawabWin = gameState.winner === "NAWAB";

  useEffect(() => {
    if (isNawabWin) {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }
  }, [isNawabWin]);

  const handleRematch = () => {
    dispatchAction({ type: "REMATCH" });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in duration-300">
      {/* Victory Announcement Banner */}
      <div
        className={`border-2 rounded-2xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden ${
          isNawabWin
            ? "bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 border-emerald-500/80 shadow-emerald-950/60"
            : "bg-gradient-to-b from-rose-950 via-slate-900 to-slate-950 border-rose-500/80 shadow-rose-950/60"
        }`}
      >
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner bg-slate-900/80 border border-slate-700">
          {isNawabWin ? (
            <Trophy className="w-9 h-9 text-amber-400" />
          ) : (
            <Skull className="w-9 h-9 text-rose-500" />
          )}
        </div>

        <div
          className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 border ${
            isNawabWin
              ? "bg-emerald-900/60 border-emerald-500/60 text-emerald-300"
              : "bg-rose-900/60 border-rose-500/60 text-rose-300"
          }`}
        >
          {isNawabWin ? (
            <>
              <Flame className="w-4 h-4 text-emerald-400" /> নবাবের অনুগত বাহিনী বিজয়ী!
            </>
          ) : (
            <>
              <Skull className="w-4 h-4 text-rose-400" /> ইস্ট ইন্ডিয়া কোম্পানি বিজয়ী!
            </>
          )}
        </div>

        <h2 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">
          {isNawabWin ? "বাংলা রক্ষা পেল!" : "বাংলার স্বাধীনতা সূর্য অস্তমিত হলো!"}
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 mt-3 max-w-lg mx-auto leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800">
          {gameState.winReason}
        </p>
      </div>

      {/* Secret Roles Full Reveal Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" /> সকল খেলোয়াড়ের আসল পরিচয় উন্মোচন
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {gameState.players.map((p) => {
            const isNawab = p.faction === "NAWAB";
            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                  isNawab
                    ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-200"
                    : "bg-rose-950/30 border-rose-800/40 text-rose-200"
                }`}
              >
                <div>
                  <div className="font-extrabold text-sm text-slate-100">{p.name}</div>
                  <div className="text-[11px] font-semibold text-slate-400">
                    {p.character
                      ? `${p.character.nameBn} (${p.character.nameEn})`
                      : isNawab
                      ? "নবাবের অনুগত"
                      : "কোম্পানির চক্রান্তকারী"}
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full font-bold text-[11px] border ${
                    isNawab
                      ? "bg-emerald-900/60 border-emerald-600/40 text-emerald-300"
                      : "bg-rose-900/60 border-rose-600/40 text-rose-300"
                  }`}
                >
                  {isNawab ? "নবাব পক্ষ" : "কোম্পানি পক্ষ"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Rematch Controls */}
        {(isHost || isHotseat) ? (
          <button
            onClick={handleRematch}
            className="w-full mt-4 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4" /> পুনরায় খেলুন (Rematch)
          </button>
        ) : (
          <p className="text-center text-xs text-slate-400 pt-3">
            হোস্ট পুনরায় খেলা শুরু করার জন্য অপেক্ষা করা হচ্ছে...
          </p>
        )}
      </div>
    </div>
  );
};
