"use client";

import React from "react";
import { useGame } from "@/context/GameContext";
import { SQUAD_SIZES } from "@/constants/rules";
import { Swords, Shield, Crown, Check } from "lucide-react";

export const DiscussionView: React.FC = () => {
  const { gameState, localPlayer, dispatchAction } = useGame();

  if (!gameState || !localPlayer) return null;

  const currentSenapati = (gameState.players || [])[gameState.currentSenapatiIndex];
  const isCurrentSenapati = currentSenapati?.id === localPlayer.id;

  const requiredSquadSize =
    SQUAD_SIZES[gameState.settings?.playerCount]?.[gameState.currentChapter] || 2;
  const selectedIds = Array.isArray(gameState.nominatedPlayerIds)
    ? gameState.nominatedPlayerIds
    : [];
  const isSquadFull = selectedIds.length === requiredSquadSize;

  const handleTogglePlayer = (playerId: string) => {
    if (!isCurrentSenapati) return;
    dispatchAction({
      type: "TOGGLE_NOMINATION",
      playerId,
    });
  };

  const handleConfirmNomination = () => {
    if (!isCurrentSenapati || !isSquadFull) return;
    dispatchAction({
      type: "CONFIRM_NOMINATION",
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Senapati Banner */}
      <div className="bg-slate-900/90 border-2 border-amber-600/50 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black shadow-lg">
            <Crown className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              {isCurrentSenapati ? "আপনি সেনাপতি" : "বর্তমান সেনাপতি"}
            </div>
            <div className="text-lg font-black text-slate-100">{currentSenapati?.name}</div>
          </div>
        </div>

        {/* Squad Counter Chip */}
        <div className="text-right">
          <div className="text-[10px] font-bold text-slate-400 uppercase">প্রয়োজনীয় সৈন্য</div>
          <div
            className={`text-xl font-mono font-black ${
              isSquadFull ? "text-emerald-400" : "text-amber-300"
            }`}
          >
            {selectedIds.length} / {requiredSquadSize}
          </div>
        </div>
      </div>

      {/* Nomination Instruction */}
      <div className="text-center space-y-1">
        <h3 className="text-lg sm:text-xl font-black text-slate-100">
          {isCurrentSenapati
            ? `আপনার ${requiredSquadSize} জন সৈন্য নির্বাচন করুন`
            : `${currentSenapati?.name} সৈন্যদল গঠন করছেন...`}
        </h3>
        <p className="text-xs text-slate-400">
          {isCurrentSenapati
            ? "কাউন্সিলের সদস্যদের সাথে আলোচনা করে বিশ্বস্ত খেলোয়াড়দের ট্যাপ করুন"
            : "কারা অভিযানে যাবে তা নিয়ে সেনাপতির সাথে ভয়েস কলে আলোচনা করুন"}
        </p>
      </div>

      {/* Players Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {(gameState.players || []).map((p) => {
          const isSelected = selectedIds.includes(p.id);
          const isSenapati = p.id === currentSenapati?.id;

          return (
            <button
              type="button"
              key={p.id}
              onClick={() => handleTogglePlayer(p.id)}
              disabled={!isCurrentSenapati}
              className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-between text-left ${
                isSelected
                  ? "bg-amber-950/70 border-amber-500 shadow-md shadow-amber-950/40 ring-2 ring-amber-400/20"
                  : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
              } ${isCurrentSenapati ? "cursor-pointer hover:scale-[1.01]" : "cursor-default"}`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    isSelected
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {isSenapati ? <Crown className="w-4 h-4" /> : p.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                    {p.name}
                    {p.id === localPlayer.id && (
                      <span className="text-[10px] text-emerald-400 font-semibold">(আপনি)</span>
                    )}
                  </div>
                  {isSenapati && (
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                      সেনাপতি
                    </span>
                  )}
                </div>
              </div>

              {/* Selection Checkmark */}
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                  isSelected
                    ? "bg-amber-500 border-amber-400 text-slate-950"
                    : "border-slate-700 bg-slate-950/50"
                }`}
              >
                {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Senapati Confirmation Action */}
      {isCurrentSenapati && (
        <button
          onClick={handleConfirmNomination}
          disabled={!isSquadFull}
          className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
            isSquadFull
              ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-950/60 cursor-pointer hover:scale-[1.01]"
              : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
          }`}
        >
          <Swords className="w-4 h-4" />
          {isSquadFull
            ? "সৈন্যদল চূড়ান্ত করুন — ভোটাভুটি শুরু করুন"
            : `আরো ${requiredSquadSize - selectedIds.length} জন সদস্য নির্বাচন করুন`}
        </button>
      )}
    </div>
  );
};
