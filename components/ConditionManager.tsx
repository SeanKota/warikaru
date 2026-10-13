'use client';

import React, { useState } from 'react';
import { Sliders, Plus, Trash2, ChevronDown, ChevronUp, AlertCircle, HelpCircle } from 'lucide-react';
import { Condition, ConditionType, Payment } from '@/lib/types';
import { formatJPY } from '@/lib/utils';

interface ConditionManagerProps {
  conditions: Condition[];
  members: string[];
  payments: Payment[];
  onAddCondition: (c: Condition) => void;
  onUpdateCondition: (index: number, updated: Condition) => void;
  onRemoveCondition: (index: number) => void;
}

export function ConditionManager({
  conditions,
  members,
  payments,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
}: ConditionManagerProps) {
  const [isOpen, setIsOpen] = useState(true);

  // 新規条件の入力ステート
  const [newType, setNewType] = useState<ConditionType>('weight');
  const [newMember, setNewMember] = useState<string>(members[0] || '');
  const [newWeight, setNewWeight] = useState<number>(1.5);
  const [newAmount, setNewAmount] = useState<number>(1000);
  const [newPaymentDesc, setNewPaymentDesc] = useState<string>('');
  const [newReason, setNewReason] = useState<string>('');

  const handleAdd = () => {
    if (!newMember) return;

    const condition: Condition = {
      type: newType,
      member: newMember,
      paymentDescription: newPaymentDesc || undefined,
      description: newReason || undefined,
    };

    if (newType === 'weight') {
      condition.weight = Number(newWeight) || 1.0;
    } else if (newType === 'fixed_discount') {
      condition.amount = Number(newAmount) || 0;
    }

    onAddCondition(condition);
    setNewReason('');
  };

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm transition hover:shadow-md overflow-hidden">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/50 transition"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center font-semibold">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">柔軟な条件設定（傾斜・除外・割引）</h2>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                {conditions.length} 件設定中
              </span>
            </div>
            <p className="text-xs text-slate-500">
              役職傾斜、不参加支払いの除外、遅刻割引などを個別指定
            </p>
          </div>
        </div>
        <div className="text-slate-400 p-1">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 pt-0 border-t border-slate-100 space-y-4">
          {/* Active conditions list */}
          {conditions.length > 0 && (
            <div className="space-y-2 pt-3">
              {conditions.map((c, idx) => {
                let badgeText = '';
                let detailText = '';

                if (c.type === 'exclude') {
                  badgeText = '除外';
                  detailText = `${c.member} さんを${c.paymentDescription ? `「${c.paymentDescription}」から` : '支払いから'}除外`;
                } else if (c.type === 'weight') {
                  badgeText = '比率・傾斜';
                  detailText = `${c.member} さん: ${c.weight || 1.0}倍負担${c.paymentDescription ? `（${c.paymentDescription}）` : '（全体）'}`;
                } else if (c.type === 'fixed_discount') {
                  badgeText = '固定割引';
                  detailText = `${c.member} さん: -${(c.amount || 0).toLocaleString()}円${c.paymentDescription ? `（${c.paymentDescription}）` : '（全体）'}`;
                }

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold px-2 py-0.5 rounded-md bg-white text-indigo-700 border border-indigo-100 text-[10px]">
                        {badgeText}
                      </span>
                      <span className="font-medium text-slate-800">{detailText}</span>
                      {c.description && (
                        <span className="text-slate-400 hidden sm:inline">
                          — {c.description}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveCondition(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition"
                      title="この条件を削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add condition form */}
          <div className="p-4 rounded-xl bg-indigo-50/30 border border-indigo-100 space-y-3">
            <span className="text-xs font-semibold text-slate-700 block">
              + 新しい条件を追加
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              {/* Type Select */}
              <div className="sm:col-span-3">
                <label className="text-[11px] text-slate-500 block mb-1">条件タイプ</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as ConditionType)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="weight">比率・傾斜 (weight)</option>
                  <option value="exclude">特定支払い除外 (exclude)</option>
                  <option value="fixed_discount">固定割引 (fixed discount)</option>
                </select>
              </div>

              {/* Target Member Select */}
              <div className="sm:col-span-3">
                <label className="text-[11px] text-slate-500 block mb-1">対象メンバー</label>
                <select
                  value={newMember || (members[0] || '')}
                  onChange={(e) => setNewMember(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  {members.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Value input (Weight or Amount) */}
              {newType === 'weight' && (
                <div className="sm:col-span-3">
                  <label className="text-[11px] text-slate-500 block mb-1">負担比率（倍率）</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={newWeight}
                    onChange={(e) => setNewWeight(parseFloat(e.target.value) || 1.0)}
                    placeholder="例: 1.5, 0.5"
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-white font-medium"
                  />
                </div>
              )}

              {newType === 'fixed_discount' && (
                <div className="sm:col-span-3">
                  <label className="text-[11px] text-slate-500 block mb-1">割引額 (円)</label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={newAmount}
                    onChange={(e) => setNewAmount(parseInt(e.target.value, 10) || 0)}
                    placeholder="例: 1000"
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-white font-medium"
                  />
                </div>
              )}

              {/* Specific Payment (Optional) */}
              <div className={newType === 'exclude' ? 'sm:col-span-6' : 'sm:col-span-3'}>
                <label className="text-[11px] text-slate-500 block mb-1">対象支払い（任意）</label>
                <select
                  value={newPaymentDesc}
                  onChange={(e) => setNewPaymentDesc(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">全支払い（全体適用）</option>
                  {payments.map((p, idx) => (
                    <option key={idx} value={p.description || `支払い #${idx + 1}`}>
                      {p.description || `支払い #${idx + 1}`} ({formatJPY(p.amount)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reason description & Add button */}
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <input
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="理由メモ (例: 幹事手当で1.5倍、タクシー乗っていないため除外)"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white placeholder-slate-400"
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={members.length === 0}
                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>条件を追加</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
