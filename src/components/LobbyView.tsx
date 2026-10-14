"use client";

import React, { useState } from "react";
import { useGame } from "@/context/GameContext";
import { GameSettings, GameMode } from "@/types/game";
import { PLAYER_BALANCE } from "@/constants/rules";
import { Users, Clock, Sparkles, Play, LogIn, Plus, Flame, Skull, Copy, Check, Bot, Trash2 } from "lucide-react";

export const LobbyView: React.FC = () => {
  const {
    gameState,
    roomCode,
    isHost,
    isHotseat,
    createRoom,
    joinRoom,
    dispatchAction,
    connectionStatus,
    errorMessage,
  } = useGame();

  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [playerName, setPlayerName] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [copied, setCopied] = useState(false);

  // Settings state
  const [playerCount, setPlayerCount] = useState<number>(5);
  const [botCount, setBotCount] = useState<number>(0);
  const [mode, setMode] = useState<GameMode>("BASIC");
  const [useTimers, setUseTimers] = useState<boolean>(true);
  const [nominationMins, setNominationMins] = useState<number>(3);
  const [votingMins, setVotingMins] = useState<number>(1);
  const [assassinationMins, setAssassinationMins] = useState<number>(5);
  const [isHotseatToggle, setIsHotseatToggle] = useState<boolean>(false);

  const balance = PLAYER_BALANCE[playerCount] || PLAYER_BALANCE[5];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const settings: GameSettings = {
      playerCount,
      mode,
      useTimers,
      nominationTimeSeconds: nominationMins * 60,
      votingTimeSeconds: votingMins * 60,
      assassinationTimeSeconds: assassinationMins * 60,
    };
    createRoom(playerName, settings, isHotseatToggle, botCount);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    joinRoom(joinCodeInput, playerName);
  };

  const handleStartGame = () => {
    dispatchAction({ type: "START_GAME" });
  };

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // If in an active room lobby
  if (gameState) {
    const joinedCount = gameState.players.length;
    const requiredCount = gameState.settings.playerCount;
    const isFull = joinedCount >= requiredCount;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Room Header Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 text-xs font-semibold">
            {gameState.settings.mode === "EXTRA" ? "অতিরিক্ত চরিত্র মোড (Extra Mode)" : "বেসিক মোড (Basic Mode)"}
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              লবিতে স্বাগতম
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              বন্ধুদের এই রুম কোডটি দিয়ে খেলায় যোগ দিতে বলুন
            </p>
          </div>

          {/* Room Code Display */}
          <div className="flex items-center justify-center gap-3">
            <div className="px-5 py-2.5 rounded-xl bg-slate-950 border-2 border-amber-500/60 font-mono text-2xl sm:text-3xl font-black text-amber-300 tracking-widest shadow-inner">
              {roomCode}
            </div>
            <button
              onClick={handleCopyCode}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
              title="রুম কোড কপি করুন"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-slate-300" />}
            </button>
          </div>

          {/* Hotseat advice */}
          {isHotseat && (
            <p className="text-xs text-purple-300 bg-purple-950/40 border border-purple-800/40 py-1.5 px-3 rounded-xl">
              💡 আপনি <strong>Hotseat মোডে</strong> আছেন। উপরের ন্যাভবারের প্লেয়ার সুইচার দিয়ে প্রতিটি প্লেয়ারের টার্ন পরিচালনা করা যাবে।
            </p>
          )}

          {/* Voice Chat Advice */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 text-left">
            <strong className="text-slate-300">🎙️ ভয়েস আলোচনার পরামর্শ:</strong> পলাশী তীব্র আলোচনার খেলা। বন্ধুদের সাথে খেলার সময় ব্যাকগ্রাউন্ডে <strong>Discord</strong> বা <strong>Messenger / Google Meet</strong> কল অন রেখে ব্রাউজারে এই গেমটি খেলুন।
          </div>
        </div>

        {/* Players List Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              সংযুক্ত খেলোয়াড় ({joinedCount}/{requiredCount})
            </h3>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                isFull
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-600/40"
                  : "bg-amber-950 text-amber-300 border border-amber-600/40"
              }`}
            >
              {isFull ? "দল পূর্ণ হয়েছে" : `আরো ${requiredCount - joinedCount} জন প্রয়োজন`}
            </span>
          </div>

          {/* AI Bot Quick Controls for Host */}
          {isHost && !isFull && !isHotseat && (
            <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
              <button
                type="button"
                onClick={() => dispatchAction({ type: "ADD_BOT" })}
                className="px-3 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-500/50 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                <span>+ ১টি AI রোবট যোগ করুন</span>
              </button>
              <button
                type="button"
                onClick={() => dispatchAction({ type: "FILL_BOTS" })}
                className="px-3 py-1.5 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>বাকি {requiredCount - joinedCount}টি স্লট রোবট দিয়ে পূরণ করুন</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {gameState.players.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-amber-700 flex items-center justify-center font-bold text-xs text-white">
                    {idx + 1}
                  </div>
                  <span className="font-semibold text-slate-200">{p.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {p.isBot && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-600/40 flex items-center gap-1">
                      <Bot className="w-3 h-3 text-purple-400" /> Bot
                    </span>
                  )}
                  {p.isHost && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-600/40">
                      Host
                    </span>
                  )}
                  {isHost && p.isBot && (
                    <button
                      onClick={() => dispatchAction({ type: "REMOVE_BOT", botId: p.id })}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="রোবট সরান"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Host Start Game Controls */}
          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={!isFull}
              className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all ${
                isFull
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-emerald-950/50 cursor-pointer"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              {isFull ? "খেলা শুরু করুন" : `সবাই যোগ দিলে শুরু হবে (${joinedCount}/${requiredCount})`}
            </button>
          ) : (
            <p className="text-center text-xs text-slate-400 animate-pulse pt-2">
              হোস্ট খেলা শুরু করার জন্য অপেক্ষা করা হচ্ছে...
            </p>
          )}
        </div>
      </div>
    );
  }

  // Lobby Form (Create or Join)
  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Tab Switcher */}
      <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-2xl">
        <button
          onClick={() => setActiveTab("create")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
            activeTab === "create"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Plus className="w-4 h-4" /> গেম তৈরি করুন (Create)
        </button>
        <button
          onClick={() => setActiveTab("join")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
            activeTab === "join"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <LogIn className="w-4 h-4" /> গেমে যোগ দিন (Join)
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-600/50 text-rose-200 text-xs text-center font-medium">
          {errorMessage}
        </div>
      )}

      {/* Create Game Form */}
      {activeTab === "create" ? (
        <form onSubmit={handleCreate} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          {/* Player Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              আপনার নাম (Host Name)
            </label>
            <input
              type="text"
              required
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name (e.g. Alex)"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Player Count Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                খেলোয়াড় সংখ্যা (Player Count)
              </label>
              <span className="text-sm font-mono font-bold text-amber-300">
                {playerCount} জন
              </span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {[5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setPlayerCount(num)}
                  className={`py-2 rounded-xl text-sm font-mono font-bold border transition-all ${
                    playerCount === num
                      ? "bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-950/50"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Faction Balance Preview */}
            <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Flame className="w-3.5 h-3.5" /> নবাব পক্ষ: {balance.nawabCount} জন
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <Skull className="w-3.5 h-3.5" /> কোম্পানি পক্ষ: {balance.eicCount} জন
              </span>
            </div>
          </div>

          {/* Mode Selection (Basic vs Extra) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              খেলার মোড (Game Mode)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode("BASIC")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === "BASIC"
                    ? "bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/50"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="font-bold text-sm text-slate-100">স্বাভাবিক মোড (Basic)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  শুধুমাত্র মীর মদন ও মীর জাফর বিশেষ চরিত্রে
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode("EXTRA")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === "EXTRA"
                    ? "bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/50"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="font-bold text-sm text-slate-100 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> অতিরিক্ত চরিত্র (Extra)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  মোহন লাল, রায় দুর্লভ, উমিচাঁদ ও ঘষেটি বেগম সহ
                </div>
              </button>
            </div>
          </div>

          {/* Customizable Timers */}
          <div className="pt-2 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  আলোচনার সময়সীমা (Timers)
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useTimers}
                  onChange={(e) => setUseTimers(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {useTimers ? (
              <div className="grid sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400">দল আলোচনা:</span>
                  <select
                    value={nominationMins}
                    onChange={(e) => setNominationMins(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200 font-semibold focus:outline-none"
                  >
                    <option value={1}>১ মিনিট</option>
                    <option value={2}>২ মিনিট</option>
                    <option value={3}>৩ মিনিট (Default)</option>
                    <option value={5}>৫ মিনিট</option>
                  </select>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400">ভোট আলোচনা:</span>
                  <select
                    value={votingMins}
                    onChange={(e) => setVotingMins(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200 font-semibold focus:outline-none"
                  >
                    <option value={1}>১ মিনিট (Default)</option>
                    <option value={2}>২ মিনিট</option>
                    <option value={3}>৩ মিনিট</option>
                  </select>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400">মীর জাফর আলোচনা:</span>
                  <select
                    value={assassinationMins}
                    onChange={(e) => setAssassinationMins(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200 font-semibold focus:outline-none"
                  >
                    <option value={2}>২ মিনিট</option>
                    <option value={3}>৩ মিনিট</option>
                    <option value={5}>৫ মিনিট (Default)</option>
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                টাইমার বন্ধ রাখা হয়েছে — সবাই সিদ্ধান্ত ও ভোট সাবমিট করার পর স্বয়ংক্রিয়ভাবে পরবর্তী ধাপে যাবে।
              </p>
            )}
          </div>

          {/* AI Bot Count Selection */}
          {!isHotseatToggle && (
            <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                    রোবট প্লেয়ার যোগ করুন (AI Bots)
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {botCount === 0 ? "কোনো রোবট নেই" : `${botCount} জন রোবট`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
                  .filter((n) => n < playerCount)
                  .map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setBotCount(n)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                        botCount === n
                          ? "bg-purple-600 border-purple-400 text-white shadow"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
              </div>
              <p className="text-[11px] text-purple-300/70">
                {botCount === playerCount - 1
                  ? "💡 আপনি একা বাকি সব AI রোবটের সাথে একক ম্যাচ (Solo vs Bots) খেলবেন!"
                  : botCount > 0
                  ? `💡 খেলায় আপনার সাথে ${botCount} জন AI রোবট খেলবে। বাকি স্লটে বন্ধুরা যোগ দিতে পারবে।`
                  : "💡 কোনো রোবট থাকবে না। লবিতে পরবর্তীতেও রোবট যোগ করা যাবে।"}
              </p>
            </div>
          )}

          {/* Hotseat Mode Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/20 border border-purple-800/30">
            <div>
              <div className="text-xs font-bold text-purple-200">একক ডিভাইসে খেলুন (Hotseat / Pass & Play)</div>
              <div className="text-[11px] text-purple-300/70">একাধিক ফোন না থাকলে একই স্ক্রিনে বন্ধুদের সাথে খেলার জন্য</div>
            </div>
            <input
              type="checkbox"
              checked={isHotseatToggle}
              onChange={(e) => setIsHotseatToggle(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700 cursor-pointer"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
          >
            রুম তৈরি করুন (Create Room)
          </button>
        </form>
      ) : (
        /* Join Game Form */
        <form onSubmit={handleJoin} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              আপনার নাম
            </label>
            <input
              type="text"
              required
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name (e.g. Jordan)"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              রুম কোড (Room Code)
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="যেমন: PLS24"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 font-mono text-xl tracking-widest text-center text-amber-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={connectionStatus === "connecting"}
            className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
          >
            {connectionStatus === "connecting" ? "সংযুক্ত হচ্ছে..." : "গেমে প্রবেশ করুন (Join Game)"}
          </button>
        </form>
      )}
    </div>
  );
};
