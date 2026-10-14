"use client";

import React, { useState } from "react";
import { CharacterDef, Faction } from "@/types/game";
import { Shield, Sparkles, Crown, Swords, Crosshair, Eye, EyeOff, Flame, Skull, Coins, Anchor } from "lucide-react";

interface CardViewProps {
  character?: CharacterDef;
  faction?: Faction;
  isPeekable?: boolean;
  className?: string;
  isFlipped?: boolean;
  onFlipChange?: (flipped: boolean) => void;
}

export const CardView: React.FC<CardViewProps> = ({
  character,
  faction,
  isPeekable = true,
  className = "",
  isFlipped: controlledFlipped,
  onFlipChange,
}) => {
  const [internalFlipped, setInternalFlipped] = useState(!isPeekable);
  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;

  const handleCardClick = () => {
    if (!isPeekable) return;
    const next = !isFlipped;
    setInternalFlipped(next);
    onFlipChange?.(next);
  };

  const effectiveFaction = character?.faction || faction || "NAWAB";
  const isNawab = effectiveFaction === "NAWAB";

  // Icon selector based on character ID
  const getRoleIcon = (id?: string) => {
    switch (id) {
      case "mir_madan":
        return <Crosshair className="w-12 h-12 text-amber-300 drop-shadow" />;
      case "mohan_lal":
        return <Shield className="w-12 h-12 text-emerald-300 drop-shadow" />;
      case "siraj_ud_daulah":
        return <Crown className="w-12 h-12 text-amber-300 drop-shadow" />;
      case "mir_jafar":
        return <Swords className="w-12 h-12 text-rose-300 drop-shadow" />;
      case "ghoseti_begum":
        return <Eye className="w-12 h-12 text-purple-300 drop-shadow" />;
      case "ray_durlabh":
        return <Coins className="w-12 h-12 text-amber-400 drop-shadow" />;
      case "umichand":
        return <Anchor className="w-12 h-12 text-rose-300 drop-shadow" />;
      default:
        return isNawab ? (
          <Flame className="w-12 h-12 text-emerald-300 drop-shadow" />
        ) : (
          <Skull className="w-12 h-12 text-rose-300 drop-shadow" />
        );
    }
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* 3D Flip Card Container */}
      <div
        onClick={handleCardClick}
        className="w-64 sm:w-72 h-[380px] sm:h-[420px] cursor-pointer group perspective-1000"
      >
        <div
          className={`w-full h-full rounded-2xl relative transition-transform duration-500 transform-style-3d shadow-2xl ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* ================= CARD BACK ================= */}
          <div className="absolute inset-0 w-full h-full rounded-2xl backface-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-4 border-amber-600/70 p-3 shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Ornate Inner Border */}
            <div className="w-full h-full rounded-xl border-2 border-amber-500/40 border-dashed p-3 flex flex-col items-center justify-between relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px]">
              {/* Corner Symbols */}
              <div className="w-full flex justify-between text-amber-500/70 text-xs font-serif font-bold">
                <span>✦ 1757</span>
                <span>1757 ✦</span>
              </div>

              {/* Center Seal Medallion */}
              <div className="flex flex-col items-center justify-center my-auto space-y-3">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 border-4 border-amber-400/80 shadow-2xl flex items-center justify-center text-slate-950 relative">
                  <div className="w-20 h-20 rounded-full border-2 border-amber-300/40 border-dashed flex items-center justify-center">
                    <Swords className="w-10 h-10 text-amber-200 drop-shadow" />
                  </div>
                </div>

                <div className="text-center">
                  <div className="font-serif font-black text-2xl tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
                    পলাশী
                  </div>
                  <div className="text-[10px] tracking-widest uppercase font-mono text-amber-500/80 mt-0.5">
                    POLASHI • 1757
                  </div>
                </div>
              </div>

              {/* Tap to Flip Prompt */}
              <div className="w-full flex items-center justify-between text-slate-400 text-[10px] pt-1 border-t border-slate-800">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-amber-400" /> স্পর্শ করে উন্মোচন করুন
                </span>
                <span className="text-amber-500/70">✦</span>
              </div>
            </div>
          </div>

          {/* ================= CARD FRONT ================= */}
          <div
            className={`absolute inset-0 w-full h-full rounded-2xl backface-hidden rotate-y-180 border-4 p-3 shadow-2xl flex flex-col justify-between overflow-hidden ${
              isNawab
                ? "bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 border-emerald-500/90 shadow-emerald-950/80"
                : "bg-gradient-to-b from-rose-950 via-slate-900 to-slate-950 border-rose-500/90 shadow-rose-950/80"
            }`}
          >
            {/* Ornate Inner Frame */}
            <div
              className={`w-full h-full rounded-xl border-2 p-3 flex flex-col justify-between relative ${
                isNawab ? "border-emerald-500/40" : "border-rose-500/40"
              }`}
            >
              {/* Top Banner Ribbon */}
              <div className="flex items-center justify-between">
                <div
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-md ${
                    isNawab
                      ? "bg-emerald-900/80 border-emerald-400 text-emerald-200"
                      : "bg-rose-900/80 border-rose-400 text-rose-200"
                  }`}
                >
                  {isNawab ? <Flame className="w-3 h-3" /> : <Skull className="w-3 h-3" />}
                  <span>{isNawab ? "নবাব পক্ষ" : "কোম্পানি পক্ষ"}</span>
                </div>

                {character?.isSpecial && (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/50 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" /> বিশেষ চরিত্র
                  </span>
                )}
              </div>

              {/* Character Medallion & Name */}
              <div className="flex flex-col items-center justify-center my-auto text-center space-y-2">
                <div
                  className={`w-20 h-20 rounded-full border-4 shadow-xl flex items-center justify-center relative ${
                    isNawab
                      ? "bg-gradient-to-b from-emerald-800 to-emerald-950 border-emerald-400 shadow-emerald-900/50"
                      : "bg-gradient-to-b from-rose-800 to-rose-950 border-rose-400 shadow-rose-900/50"
                  }`}
                >
                  {getRoleIcon(character?.id)}
                </div>

                <div>
                  <h3 className="font-black text-lg sm:text-xl text-slate-100 tracking-tight leading-none">
                    {character?.nameBn || (isNawab ? "নবাবের অনুসারী" : "কোম্পানি এজেন্ট")}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5 uppercase tracking-wider">
                    {character?.nameEn || (isNawab ? "Nawab Loyalist" : "EIC Conspirator")}
                  </p>
                </div>
              </div>

              {/* Character Power Parchment Box */}
              <div
                className={`p-2.5 rounded-xl border text-[11px] leading-snug backdrop-blur-sm ${
                  isNawab
                    ? "bg-emerald-950/60 border-emerald-600/40 text-emerald-100"
                    : "bg-rose-950/60 border-rose-600/40 text-rose-100"
                }`}
              >
                <div className="font-bold text-[10px] uppercase tracking-wider mb-0.5 text-amber-300 flex items-center gap-1">
                  <span>ক্ষমতা / বৈশিষ্ট্য:</span>
                </div>
                <p className="line-clamp-4">
                  {character?.powerBn || (isNawab ? "নবাবের প্রতি অনুগত। ভোটে ও আলোচনায় দলের জয় নিশ্চিত করুন।" : "ইস্ট ইন্ডিয়া কোম্পানির স্বার্থে গোপনে অধ্যায়ে নাশকতা চালান।")}
                </p>
              </div>

              {/* Bottom Flip Indicator */}
              <div className="text-center pt-1 text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <EyeOff className="w-3 h-3" /> স্পর্শ করে কার্ড উল্টান
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Hint */}
      {isPeekable && (
        <button
          onClick={handleCardClick}
          className="mt-2 text-xs font-semibold text-amber-300/80 hover:text-amber-200 flex items-center gap-1.5 transition-colors"
        >
          {isFlipped ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{isFlipped ? "কার্ড আড়াল করুন" : "কার্ডের মুখ উন্মোচন করুন"}</span>
        </button>
      )}
    </div>
  );
};
