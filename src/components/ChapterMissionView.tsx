"use client";

import React, { useMemo } from "react";
import { useGame } from "@/context/GameContext";
import { getFailsRequired } from "@/constants/rules";
import { shuffle } from "@/utils/gameLogic";
import { Flame, Skull, Check, X, Shield, ArrowRight, AlertTriangle, Swords } from "lucide-react";

export const ChapterMissionView: React.FC = () => {
  const { gameState, localPlayer, dispatchAction } = useGame();

  if (!gameState || !localPlayer) return null;

  const isMission = gameState.phase === "MISSION";
  const isReveal = gameState.phase === "MISSION_REVEAL";

  const isSquadMember = gameState.nominatedPlayerIds.includes(localPlayer.id);
  const isNawab = localPlayer.faction === "NAWAB";

  const failsRequired = getFailsRequired(
    gameState.currentChapter,
    gameState.settings.playerCount
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

  const squadActions = gameState.nominatedPlayerIds.map((id) => {
    const p = gameState.players.find((player) => player.id === id);
    return p?.chapterAction || "SUCCESS";
  });

  const shuffledActions = useMemo(() => {
    return shuffle(squadActions);
  }, [isReveal]);

  const failCount = squadActions.filter((a) => a === "FAIL").length;
  const successCount = squadActions.filter((a) => a === "SUCCESS").length;
  const chapterPassed = failCount < failsRequired;

  const submittedCount = gameState.nominatedPlayerIds.filter((id) => {
    const p = gameState.players.find((player) => player.id === id);
    return p?.chapterAction !== null && p?.chapterAction !== undefined;
  }).length;
  const totalSquadCount = gameState.nominatedPlayerIds.length;

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Header Bar */}
      <div className="bg-slate-900/90 border-2 border-emerald-600/40 rounded-2xl p-4 shadow-xl text-center space-y-1">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-slate-800 pb-2">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Shield className="w-4 h-4" /> অধ্যায় {gameState.currentChapter + 1} অভিযান
          </span>
          <span className="text-slate-400 font-mono">
            {isMission ? `কার্ড জমা: ${submittedCount}/${totalSquadCount}` : "ফলাফল উন্মোচিত"}
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-black text-slate-100 pt-1">
          {isMission
            ? isSquadMember
              ? "অভিযানের কার্ড নির্বাচন করুন"
              : "মনোনীত সদস্যরা অভিযানে অংশগ্রহণ করছেন..."
            : chapterPassed
            ? "নবাব পক্ষ অধ্যায়ে বিজয়ী!"
            : "কোম্পানি পক্ষ অধ্যায়ে নাশকতা চালিয়েছে!"}
        </h3>
      </div>

      {/* Action Cards (Physical Playing Card Style) */}
      {isMission && isSquadMember && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-1">
            {/* SUCCESS CARD */}
            <div
              onClick={() => handleSubmitAction("SUCCESS")}
              className={`rounded-2xl border-4 p-4 sm:p-5 flex flex-col items-center justify-between h-64 sm:h-72 cursor-pointer transition-all duration-300 relative select-none hover:-translate-y-1 active:scale-95 ${
                localPlayer.chapterAction === "SUCCESS"
                  ? "bg-gradient-to-b from-emerald-950 via-emerald-900 to-slate-950 border-emerald-400 text-emerald-100 shadow-2xl shadow-emerald-950 ring-4 ring-emerald-500/50 scale-105"
                  : "bg-slate-900/90 border-emerald-700/60 hover:border-emerald-400 text-slate-300"
              }`}
            >
              {/* Top corner */}
              <div className="w-full flex justify-between text-[11px] font-bold text-emerald-400">
                <span>✦ সাফল্য</span>
                <Flame className="w-4 h-4 fill-current" />
              </div>

              {/* Medallion */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-800 border-4 border-emerald-300 shadow-xl flex items-center justify-center text-white my-auto">
                <Flame className="w-10 h-10 fill-current drop-shadow" />
              </div>

              {/* Title & Status */}
              <div className="text-center w-full">
                <span className="text-base font-black text-emerald-200 block">সাফল্য কার্ড</span>
                <span className="text-[10px] text-emerald-400 font-mono uppercase">SUCCESS</span>
                {localPlayer.chapterAction === "SUCCESS" && (
                  <div className="mt-1 text-[10px] font-bold text-white bg-emerald-600 py-0.5 rounded-full shadow">
                    জমা দেওয়া হয়েছে
                  </div>
                )}
              </div>
            </div>

            {/* SABOTAGE CARD */}
            <div
              onClick={() => !isNawab && handleSubmitAction("FAIL")}
              className={`rounded-2xl border-4 p-4 sm:p-5 flex flex-col items-center justify-between h-64 sm:h-72 transition-all duration-300 relative select-none ${
                isNawab
                  ? "bg-slate-950/40 border-slate-900 text-slate-600 opacity-40 cursor-not-allowed"
                  : "cursor-pointer hover:-translate-y-1 active:scale-95"
              } ${
                localPlayer.chapterAction === "FAIL"
                  ? "bg-gradient-to-b from-rose-950 via-rose-900 to-slate-950 border-rose-400 text-rose-100 shadow-2xl shadow-rose-950 ring-4 ring-rose-500/50 scale-105"
                  : !isNawab
                  ? "bg-slate-900/90 border-rose-700/60 hover:border-rose-400 text-slate-300"
                  : ""
              }`}
            >
              {/* Top corner */}
              <div className="w-full flex justify-between text-[11px] font-bold text-rose-400">
                <span>✦ নাশকতা</span>
                <Skull className="w-4 h-4 fill-current" />
              </div>

              {/* Medallion */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 to-rose-800 border-4 border-rose-300 shadow-xl flex items-center justify-center text-white my-auto">
                <Skull className="w-10 h-10 fill-current drop-shadow" />
              </div>

              {/* Title & Status */}
              <div className="text-center w-full">
                <span className="text-base font-black text-rose-200 block">বিশ্বাসঘাতকতা</span>
                <span className="text-[10px] text-rose-400 font-mono uppercase">
                  {isNawab ? "নিষিদ্ধ (LOYAL)" : "SABOTAGE"}
                </span>
                {!isNawab && localPlayer.chapterAction === "FAIL" && (
                  <div className="mt-1 text-[10px] font-bold text-white bg-rose-600 py-0.5 rounded-full shadow">
                    জমা দেওয়া হয়েছে
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Non-squad waiting */}
      {isMission && !isSquadMember && (
        <div className="py-12 px-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
            <Swords className="w-7 h-7" />
          </div>
          <p className="font-black text-slate-200 text-base">মনোনীত সৈন্যরা অভিযানে অংশগ্রহণ করছেন</p>
          <p className="text-xs text-slate-500">গোপন কার্ড জমা হলে একযোগে ফলাফল দেখা যাবে...</p>
        </div>
      )}

      {/* Mission Reveal Cards */}
      {isReveal && (
        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
          {/* Result Banner */}
          <div
            className={`p-4 rounded-2xl border-2 text-center shadow-xl ${
              chapterPassed
                ? "bg-emerald-950/80 border-emerald-500 text-emerald-100 shadow-emerald-950/60"
                : "bg-rose-950/80 border-rose-500 text-rose-100 shadow-rose-950/60"
            }`}
          >
            <div className="text-xl sm:text-2xl font-black flex items-center justify-center gap-2">
              {chapterPassed ? <Check className="w-6 h-6 text-emerald-400" /> : <AlertTriangle className="w-6 h-6 text-rose-400" />}
              <span>{chapterPassed ? "অধ্যায় সম্পূর্ণভাবে সফল!" : "অধ্যায়ে নাশকতা ঘটেছে!"}</span>
            </div>
            <div className="text-xs font-mono font-bold mt-1 text-slate-300">
              সাফল্য: {successCount} | নাশকতা: {failCount} {failsRequired > 1 && `(প্রয়োজন: ${failsRequired})`}
            </div>
          </div>

          {/* Shuffled Cards Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl text-center space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              উন্মোচিত কার্ডসমূহ (নাম প্রকাশহীন):
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 py-1">
              {shuffledActions.map((action, idx) => {
                const isSuccess = action === "SUCCESS";
                return (
                  <div
                    key={idx}
                    className={`w-24 h-36 rounded-xl border-3 flex flex-col items-center justify-center gap-1 font-bold shadow-xl animate-in fade-in duration-300 ${
                      isSuccess
                        ? "bg-emerald-950 border-emerald-400 text-emerald-200 shadow-emerald-950/70"
                        : "bg-rose-950 border-rose-400 text-rose-200 shadow-rose-950/70"
                    }`}
                  >
                    {isSuccess ? (
                      <Flame className="w-8 h-8 text-emerald-400 fill-current" />
                    ) : (
                      <Skull className="w-8 h-8 text-rose-400 fill-current" />
                    )}
                    <span className="text-[11px] font-black mt-1">
                      {isSuccess ? "সাফল্য" : "নাশকতা"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            className="w-full py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>পরবর্তী পদক্ষেপে যান</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
