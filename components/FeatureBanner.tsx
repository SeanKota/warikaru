'use client';

import React from 'react';
import { Bot, Cpu, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export function FeatureBanner() {
  return (
    <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-indigo-800/50 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              Hybrid Architecture
            </span>
            <span className="text-xs text-slate-400">AI × 決定論的アルゴリズム</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            なぜ「AIの計算ミス」を防げるのか？
          </h2>
          <p className="text-xs text-indigo-200/80 mt-1 max-w-2xl leading-relaxed">
            LLMは条件抽出や会話理解が得意ですが、多人数・端数の算術計算や最小送金経路の最適化で計算ミス（ハルシネーション）を起こします。warikaruは「自然言語の整理はAI、計算・最適化は確実なTypeScriptエンジン」と分担することで、100%正確な精算を実現します。
          </p>
        </div>

        {/* Visual Flow diagram */}
        <div className="flex items-center gap-2 shrink-0 bg-white/5 p-3 rounded-xl border border-white/10 text-xs">
          <div className="text-center px-2">
            <Bot className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
            <span className="text-[11px] font-medium text-slate-200 block">AIの役割</span>
            <span className="text-[10px] text-slate-400">条件・文脈の整理</span>
          </div>

          <div className="text-indigo-400 font-bold">
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="text-center px-2">
            <Cpu className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <span className="text-[11px] font-medium text-slate-200 block">warikaru Engine</span>
            <span className="text-[10px] text-emerald-400 font-semibold">1円の狂いもゼロ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
