import type { Metadata } from "next";
import "./globals.css";
import { GameProvider } from "@/context/GameContext";

export const metadata: Metadata = {
  title: "পলাশী (Polashi) — ঐতিহাসিক সামাজিক ডিডাকশন গেম",
  description: "১৭৫৭ সালের পলাশীর যুদ্ধের ঐতিহাসিক প্রেক্ষাপটে সামাজিক ডিডাকশন বোর্ড গেম",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen selection:bg-emerald-500 selection:text-white">
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
