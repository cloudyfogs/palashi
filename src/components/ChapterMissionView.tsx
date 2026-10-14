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

  const squadActions = nominatedIds.map((id) => {
    const p = players.find((player) => player.id === id);
    return p?.chapterAction || "SUCCESS";
  });

  const shuffledActions = useMemo(() => {
    return shuffle(squadActions);
  }, [isReveal, squadActions.length]);

  const failCount = squadActions.filter((a) => a === "FAIL").length;
  const successCount = squadActions.filter((a) => a === "SUCCESS").length;
  const chapterPassed = failCount < failsRequired;

  const submittedCount = nominatedIds.filter((id) => {
    const p = players.find((player) => player.id === id);
    return p?.chapterAction !== null && p?.chapterAction !== undefined;
  }).length;
  const totalSquadCount = nominatedIds.length;

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Chapter Mission Area */}
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
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div
            className={`p-4 rounded-2xl text-center border-2 space-y-1 ${
              chapterPassed
                ? "bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-emerald-950/50"
                : "bg-rose-950/70 border-rose-500 text-rose-300 shadow-rose-950/50"
            }`}
          >
            <div className="text-xl sm:text-2xl font-black flex items-center justify-center gap-2">
              {chapterPassed ? (
                <>
                  <Check className="w-6 h-6 stroke-[3]" /> অধ্যায় সফলভাবে সম্পন্ন হয়েছে!
                </>
              ) : (
                <>
                  <Flame className="w-6 h-6 text-rose-400" /> অধ্যায়ে নাশকতা চালানো হয়েছে!
                </>
              )}
            </div>
            <p className="text-xs text-slate-300">
              সফল কার্ড: {successCount} • নাশকতা কার্ড: {failCount} (প্রয়োজন ছিল {failsRequired}টি)
            </p>
          </div>

          {/* Shuffled Anonymous Cards Reveal */}
          <div>
            <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              বেনামী কার্ড প্রকাশ (Anonymous Shuffled Cards)
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 py-1">
              {shuffledActions.map((action, idx) => {
                const isSuccess = action === "SUCCESS";
                return (
                  <div
                    key={idx}
                    className={`w-24 h-36 rounded-xl border-3 flex flex-col items-center justify-center p-2 shadow-xl animate-in zoom-in-75 duration-300 ${
                      isSuccess
                        ? "bg-gradient-to-br from-emerald-900 to-emerald-950 border-emerald-500 text-emerald-300 shadow-emerald-950/60"
                        : "bg-gradient-to-br from-rose-900 to-rose-950 border-rose-500 text-rose-300 shadow-rose-950/60 animate-bounce"
                    }`}
                  >
                    {isSuccess ? (
                      <>
                        <Check className="w-10 h-10 stroke-[3] text-emerald-400" />
                        <span className="text-xs font-black uppercase mt-1">সফল</span>
                      </>
                    ) : (
                      <>
                        <Skull className="w-10 h-10 stroke-[2] text-rose-400" />
                        <span className="text-xs font-black uppercase mt-1">নাশকতা</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Continue button */}
          <button
            onClick={handleContinue}
            className="w-full py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
          >
            <span>পরবর্তী অধ্যায়ে অগ্রসর হন</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
