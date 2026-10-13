'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, MinusCircle, AlertCircle } from 'lucide-react';
import { MemberBreakdown } from '@/lib/types';
import { formatJPY } from '@/lib/utils';

interface BreakdownTableProps {
  breakdown: MemberBreakdown[];
}

export function BreakdownTable({ breakdown }: BreakdownTableProps) {
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const toggleExpand = (member: string) => {
    setExpandedMember(expandedMember === member ? null : member);
  };

  return (
    <div className="space-y-3 pt-3">
      {/* Table view for desktop / Cards for mobile */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-3 sm:px-4">メンバー</th>
              <th className="py-3 px-3 sm:px-4 text-right">立替額 (Paid)</th>
              <th className="py-3 px-3 sm:px-4 text-right">負担額 (Share)</th>
              <th className="py-3 px-3 sm:px-4 text-right">差額 (Net Balance)</th>
              <th className="py-3 px-3 sm:px-4 text-center">内訳</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white font-medium">
            {breakdown.map((b) => {
              const isExpanded = expandedMember === b.member;
              const isReceive = b.net > 0;
              const isPay = b.net < 0;

              return (
                <React.Fragment key={b.member}>
                  <tr
                    onClick={() => toggleExpand(b.member)}
                    className="hover:bg-indigo-50/30 transition cursor-pointer"
                  >
                    <td className="py-3.5 px-3 sm:px-4 font-semibold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span>{b.member}</span>
                      {b.appliedConditions.length > 0 && (
                        <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-100">
                          条件あり
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-right font-mono text-slate-700">
                      {formatJPY(b.paid)}
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-right font-mono text-slate-700">
                      {formatJPY(b.share)}
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-right font-mono">
                      {isReceive ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                          +{formatJPY(b.net)} (受取)
                        </span>
                      ) : isPay ? (
                        <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md">
                          -{formatJPY(Math.abs(b.net))} (支払)
                        </span>
                      ) : (
                        <span className="text-slate-400">0円 (精算不要)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-center text-slate-400">
                      <button
                        type="button"
                        className="p-1 hover:text-indigo-600 transition"
                        title="詳細内訳を展開"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Item Details */}
                  {isExpanded && (
                    <tr className="bg-slate-50/80">
                      <td colSpan={5} className="p-3 sm:p-4 text-xs">
                        <div className="space-y-2.5">
                          {/* Conditions applied */}
                          {b.appliedConditions.length > 0 && (
                            <div className="p-2.5 bg-violet-50/70 rounded-lg border border-violet-100 text-violet-900">
                              <span className="font-semibold block mb-1 text-[11px]">
                                適用された条件・ルール:
                              </span>
                              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                                {b.appliedConditions.map((cond, i) => (
                                  <li key={i}>{cond}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Payment-by-payment breakdown */}
                          <div className="space-y-1">
                            <span className="font-semibold text-slate-700 block text-[11px]">
                              支払いごとの個別負担内訳:
                            </span>
                            <div className="space-y-1">
                              {b.paymentDetails.map((pd, pidx) => (
                                <div
                                  key={pidx}
                                  className="flex items-center justify-between p-2 rounded-md bg-white border border-slate-200 text-[11px]"
                                >
                                  <div>
                                    <span className="font-semibold text-slate-800">
                                      {pd.paymentDescription}
                                    </span>
                                    <span className="text-slate-400 ml-2">
                                      (立替: {pd.paidBy} / 総額: {formatJPY(pd.paymentAmount)})
                                    </span>
                                    {pd.isExcluded && (
                                      <span className="ml-2 px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-100">
                                        不参加・除外
                                      </span>
                                    )}
                                    {pd.appliedWeight && (
                                      <span className="ml-2 px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                                        比率: {pd.appliedWeight}倍
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-mono font-medium text-slate-700">
                                    負担: {formatJPY(Math.round(pd.memberShare))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-400 pt-1 flex justify-between">
                            <span>丸め前正確額: ¥{b.rawShare.toLocaleString()}</span>
                            <span>丸め調整後負担額: {formatJPY(b.share)}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
