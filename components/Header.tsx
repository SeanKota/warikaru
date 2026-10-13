'use client';

import React from 'react';
import { Calculator, Sparkles, FileCode2, ShieldCheck } from 'lucide-react';
import { PRESETS, Preset } from '@/lib/presets';

interface HeaderProps {
  onSelectPreset: (preset: Preset) => void;
  onOpenLlmModal: () => void;
}

export function Header({ onSelectPreset, onOpenLlmModal }: HeaderProps) {
  return (
    <header className="border-b border-indigo-100 bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                warikaru
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  割軽
                </span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                高信頼エンジン
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">
              AIの計算ミスを防ぐ、決定論的割り勘・最小送金最適化エンジン
            </p>
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 font-medium px-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              例:
            </span>
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectPreset(p)}
                className="px-2 py-1 rounded-md text-xs font-medium text-slate-700 hover:text-indigo-700 hover:bg-white transition shadow-2xs hover:shadow-xs"
                title={p.description}
              >
                {p.name.split('（')[0]}
              </button>
            ))}
          </div>

          {/* llm.txt & API button */}
          <button
            onClick={onOpenLlmModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-xs hover:shadow-indigo-200"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>llm.txt / API仕様</span>
          </button>
        </div>
      </div>
    </header>
  );
}
