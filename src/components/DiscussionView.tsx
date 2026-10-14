"use client";

import React from "react";
import { useGame } from "@/context/GameContext";
import { SQUAD_SIZES } from "@/constants/rules";
import { Swords, Shield, Crown, Check } from "lucide-react";

export const DiscussionView: React.FC = () => {
  const { gameState, localPlayer, dispatchAction } = useGame();

  if (!gameState || !localPlayer) return null;

  const currentSenapati = gameState.players[gameState.currentSenapatiIndex];
  const isCurrentSenapati = currentSenapati?.id === localPlayer.id;

  const requiredSquadSize =
    SQUAD_SIZES[gameState.settings.playerCount]?.[gameState.currentChapter] || 2;
  const selectedIds = gameState.nominatedPlayerIds;
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

      {/* Players Selection Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
          <span>দরবারের সদস্যবৃন্দ:</span>
          <span className="text-amber-400">
            {isCurrentSenapati ? "ক্লিক করে দল টোকেন দিন" : "সেনাপতির নির্বাচনের অপেক্ষা"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {gameState.players.map((p, idx) => {
            const isSelected = selectedIds.includes(p.id);
            const isSenapati = p.id === currentSenapati?.id;

            return (
              <button
                type="button"
                key={p.id}
                onClick={() => handleTogglePlayer(p.id)}
                disabled={!isCurrentSenapati}
                className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all select-none text-left ${
                  isSelected
                    ? "bg-amber-950/70 border-amber-400 text-amber-100 shadow-lg shadow-amber-950/50 ring-2 ring-amber-400/40 scale-[1.01]"
                    : "bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300"
                } ${isCurrentSenapati ? "cursor-pointer hover:border-amber-500/70 active:scale-95" : "cursor-default"}`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                      isSelected
                        ? "bg-amber-500 text-slate-950 shadow"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                      <span>{p.name}</span>
                      {p.id === localPlayer.id && (
                        <span className="text-[10px] text-emerald-400 font-semibold">(আপনি)</span>
                      )}
                    </div>
                    {isSenapati && (
                      <span className="text-[10px] font-bold text-amber-400">সেনাপতি 👑</span>
                    )}
                  </div>
                </div>

                {isSelected ? (
                  <div className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow">
                    <Swords className="w-3.5 h-3.5" />
                    <span>দল টোকেন</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-600 font-semibold">মুক্ত</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirm Button */}
      {isCurrentSenapati ? (
        <button
          onClick={handleConfirmNomination}
          disabled={!isSquadFull}
          className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
            isSquadFull
              ? "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-amber-950/60 cursor-pointer hover:scale-[1.01]"
              : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
          }`}
        >
          <Check className="w-4 h-4" />
          {isSquadFull
            ? "দল নিশ্চিত করে ভোটে যান"
            : `ঠিক ${requiredSquadSize} জন প্লেয়ার বেছে নিন (${selectedIds.length}/${requiredSquadSize})`}
        </button>
      ) : (
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
          সেনাপতি <strong>{currentSenapati?.name}</strong> দল নির্বাচন করছেন...
        </div>
      )}
    </div>
  );
};
