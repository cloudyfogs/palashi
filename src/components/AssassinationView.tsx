"use client";

import React, { useState } from "react";
import { useGame } from "@/context/GameContext";
import { Crosshair, Skull, AlertCircle, Swords } from "lucide-react";

export const AssassinationView: React.FC = () => {
  const { gameState, localPlayer, dispatchAction } = useGame();
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");

  if (!gameState || !localPlayer) return null;

  // Find who holds Mir Jafar card
  const mirJafarPlayer = gameState.players.find(
    (p) => p.character?.id === "mir_jafar"
  );
  const isLocalMirJafar = localPlayer.character?.id === "mir_jafar";

  const handleAssassinate = () => {
    if (!selectedTargetId || !isLocalMirJafar) return;
    dispatchAction({
      type: "MIR_JAFAR_ASSASSINATE",
      targetPlayerId: selectedTargetId,
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Dramatic Banner */}
      <div className="bg-gradient-to-b from-rose-950 via-slate-900 to-slate-950 border-2 border-rose-600/80 rounded-2xl p-6 shadow-2xl text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-bold animate-pulse">
          <Crosshair className="w-4 h-4 text-rose-400" /> মীর জাফরের শেষ চক্রান্ত
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-rose-100 tracking-tight">
            নবাব পক্ষ ৩টি অধ্যায় জয় করেছে!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
            কিন্তু ইতিহাস এখনও নির্ধারিত হয়নি। প্রধান বিশ্বাসঘাতক <strong>মীর জাফর</strong>-এর কাছে সুযোগ রয়েছে নবাবের মূল কাণ্ডারী <strong>মীর মদন</strong>-কে চিহ্নিত করে হত্যা করার।
          </p>
        </div>

        <div className="p-3 bg-slate-950/70 rounded-xl border border-rose-900/40 text-xs text-rose-300 text-left flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>নিয়ম:</strong> মীর জাফর যাকে নির্দেশ করবেন, তিনি যদি <strong>মীর মদন</strong> হন, তবে ইস্ট ইন্ডিয়া কোম্পানি খেলায় জয়ী হবে। অন্যথায় নবাব পক্ষ বিজয়ী হবে।
          </span>
        </div>
      </div>

      {/* Target Selection Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
          <span>লক্ষ্যবস্তু নির্বাচন করুন:</span>
          <span>{isLocalMirJafar ? "মীর মদন বলে সন্দেহভাজনকে বেছে নিন" : "মীর জাফরের সিদ্ধান্তের অপেক্ষা..."}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {gameState.players.map((p) => {
            // Cannot target self (Mir Jafar)
            const isSelf = p.id === localPlayer.id;
            const isSelected = selectedTargetId === p.id;

            return (
              <button
                type="button"
                key={p.id}
                onClick={() => setSelectedTargetId(p.id)}
                disabled={!isLocalMirJafar || isSelf}
                className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? "bg-rose-950/80 border-rose-500 shadow-xl shadow-rose-950/60 ring-2 ring-rose-500/50 scale-[1.02]"
                    : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                } ${isLocalMirJafar && !isSelf ? "cursor-pointer hover:border-rose-600/50" : "cursor-default opacity-80"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isSelected ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {isSelected ? <Crosshair className="w-5 h-5" /> : <Skull className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-200 block">{p.name}</span>
                    {isSelf && <span className="text-[10px] text-slate-500 font-semibold">(মীর জাফর - আপনি)</span>}
                  </div>
                </div>

                {isSelected && (
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-rose-600 text-white font-extrabold flex items-center gap-1">
                    লক্ষ্যবস্তু
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Assassinate Action Button */}
      {isLocalMirJafar ? (
        <button
          onClick={handleAssassinate}
          disabled={!selectedTargetId}
          className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all ${
            selectedTargetId
              ? "bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-950/70 cursor-pointer"
              : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
          }`}
        >
          <Swords className="w-5 h-5" />
          <span>চূড়ান্ত আঘাত হানুন — ইনিই মীর মদন!</span>
        </button>
      ) : (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
          প্রধান সেনাপতি <strong>{mirJafarPlayer?.name || "মীর জাফর"}</strong> কোম্পানি দলের সাথে আলোচনা করে চূড়ান্ত সিদ্ধান্ত নিচ্ছেন...
        </div>
      )}
    </div>
  );
};
