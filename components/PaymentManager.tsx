'use client';

import React from 'react';
import { Receipt, Plus, Trash2, Users, DollarSign, Tag } from 'lucide-react';
import { Payment } from '@/lib/types';
import { formatJPY } from '@/lib/utils';

interface PaymentManagerProps {
  payments: Payment[];
  members: string[];
  onAddPayment: () => void;
  onUpdatePayment: (index: number, updated: Payment) => void;
  onRemovePayment: (index: number) => void;
}

export function PaymentManager({
  payments,
  members,
  onAddPayment,
  onUpdatePayment,
  onRemovePayment,
}: PaymentManagerProps) {
  const totalAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const handleToggleMember = (paymentIdx: number, payment: Payment, member: string) => {
    const currentTargets = payment.targetMembers && payment.targetMembers.length > 0
      ? [...payment.targetMembers]
      : [...members];

    let newTargets: string[];
    if (currentTargets.includes(member)) {
      newTargets = currentTargets.filter((m) => m !== member);
    } else {
      newTargets = [...currentTargets, member];
    }

    onUpdatePayment(paymentIdx, {
      ...payment,
      targetMembers: newTargets.length === members.length ? undefined : newTargets,
    });
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-semibold">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">立替・支払い一覧</h2>
            <p className="text-xs text-slate-500">誰が何にいくら支払ったかを登録</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">立替総額</span>
          <span className="text-base font-bold text-indigo-600">
            {formatJPY(totalAmount)}
          </span>
        </div>
      </div>

      {/* Payment cards */}
      <div className="space-y-3.5 mb-4">
        {payments.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <p className="text-xs text-slate-400 mb-2">まだ立替情報がありません</p>
            <button
              type="button"
              onClick={onAddPayment}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              最初の立替を追加
            </button>
          </div>
        ) : (
          payments.map((p, idx) => {
            const isCustomTargets = p.targetMembers !== undefined && p.targetMembers.length > 0;
            const currentTargets = isCustomTargets ? p.targetMembers! : members;

            return (
              <div
                key={p.id || idx}
                className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/30 hover:border-indigo-200 hover:bg-white transition space-y-3"
              >
                {/* Row 1: Description, Amount, Payer, Delete */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                  {/* Description */}
                  <div className="sm:col-span-5 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={p.description || ''}
                      onChange={(e) =>
                        onUpdatePayment(idx, { ...p, description: e.target.value })
                      }
                      placeholder={`名目 (例: 一次会、タクシー代)`}
                      className="w-full text-xs sm:text-sm pl-8 pr-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                    />
                  </div>

                  {/* Amount */}
                  <div className="sm:col-span-3 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-medium text-xs">
                      ¥
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={p.amount === 0 ? '' : p.amount}
                      onChange={(e) =>
                        onUpdatePayment(idx, {
                          ...p,
                          amount: Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                      placeholder="金額 (円)"
                      className="w-full text-xs sm:text-sm pl-7 pr-3 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                    />
                  </div>

                  {/* PaidBy Select */}
                  <div className="sm:col-span-3">
                    <select
                      value={p.paidBy}
                      onChange={(e) =>
                        onUpdatePayment(idx, { ...p, paidBy: e.target.value })
                      }
                      className="w-full text-xs sm:text-sm px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-indigo-500"
                    >
                      {members.map((m) => (
                        <option key={m} value={m}>
                          立替: {m}
                        </option>
                      ))}
                      {!members.includes(p.paidBy) && (
                        <option value={p.paidBy}>{p.paidBy} (未登録)</option>
                      )}
                    </select>
                  </div>

                  {/* Delete Button */}
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onRemovePayment(idx)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="この支払いを削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Row 2: Target members participation toggle */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Users className="w-3.5 h-3.5" />
                    <span>参加メンバー:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {members.map((m) => {
                      const isParticipating = currentTargets.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleToggleMember(idx, p, m)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition ${
                            isParticipating
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-70'
                          }`}
                          title={isParticipating ? `${m}は参加` : `${m}はこの支払いから除外`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Payment Button */}
      <button
        type="button"
        onClick={onAddPayment}
        className="w-full py-2.5 px-4 rounded-xl border border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50 text-indigo-600 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition"
      >
        <Plus className="w-4 h-4" />
        <span>新しい立替を追加</span>
      </button>
    </div>
  );
}
