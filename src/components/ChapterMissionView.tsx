"use client";

import React from "react";
import { useGame } from "@/context/GameContext";
import { getFailsRequired } from "@/constants/rules";
import { Flame, Skull, Check, Shield, ArrowRight, Swords, ShieldCheck, Lock } from "lucide-react";

export const ChapterMissionView: React.FC = () => {
  const { gameState, localPlayer, dispatchAction } = useGame();

  if (!gameState || !localPlayer) return null;

  const isMission = gameState.phase === "MISSION";
  const isReveal = gameState.phase === "MISSION_REVEAL";

  const nominatedIds = Array.isArray(gameState.nominatedPlayerIds)
    ? gameState.nominatedPlayerIds
    : [];
  const players = Array.isArray(gameState.players) ? gameState.players : [];

  const isSquadMember = nominatedIds.includes(localPlayer.id);
  const isNawab = localPlayer.faction === "NAWAB";

  const failsRequired = getFailsRequired(
    gameState.currentChapter || 0,
    gameState.settings?.playerCount || 5
  );

  const handleSubmitAction = (action: "SUCCESS" | "FAIL") => {
    if (!isSquadMember) return;
    dispatchAction({
      type: "SUBMIT_MISSION_ACTION",
      playerId: localPlayer.id,
      action,
    });
  };

  const handleContinue = () => {
    dispatchAction({
      type: "CONTINUE_AFTER_MISSION",
    });
  };

  const submittedCount = nominatedIds.filter((id) => {
    const p = players.find((player) => player.id === id);
    return p?.chapterAction !== null && p?.chapterAction !== undefined;
  }).length;
  const totalSquadCount = nominatedIds.length;

  // Authoritative mission results from gameState
  const missionResults = gameState.lastMissionResults;
  const cardActions = missionResults?.actions || [];
  const successCount = missionResults?.successCount ?? 0;
  const failCount = missionResults?.failCount ?? 0;
  const chapterFailsRequired = missionResults?.failsRequired ?? failsRequired;
  const chapterPassed = missionResults ? missionResults.passed : failCount < chapterFailsRequired;

  const nawabWins = (gameState.chapterOutcomes || []).filter((o) => o === "NAWAB").length;
  const eicWins = (gameState.chapterOutcomes || []).filter((o) => o === "EIC").length;

  let continueButtonText = "পরবর্তী অধ্যায়ে অগ্রসর হন";
  if (eicWins >= 3) {
    continueButtonText = "চূড়ান্ত ফলাফল দেখুন (কোম্পানি মসনদ দখল করেছে)";
  } else if (nawabWins >= 3) {
    continueButtonText = "পরবর্তী পদক্ষেপে যান (মীর জাফরের গুপ্তহত্যা)";
  } else {
    continueButtonText = `পরবর্তী অধ্যায়ে অগ্রসর হন (অধ্যায় ${(gameState.currentChapter || 0) + 2})`;
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Chapter Mission Area Header */}
      <div className="bg-slate-900/90 border-2 border-emerald-600/50 rounded-2xl p-4 shadow-xl text-center space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-slate-800 pb-2">
          <span className="flex items-center gap-1.5 text-emerald-400 font-black">
            <Shield className="w-4 h-4" /> অধ্যায় {(gameState.currentChapter || 0) + 1} অভিযান
          </span>
          <span className="text-slate-400 font-mono">
            {isMission ? `জমা: ${submittedCount}/${totalSquadCount}` : "ফলাফল উন্মোচিত"}
          </span>
        </div>

        {/* Squad Members */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {nominatedIds.map((id) => {
            const p = players.find((player) => player.id === id);
            return (
              <div
                key={id}
                className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-black shadow flex items-center gap-1.5"
              >
                <Swords className="w-3.5 h-3.5 text-amber-400" />
                <span>{p?.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Secret Action Submissions Area (MISSION phase) */}
      {isMission && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 text-center">
          {isSquadMember ? (
            <>
              <div>
                <h3 className="text-lg font-black text-slate-100">
                  আপনার গোপন অভিযান কার্ড নির্বাচন করুন
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  কার্ড সম্পূর্ণ গোপন ও বেনামী থাকবে (কার্ড উল্টে দেখানো হবে)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {/* Success Card (Always available) */}
                <button
                  onClick={() => handleSubmitAction("SUCCESS")}
                  className={`p-4 rounded-2xl border-2 font-black text-sm flex flex-col items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                    localPlayer.chapterAction === "SUCCESS"
                      ? "bg-emerald-600 border-emerald-400 text-white ring-2 ring-emerald-400/40 shadow-emerald-950/60 scale-[1.02]"
                      : "bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-700/60 text-emerald-300"
                  }`}
                >
                  <Check className="w-8 h-8 stroke-[3]" />
                  <span>সফল (Success)</span>
                  <span className="text-[10px] font-normal text-emerald-300/80">
                    নবাবের পক্ষ সমর্থন
                  </span>
                </button>

                {/* Fail Card (Only for EIC) */}
                <button
                  onClick={() => handleSubmitAction("FAIL")}
                  disabled={isNawab}
                  className={`p-4 rounded-2xl border-2 font-black text-sm flex flex-col items-center justify-center gap-2 transition-all shadow-lg ${
                    isNawab
                      ? "bg-slate-950/60 border-slate-800 text-slate-600 cursor-not-allowed opacity-40"
                      : localPlayer.chapterAction === "FAIL"
                      ? "bg-rose-600 border-rose-400 text-white ring-2 ring-rose-400/40 shadow-rose-950/60 scale-[1.02] cursor-pointer"
                      : "bg-rose-950/40 hover:bg-rose-900/50 border-rose-700/60 text-rose-300 cursor-pointer"
                  }`}
                >
                  <Skull className="w-8 h-8 stroke-[2.5]" />
                  <span>নাশকতা (Fail)</span>
                  <span className="text-[10px] font-normal">
                    {isNawab ? "নবাবের বিশ্বস্তরা কেবল সফল দিতে পারে" : "কোম্পানির নাশকতা"}
                  </span>
                </button>
              </div>

              {localPlayer.chapterAction && (
                <p className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5 animate-pulse">
                  <Check className="w-4 h-4" /> আপনার কার্ড নিরাপদে জমা হয়েছে! অন্যদের অপেক্ষা...
                </p>
              )}
            </>
          ) : (
            <div className="py-4 space-y-1">
              <h4 className="text-base font-bold text-slate-300">
                সৈন্যদল গোপন অভিযান পরিচালনা করছে...
              </h4>
              <p className="text-xs text-slate-500">
                আপনি এই অভিযানের সদস্য নন। অপেক্ষা করুন ফলাফল দেখার জন্য।
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mission Reveal Podium (MISSION_REVEAL phase) */}
      {isReveal && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          {/* Chapter Outcome Status Banner */}
          <div
            className={`p-4 rounded-2xl text-center border-2 space-y-1.5 shadow-xl ${
              chapterPassed
                ? "bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-emerald-950/80 border-emerald-500 text-emerald-200"
                : "bg-gradient-to-r from-rose-950/80 via-rose-900/60 to-rose-950/80 border-rose-500 text-rose-200"
            }`}
          >
            <div className="text-xl sm:text-2xl font-black flex items-center justify-center gap-2">
              {chapterPassed ? (
                <>
                  <ShieldCheck className="w-7 h-7 text-emerald-400 stroke-[2.5]" />
                  <span className="text-emerald-300">অধ্যায় সফলভাবে সম্পন্ন হয়েছে!</span>
                </>
              ) : (
                <>
                  <Flame className="w-7 h-7 text-rose-400 animate-pulse" />
                  <span className="text-rose-300">অধ্যায়ে নাশকতা চালানো হয়েছে!</span>
                </>
              )}
            </div>
            <p className="text-xs font-medium text-slate-300">
              {chapterPassed
                ? "সৈন্যদল নবাবের মসনদের প্রতি বিশ্বস্ততা বজায় রেখে অভিযান সম্পন্ন করেছে।"
                : "সৈন্যদলের ভেতরে ঘাপটি মেরে থাকা কোম্পানির গুপ্তচর নাশকতা ঘটিয়েছে!"}
            </p>
            <div className="text-[11px] font-mono text-slate-400 pt-0.5">
              প্রয়োজনীয় নাশকতা: {chapterFailsRequired}টি • প্রাপ্ত নাশকতা: {failCount}টি
            </div>
          </div>

          {/* Anonymous Card Tally Counts (Green vs Red) */}
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-600/50 text-emerald-300 shadow text-center">
              <div className="text-2xl sm:text-3xl font-black font-mono">{successCount}</div>
              <div className="text-xs font-bold mt-0.5">সবুজ কার্ড (সফল)</div>
            </div>
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-600/50 text-rose-300 shadow text-center">
              <div className="text-2xl sm:text-3xl font-black font-mono">{failCount}</div>
              <div className="text-xs font-bold mt-0.5">লাল কার্ড (নাশকতা)</div>
            </div>
          </div>

          {/* Shuffled Anonymous Playing Cards */}
          <div className="space-y-3">
            <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" /> গোপন কার্ড প্রকাশ (Anonymous Shuffled Cards)
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3.5 py-2">
              {cardActions.map((action, idx) => {
                const isSuccess = action === "SUCCESS";
                return (
                  <div
                    key={idx}
                    style={{ animationDelay: `${idx * 150}ms` }}
                    className={`relative w-28 h-44 sm:w-32 sm:h-48 rounded-2xl border-2 flex flex-col justify-between p-3 shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl animate-in zoom-in-75 fill-mode-both ${
                      isSuccess
                        ? "bg-gradient-to-b from-emerald-800 via-emerald-950 to-slate-950 border-amber-400/80 text-emerald-200 shadow-emerald-950/80 ring-1 ring-emerald-500/40"
                        : "bg-gradient-to-b from-rose-900 via-rose-950 to-neutral-950 border-rose-500/90 text-rose-200 shadow-rose-950/90 ring-1 ring-rose-500/50"
                    }`}
                  >
                    {/* Top Pip */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {isSuccess ? (
                          <Shield className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Flame className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider ${
                            isSuccess ? "text-amber-300" : "text-rose-300"
                          }`}
                        >
                          {isSuccess ? "সফল" : "নাশকতা"}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400/60 font-bold">
                        #{idx + 1}
                      </span>
                    </div>

                    {/* Center Medallion */}
                    <div className="flex flex-col items-center justify-center gap-1.5 my-auto">
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center border-2 shadow-inner ${
                          isSuccess
                            ? "bg-emerald-900/60 border-amber-400/60 shadow-emerald-950"
                            : "bg-rose-950/60 border-rose-500/60 shadow-rose-950"
                        }`}
                      >
                        {isSuccess ? (
                          <Check className="w-8 h-8 stroke-[3] text-emerald-400" />
                        ) : (
                          <Skull className="w-8 h-8 stroke-[2.2] text-rose-400" />
                        )}
                      </div>

                      <div className="text-center">
                        <span
                          className={`text-sm font-black tracking-wide block ${
                            isSuccess ? "text-emerald-300" : "text-rose-300"
                          }`}
                        >
                          {isSuccess ? "সফল" : "নাশকতা"}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-normal">
                          {isSuccess ? "নবাবের পক্ষ" : "কোম্পানির পক্ষ"}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Pip */}
                    <div className="flex items-center justify-between rotate-180">
                      <div className="flex items-center gap-1">
                        {isSuccess ? (
                          <Shield className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Flame className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider ${
                            isSuccess ? "text-amber-300" : "text-rose-300"
                          }`}
                        >
                          {isSuccess ? "সফল" : "নাশকতা"}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400/60 font-bold">
                        #{idx + 1}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Privacy Guarantee Note */}
            <p className="text-[11px] text-slate-500 text-center">
              🔒 রাজনৈতিক নিরপেক্ষতা ও খেলা অক্ষুণ্ণ রাখার জন্য কে কোন কার্ড ফেলেছেন তা প্রকাশ করা হয়নি।
            </p>
          </div>

          {/* Continue button */}
          <button
            onClick={handleContinue}
            className="w-full py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
          >
            <span>{continueButtonText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
