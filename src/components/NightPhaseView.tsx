"use client";

import React from "react";
import { useGame } from "@/context/GameContext";
import { CardView } from "@/components/CardView";
import { Moon, Eye, ShieldCheck, Skull, Check } from "lucide-react";

export const NightPhaseView: React.FC = () => {
  const { gameState, localPlayer, nightVision, dispatchAction } = useGame();

  if (!gameState || !localPlayer) return null;

  const charId = localPlayer.character?.id;
  const isAcknowledged = localPlayer.hasAcknowledgedNight;

  const handleAcknowledge = () => {
    dispatchAction({
      type: "ACKNOWLEDGE_NIGHT",
      playerId: localPlayer.id,
    });
  };

  const players = Array.isArray(gameState.players) ? gameState.players : [];
  const acknowledgedCount = players.filter((p) => p.hasAcknowledgedNight).length;
  const totalCount = players.length;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Night Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-700/40 text-indigo-300 text-xs font-bold">
          <Moon className="w-3.5 h-3.5 text-indigo-400" /> পরিচয় পর্ব — রাত
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-100">
          আপনার গোপন চরিত্র
        </h2>
        <p className="text-xs text-slate-400">
          কার্ডটি স্পর্শ করে উল্টান এবং রাতের তথ্য ভালো করে দেখে নিন
        </p>
      </div>

      {/* Physical Playing Card */}
      <CardView
        character={localPlayer.character}
        faction={localPlayer.faction}
        isPeekable={true}
      />

      {/* Night Intelligence Box (Concise) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" /> রাতের গোপন তথ্য:
        </h4>

        {/* 1. Mir Madan */}
        {charId === "mir_madan" && (
          <div className="space-y-1.5 text-xs">
            <p className="text-slate-300">চিহ্নিত কোম্পানি চক্রান্তকারী (রায় দুর্লভ ছাড়া):</p>
            <div className="flex flex-wrap gap-2">
              {nightVision?.knownConspirators?.map((c) => (
                <span
                  key={c.id}
                  className="px-2.5 py-1 rounded-lg bg-rose-950/70 border border-rose-700/60 text-rose-200 font-bold flex items-center gap-1"
                >
                  <Skull className="w-3 h-3 text-rose-400" /> {c.name}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-amber-400 font-semibold pt-1">
              ⚠️ মীর মদন হিসেবে নিজের পরিচয় গোপন রাখুন!
            </p>
          </div>
        )}

        {/* 2. Mohan Lal */}
        {charId === "mohan_lal" && (
          <div className="space-y-1.5 text-xs">
            <p className="text-slate-300">মীর মদন প্রার্থী (একজন আসল, একজন ঘষেটি বেগম):</p>
            <div className="flex flex-wrap gap-2">
              {nightVision?.mirMadanCandidates?.map((c, i) => (
                <span
                  key={c.id}
                  className="px-3 py-1 rounded-lg bg-amber-950/70 border border-amber-600/60 text-amber-200 font-bold"
                >
                  প্রার্থী {i + 1}: {c.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 3. Regular EIC */}
        {localPlayer.faction === "EIC" && charId !== "umichand" && (
          <div className="space-y-1.5 text-xs">
            <p className="text-slate-300">আপনার সহযোগী কোম্পানি চক্রান্তকারী:</p>
            <div className="flex flex-wrap gap-2">
              {nightVision?.fellowEicMembers?.map((m) => (
                <span
                  key={m.id}
                  className="px-2.5 py-1 rounded-lg bg-rose-950/70 border border-rose-700/60 text-rose-200 font-bold flex items-center gap-1"
                >
                  <Skull className="w-3 h-3 text-rose-400" /> {m.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 4. Umichand */}
        {charId === "umichand" && (
          <p className="text-xs text-rose-300">
            আপনি একাকী চক্রান্তকারী (উমিচাঁদ)। আপনি কাউকে চেনেন না, কেউ আপনাকে চেনে না।
          </p>
        )}

        {/* 5. Ray Durlabh */}
        {charId === "ray_durlabh" && (
          <p className="text-xs text-amber-300">
            গোপন চক্রান্তকারী (রায় দুর্লভ)। মীর মদন আপনাকে চক্রান্তকারী হিসেবে দেখতে পায়নি!
          </p>
        )}

        {/* 6. Generic Loyalists */}
        {localPlayer.faction === "NAWAB" && charId !== "mir_madan" && charId !== "mohan_lal" && (
          <p className="text-xs text-slate-400">
            আপনি রাতের আঁধারে কাউকে দেখেননি। নবাবের অনুগত হয়ে যুক্তি ও ভোটে বাংলাকে রক্ষা করুন।
          </p>
        )}
      </div>

      {/* Ready Button */}
      <button
        onClick={handleAcknowledge}
        disabled={isAcknowledged}
        className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
          isAcknowledged
            ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
            : "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-emerald-950/60 cursor-pointer hover:scale-[1.01]"
        }`}
      >
        {isAcknowledged ? (
          <>
            <Check className="w-4 h-4 text-emerald-400" />
            অন্যদের অপেক্ষা করা হচ্ছে ({acknowledgedCount}/{totalCount})
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            আমি প্রস্তুত — সকাল শুরু করুন
          </>
        )}
      </button>
    </div>
  );
};
