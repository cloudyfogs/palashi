"use client";

import React, { useState } from "react";
import { X, Shield, Swords, Flame, Skull, AlertTriangle, Users } from "lucide-react";
import { CHARACTERS } from "@/constants/cards";

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"basics" | "characters" | "tables">("basics");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-emerald-800/60 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-100">পলাশী — গেমের নিয়মাবলী ও গাইড</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 pt-2 gap-4 text-sm font-semibold">
          <button
            onClick={() => setActiveTab("basics")}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === "basics"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-300"
            }`}
          >
            মৌলিক নিয়ম (Overview)
          </button>
          <button
            onClick={() => setActiveTab("tables")}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === "tables"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-300"
            }`}
          >
            প্লেয়ার ও অধ্যায় ছক (Tables)
          </button>
          <button
            onClick={() => setActiveTab("characters")}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === "characters"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-300"
            }`}
          >
            চরিত্র ও ক্ষমতা (Characters)
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm leading-relaxed text-slate-300">
          {activeTab === "basics" && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold mb-2">
                    <Flame className="w-4 h-4" /> নবাব পক্ষ (Loyalists — সবুজ)
                  </div>
                  <p className="text-xs text-slate-300">
                    বাংলার মসনদ রক্ষা করতে ৫টি অধ্যায়ের মধ্যে অন্তত ৩টি অধ্যায়ে সফল হওয়া এবং প্রধান সেনাপতি মীর মদনকে সুরক্ষিত রাখা।
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/40">
                  <div className="flex items-center gap-2 text-rose-300 font-bold mb-2">
                    <Skull className="w-4 h-4" /> কোম্পানি পক্ষ (EIC — লাল)
                  </div>
                  <p className="text-xs text-slate-300">
                    অন্তর্ঘাত চালিয়ে ৩টি অধ্যায় নস্যাৎ করা, অথবা টানা ৫ বার ভোট বাতিল করানো, অথবা নবাব পক্ষ ৩ জয় পেলে মীর মদনকে চিহ্নিত করে হত্যা করা।
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
                  <Swords className="w-4 h-4 text-amber-400" /> গেমের ধাপসমূহ
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm pl-1">
                  <li>
                    <strong className="text-slate-200">পরিচয় পর্ব (Night Phase):</strong> রাতের শুরুতে চোখ বন্ধ রেখে বিশেষ চরিত্ররা নিজেদের তথ্য জেনে নেয়।
                  </li>
                  <li>
                    <strong className="text-slate-200">দল গঠন পর্ব (Nomination):</strong> সেনাপতি ছক অনুযায়ী প্লেয়ার মনোনীত করেন।
                  </li>
                  <li>
                    <strong className="text-slate-200">ভোট পর্ব (Council Vote):</strong> সবাই গোপনে হ্যাঁ বা না ভোট দেন। সংখ্যাগরিষ্ঠ হ্যাঁ পেলেই দল অভিযানে যায়। টানা ৫ বার ভোট ব্যর্থ হলে EIC সরাসরি জয়ী হয়।
                  </li>
                  <li>
                    <strong className="text-slate-200">অধ্যায় পর্ব (Chapter Mission):</strong> দলের সদস্যরা গোপনে সাফল্য বা বিশ্বাসঘাতকতা কার্ড জমা দেন। ১টি (বা ৪র্থ অধ্যায়ে ২টি) ব্যর্থ কার্ড পড়লেই অধ্যায় ব্যর্থ হয়।
                  </li>
                  <li>
                    <strong className="text-slate-200">মীর জাফরের শেষ আঘাত:</strong> নবাব ৩টি জয় পেলে মীর জাফর মীর মদনকে হত্যার সুযোগ পায়। অনুমান সঠিক হলে কোম্পানি জয়ী হয়!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === "tables" && (
            <div className="space-y-6">
              {/* Player Count Balance Table */}
              <div>
                <h3 className="font-bold text-slate-200 mb-2.5 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" /> প্লেয়ার বণ্টন ছক (Player Balance)
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950/70 text-slate-300">
                      <tr>
                        <th className="p-2.5">প্লেয়ার</th>
                        <th className="p-2.5">নবাব পক্ষ (সবুজ)</th>
                        <th className="p-2.5">কোম্পানি পক্ষ (লাল)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      <tr><td className="p-2.5 font-sans font-semibold">৫ জন</td><td className="p-2.5 text-emerald-400">৩ (২ সাধারণ + মীর মদন)</td><td className="p-2.5 text-rose-400">২ (১ সাধারণ + মীর জাফর)</td></tr>
                      <tr><td className="p-2.5 font-sans font-semibold">৬ জন</td><td className="p-2.5 text-emerald-400">৪ (৩ সাধারণ + মীর মদন)</td><td className="p-2.5 text-rose-400">২ (১ সাধারণ + মীর জাফর)</td></tr>
                      <tr><td className="p-2.5 font-sans font-semibold">৭ জন</td><td className="p-2.5 text-emerald-400">৪ (৩ সাধারণ + মীর মদন)</td><td className="p-2.5 text-rose-400">৩ (২ সাধারণ + মীর জাফর)</td></tr>
                      <tr><td className="p-2.5 font-sans font-semibold">৮ জন</td><td className="p-2.5 text-emerald-400">৫ (৪ সাধারণ + মীর মদন)</td><td className="p-2.5 text-rose-400">৩ (২ সাধারণ + মীর জাফর)</td></tr>
                      <tr><td className="p-2.5 font-sans font-semibold">৯ জন</td><td className="p-2.5 text-emerald-400">৬ (৫ সাধারণ + মীর মদন)</td><td className="p-2.5 text-rose-400">৩ (২ সাধারণ + মীর জাফর)</td></tr>
                      <tr><td className="p-2.5 font-sans font-semibold">১০ জন</td><td className="p-2.5 text-emerald-400">৬ (৫ সাধারণ + মীর মদন)</td><td className="p-2.5 text-rose-400">৪ (৩ সাধারণ + মীর জাফর)</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Squad Size per Chapter Table */}
              <div>
                <h3 className="font-bold text-slate-200 mb-2.5 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" /> অধ্যায় অনুযায়ী দল সদস্য সংখ্যা (Squad Sizes)
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-xs text-center font-mono">
                    <thead className="bg-slate-950/70 text-slate-300 font-sans">
                      <tr>
                        <th className="p-2.5 text-left">অধ্যায়</th>
                        <th className="p-2.5">৫ জন</th>
                        <th className="p-2.5">৬ জন</th>
                        <th className="p-2.5">৭ জন</th>
                        <th className="p-2.5">৮ জন</th>
                        <th className="p-2.5">৯ জন</th>
                        <th className="p-2.5">১০ জন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      <tr><td className="p-2.5 text-left font-sans">১ম অধ্যায়</td><td>২</td><td>২</td><td>২</td><td>৩</td><td>৩</td><td>৩</td></tr>
                      <tr><td className="p-2.5 text-left font-sans">২য় অধ্যায়</td><td>৩</td><td>৩</td><td>৩</td><td>৪</td><td>৪</td><td>৪</td></tr>
                      <tr><td className="p-2.5 text-left font-sans">৩য় অধ্যায়</td><td>২</td><td>৪</td><td>৩</td><td>৪</td><td>৪</td><td>৪</td></tr>
                      <tr className="bg-amber-950/20 text-amber-300 font-bold"><td className="p-2.5 text-left font-sans">৪র্থ অধ্যায় (*)</td><td>৩</td><td>৩</td><td>৪*</td><td>৫*</td><td>৫*</td><td>৫*</td></tr>
                      <tr><td className="p-2.5 text-left font-sans">৫ম অধ্যায়</td><td>৩</td><td>৪</td><td>৪</td><td>৫</td><td>৫</td><td>৫</td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-xs text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span><strong>(*) তারকাযুক্ত নিয়ম:</strong> ৭ বা তার বেশি প্লেয়ারের খেলায় ৪র্থ অধ্যায়ে EIC জয়ের জন্য কমপক্ষে ২টি ব্যর্থ কার্ড প্রয়োজন।</span>
                </p>
              </div>
            </div>
          )}

          {activeTab === "characters" && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-200">বিশেষ চরিত্রসমূহ (Special Roles)</h3>
              <div className="grid gap-3">
                {Object.values(CHARACTERS)
                  .filter((c) => c.isSpecial)
                  .map((c) => (
                    <div
                      key={c.id}
                      className={`p-3.5 rounded-xl border ${
                        c.faction === "NAWAB"
                          ? "bg-emerald-950/30 border-emerald-800/40"
                          : "bg-rose-950/30 border-rose-800/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-slate-100">
                          {c.nameBn} ({c.nameEn})
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            c.faction === "NAWAB"
                              ? "bg-emerald-900/60 text-emerald-300"
                              : "bg-rose-900/60 text-rose-300"
                          }`}
                        >
                          {c.faction === "NAWAB" ? "নবাব পক্ষ" : "EIC পক্ষ"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mb-1">{c.descriptionBn}</p>
                      <p className="text-xs text-amber-300/90 font-medium">
                        <strong>ক্ষমতা:</strong> {c.powerBn}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
