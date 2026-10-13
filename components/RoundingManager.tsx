'use client';

import React from 'react';
import { Coins, HelpCircle } from 'lucide-react';
import { CalculateOptions, RoundingUnit, RoundingMode } from '@/lib/types';

interface RoundingManagerProps {
  options: CalculateOptions;
  onChangeOptions: (updated: CalculateOptions) => void;
}

export function RoundingManager({ options, onChangeOptions }: RoundingManagerProps) {
  const currentUnit = options.roundingUnit || 1;
  const currentMode = options.roundingMode || 'round';

  const units: { label: string; value: RoundingUnit }[] = [
    { label: '1円単位 (正確)', value: 1 },
    { label: '10円単位', value: 10 },
    { label: '100円単位', value: 100 },
    { label: '1,000円単位', value: 1000 },
  ];

  const modes: { label: string; value: RoundingMode }[] = [
    { label: '四捨五入', value: 'round' },
    { label: '切り捨て', value: 'floor' },
    { label: '切り上げ', value: 'ceil' },
  ];

  return (
    <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-semibold">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-800">端数・丸め設定</h3>
            <p className="text-[11px] text-slate-400">
              送金しやすい単位に金額を揃えます
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Unit selection */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            {units.map((u) => (
              <button
                key={u.value}
                type="button"
                onClick={() => onChangeOptions({ ...options, roundingUnit: u.value })}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  currentUnit === u.value
                    ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>

          {/* Mode selection (only relevant if unit > 1) */}
          {currentUnit > 1 && (
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              {modes.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => onChangeOptions({ ...options, roundingMode: m.value })}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    currentMode === m.value
                      ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
