'use client';

import React from 'react';
import { Calculator, Sparkles } from 'lucide-react';
import { PRESETS, Preset } from '@/lib/presets';

interface HeaderProps {
  onSelectPreset: (preset: Preset) => void;
  onOpenLlmModal: () => void;
}

export function Header({ onSelectPreset }: HeaderProps) {
  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              warikaru
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                割軽
              </span>
            </h1>
            <p className="text-[11px] text-slate-500">
              最小の送金回数でスッキリ割り勘
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-500 font-medium px-1 hidden sm:flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3 h-3 text-amber-500" />
            サンプル:
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPreset(p)}
              className="px-2 py-1 rounded-md text-xs font-medium text-slate-700 hover:text-indigo-700 hover:bg-white transition"
              title={p.description}
            >
              {p.name.split('（')[0]}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
