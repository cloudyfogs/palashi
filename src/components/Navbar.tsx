"use client";

import React, { useState } from "react";
import { useGame } from "@/context/GameContext";
import { isSoundEnabled, toggleSound } from "@/utils/sound";
import { Volume2, VolumeX, BookOpen, Clock, Copy, Check, LogOut } from "lucide-react";

interface NavbarProps {
  onOpenRules: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenRules }) => {
  const { gameState, roomCode, leaveRoom } = useGame();
  const [copied, setCopied] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleSound = () => {
    const updated = toggleSound();
    setSoundOn(updated);
  };

  const formatTimer = (seconds: number | null): string => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 text-slate-100 sticky top-0 z-40 px-3 sm:px-6 py-2.5 shadow-xl">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-amber-700 flex items-center justify-center font-serif font-black text-base text-amber-200 border border-amber-400/50 shadow">
            প
          </div>
          <div>
            <h1 className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-emerald-400 via-amber-200 to-amber-400 bg-clip-text text-transparent leading-none">
              পলাশী
            </h1>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest hidden sm:inline">
              POLASHI • 1757
            </span>
          </div>
        </div>

        {/* Center: Room Code & Timer */}
        {gameState && (
          <div className="flex items-center gap-2">
            {/* Room Code */}
            <button
              onClick={handleCopyCode}
              title="রুম কোড কপি করুন"
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-black text-amber-300 hover:border-amber-500 transition-colors"
            >
              <span className="text-slate-400">রুম:</span> {roomCode}
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {/* Countdown Timer */}
            {gameState.timerActive && gameState.timerRemaining !== null && (
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-mono font-bold text-xs transition-all ${
                  gameState.timerRemaining <= 15
                    ? "bg-rose-950 border-rose-500 text-rose-300 animate-pulse"
                    : "bg-slate-900 border-amber-500/40 text-amber-300"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(gameState.timerRemaining)}</span>
              </div>
            )}
          </div>
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-1.5">
          {/* Rules */}
          <button
            onClick={onOpenRules}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">নিয়ম</span>
          </button>

          {/* Sound */}
          <button
            onClick={handleToggleSound}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
            title={soundOn ? "সাউন্ড বন্ধ করুন" : "সাউন্ড চালু করুন"}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Leave */}
          {gameState && (
            <button
              onClick={leaveRoom}
              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-700/50 text-rose-300 transition-colors"
              title="রুম ত্যাগ করুন"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
