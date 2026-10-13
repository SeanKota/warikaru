'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { MemberManager } from '@/components/MemberManager';
import { PaymentManager } from '@/components/PaymentManager';
import { ConditionManager } from '@/components/ConditionManager';
import { RoundingManager } from '@/components/RoundingManager';
import { ResultDisplay } from '@/components/ResultDisplay';
import { LlmSpecModal } from '@/components/LlmSpecModal';
import { CalculateRequest, Condition, Payment, CalculateOptions } from '@/lib/types';
import { calculateSettlement } from '@/lib/calculate';
import { parseQueryToCalculateRequest } from '@/lib/queryParser';
import { PRESETS, Preset } from '@/lib/presets';

export default function HomePage() {
  const defaultPreset = PRESETS[0];

  const [members, setMembers] = useState<string[]>(defaultPreset.data.members);
  const [payments, setPayments] = useState<Payment[]>(defaultPreset.data.payments);
  const [conditions, setConditions] = useState<Condition[]>(defaultPreset.data.conditions || []);
  const [options, setOptions] = useState<CalculateOptions>(defaultPreset.data.options || {
    roundingUnit: 100,
    roundingMode: 'round',
    roundingTarget: 'highest_share',
  });

  const [isLlmModalOpen, setIsLlmModalOpen] = useState(false);

  // URLにパラメータが付与されている場合、自動で復元する
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search && window.location.search.length > 1) {
      try {
        const parsed = parseQueryToCalculateRequest(window.location.search);
        if (parsed.members && parsed.members.length > 0) {
          setMembers(parsed.members);
        }
        if (parsed.payments && parsed.payments.length > 0) {
          setPayments(parsed.payments);
        }
        if (parsed.conditions) {
          setConditions(parsed.conditions);
        }
        if (parsed.options) {
          setOptions(parsed.options);
        }
      } catch (e) {
        console.error('Failed to parse query params', e);
      }
    }
  }, []);

  const currentRequest: CalculateRequest = useMemo(() => {
    return {
      members,
      payments,
      conditions,
      options,
    };
  }, [members, payments, conditions, options]);

  const { response, error } = useMemo(() => {
    try {
      if (members.length === 0) {
        return { response: null, error: 'メンバーを1名以上指定してください。' };
      }
      const res = calculateSettlement(currentRequest);
      return { response: res, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '計算中にエラーが発生しました。';
      return { response: null, error: msg };
    }
  }, [currentRequest, members]);

  const handleSelectPreset = (preset: Preset) => {
    setMembers(preset.data.members);
    setPayments(preset.data.payments);
    setConditions(preset.data.conditions || []);
    if (preset.data.options) {
      setOptions(preset.data.options);
    }
  };

  const handleAddMember = (name: string) => {
    if (!members.includes(name)) {
      setMembers([...members, name]);
    }
  };

  const handleRemoveMember = (name: string) => {
    setMembers(members.filter((m) => m !== name));
    setPayments(
      payments.map((p) => {
        const newTargets = p.targetMembers?.filter((m) => m !== name);
        const newPaidBy = p.paidBy === name ? members.find((m) => m !== name) || '' : p.paidBy;
        return {
          ...p,
          paidBy: newPaidBy,
          targetMembers: newTargets,
        };
      })
    );
    setConditions(conditions.filter((c) => c.member !== name));
  };

  const handleAddPayment = () => {
    const newPayment: Payment = {
      paidBy: members[0] || 'Aさん',
      amount: 0,
      description: `支払い #${payments.length + 1}`,
    };
    setPayments([...payments, newPayment]);
  };

  const handleUpdatePayment = (index: number, updated: Payment) => {
    const copy = [...payments];
    copy[index] = updated;
    setPayments(copy);
  };

  const handleRemovePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const handleAddCondition = (cond: Condition) => {
    setConditions([...conditions, cond]);
  };

  const handleUpdateCondition = (index: number, updated: Condition) => {
    const copy = [...conditions];
    copy[index] = updated;
    setConditions(copy);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans">
      <Header
        onSelectPreset={handleSelectPreset}
        onOpenLlmModal={() => setIsLlmModalOpen(true)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Input Forms */}
          <div className="lg:col-span-6 space-y-4">
            <MemberManager
              members={members}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
              onSetMembers={setMembers}
            />

            <PaymentManager
              payments={payments}
              members={members}
              onAddPayment={handleAddPayment}
              onUpdatePayment={handleUpdatePayment}
              onRemovePayment={handleRemovePayment}
            />

            <ConditionManager
              conditions={conditions}
              members={members}
              payments={payments}
              onAddCondition={handleAddCondition}
              onUpdateCondition={handleUpdateCondition}
              onRemoveCondition={handleRemoveCondition}
            />

            <RoundingManager
              options={options}
              onChangeOptions={setOptions}
            />
          </div>

          {/* Right Column: Output / Optimal Transfers / Verification / Breakdown */}
          <div className="lg:col-span-6 sticky lg:top-20 space-y-4">
            <ResultDisplay
              request={currentRequest}
              response={response}
              error={error}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 mt-10 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-slate-700">warikaru (割軽)</span>
            <span className="mx-2">—</span>
            <span>シンプルな割り勘・精算アプリ</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <button
              onClick={() => setIsLlmModalOpen(true)}
              className="hover:text-indigo-600 transition"
            >
              API仕様書
            </button>
          </div>
        </div>
      </footer>

      {/* LLM Spec Modal */}
      <LlmSpecModal
        isOpen={isLlmModalOpen}
        onClose={() => setIsLlmModalOpen(false)}
      />
    </div>
  );
}
