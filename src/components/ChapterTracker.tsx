"use client";

import React from "react";
import { useGame } from "@/context/GameContext";
import { SQUAD_SIZES, getFailsRequired } from "@/constants/rules";
import { Check, X, ShieldAlert } from "lucide-react";

export const ChapterTracker: React.FC = () => {
  const { gameState } = useGame();
  if (!gameState) return null;

  const playerCount = gameState.settings.playerCount;
  const squadSizes = SQUAD_SIZES[playerCount] || [2, 3, 2, 3, 3];
  const outcomes = gameState.chapterOutcomes;
  const currentChapter = gameState.currentChapter;

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
      {/* Chapter Badges (1 to 5) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            অধ্যায় অগ্রগতি (Chapters 1 - 5)
          </span>
          <span className="text-xs font-medium text-amber-300/90">
            অধ্যায় {currentChapter + 1}/৫
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {squadSizes.map((size, idx) => {
            const outcome = outcomes[idx];
            const isCurrent = idx === currentChapter && gameState.phase !== "GAME_OVER";
            const failsRequired = getFailsRequired(idx, playerCount);
            const isStarred = failsRequired > 1;

            return (
              <div
                key={idx}
                className={`relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border-2 transition-all ${
                  outcome === "NAWAB"
                    ? "bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/50"
                    : outcome === "EIC"
                    ? "bg-rose-950/70 border-rose-500 text-rose-300 shadow-md shadow-rose-950/50"
                    : isCurrent
                    ? "bg-amber-950/40 border-amber-400 text-amber-200 ring-2 ring-amber-400/30 scale-105"
                    : "bg-slate-950/60 border-slate-800 text-slate-400"
                }`}
              >
                {/* Chapter Number */}
                <span className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400">
                  অধ্যায় {idx + 1}
                </span>

                {/* Outcome Icon or Squad Size */}
                <div className="my-1 flex items-center justify-center">
                  {outcome === "NAWAB" ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-600/30 border border-emerald-500 flex items-center justify-center text-emerald-400">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : outcome === "EIC" ? (
                    <div className="w-7 h-7 rounded-full bg-rose-600/30 border border-rose-500 flex items-center justify-center text-rose-400">
                      <X className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <span className="text-lg sm:text-xl font-mono font-black text-slate-200">
                      {size}
                    </span>
                  )}
                </div>

                {/* Sub-label (Squad Size & Starred Note) */}
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-0.5">
                  {outcome ? `${size} সদস্য` : `${size} জন`}
                  {isStarred && <span className="text-amber-400 font-bold">*</span>}
                </span>

                {/* Active Indicator Pulse */}
                {isCurrent && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Failed Vote Tracker (1 to 5) */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>ভোট প্রত্যাখ্যান ট্র্যাকার:</span>
        </div>

        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((step) => {
            const isFailed = step <= gameState.failedVoteCount;
            const isMax = step === 5;

            return (
              <div
                key={step}
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold border transition-colors ${
                  isFailed
                    ? isMax
                      ? "bg-rose-600 border-rose-400 text-white animate-pulse"
                      : "bg-rose-950 border-rose-600 text-rose-300"
                    : "bg-slate-950 border-slate-800 text-slate-600"
                }`}
                title={isMax ? "৫ম বার ভোট বাতিল হলে কোম্পানি সরাসরি জয়ী হবে!" : `ব্যর্থ ভোট ${step}`}
              >
                {step}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
