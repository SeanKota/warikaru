'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Share2,
  Sparkles,
  Bot,
  ShieldCheck,
  TrendingUp,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Link2,
} from 'lucide-react';
import { CalculateRequest, CalculateResponse } from '@/lib/types';
import { formatJPY } from '@/lib/utils';
import { BreakdownTable } from './BreakdownTable';

interface ResultDisplayProps {
  request: CalculateRequest;
  response: CalculateResponse | null;
  error?: string | null;
}

export function ResultDisplay({ request, response, error }: ResultDisplayProps) {
  const [copiedType, setCopiedType] = useState<'line' | 'ai' | 'url' | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(true);

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
        <p className="text-sm font-semibold text-rose-800 mb-1">計算エラー</p>
        <p className="text-xs text-rose-600">{error}</p>
      </div>
    );
  }

  if (!response || !response.success) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400">
        <p className="text-sm font-medium">参加メンバーと立替情報を入力すると、自動で最小送金リストが計算されます。</p>
      </div>
    );
  }

  const { transfers, breakdown, verification, summary } = response;

  // GET用ダイレクト計算URL（Gemini等のWeb検索AIやLINE共有用）
  const generateShareUrl = () => {
    const encoded = encodeURIComponent(JSON.stringify(request));
    return `https://warikaru.vercel.app/api/calculate?data=${encoded}&format=text`;
  };

  // LINE / Slack 共有用テキストの生成
  const generateShareText = () => {
    let text = `【warikaru 精算結果】\n`;
    text += `💰 立替総額: ${formatJPY(summary.totalExpense)} (${summary.memberCount}名)\n\n`;

    if (transfers.length === 0) {
      text += `🎉 全員の貸し借りは精算済みです（送金不要）\n`;
    } else {
      text += `📋 送金指示リスト (最小${transfers.length}回の送金):\n`;
      transfers.forEach((t) => {
        text += `・${t.from} ➔ ${t.to} へ ${formatJPY(t.amount)}\n`;
      });
    }

    text += `\n📊 各自の負担額内訳:\n`;
    breakdown.forEach((b) => {
      const netSign = b.net > 0 ? `+${formatJPY(b.net)} (受取)` : b.net < 0 ? `-${formatJPY(Math.abs(b.net))} (支払)` : `0円 (精算済)`;
      text += `・${b.member}: 負担額 ${formatJPY(b.share)} (立替: ${formatJPY(b.paid)} / 差額: ${netSign})\n`;
    });

    text += `\n✅ 検証: 合計差額 0円ピッタリ (整合性保証)`;
    return text;
  };

  // AI用プロンプト・APIリクエストJSONの生成
  const generateAiJson = () => {
    return JSON.stringify(request, null, 2);
  };

  const copyToClipboard = async (text: string, type: 'line' | 'ai' | 'url') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Results Card: Minimum Transfers */}
      <div className="bg-gradient-to-b from-white to-indigo-50/20 rounded-2xl p-5 sm:p-6 border border-indigo-200/80 shadow-md shadow-indigo-100/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-indigo-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                最終送金指示リスト
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                送金回数 最適化済
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              複雑な貸し借りを整理し、最も少ない回数（全{transfers.length}回）で全員が精算完了します
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">総送金ボリューム</span>
            <span className="text-sm font-semibold text-slate-700">
              {formatJPY(verification.totalTransferAmount)}
            </span>
          </div>
        </div>

        {/* Transfers list */}
        {transfers.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">
              送金は不要です
            </p>
            <p className="text-xs text-slate-400 mt-1">
              全員の負担額と立替額が一致しており、差額がありません。
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {transfers.map((t, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-white border border-indigo-100/80 shadow-2xs hover:shadow-xs transition"
              >
                {/* From -> To */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="font-semibold text-slate-900 text-sm sm:text-base px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200/50">
                    {t.from}
                  </span>
                  <div className="flex items-center text-indigo-500 font-medium">
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="font-semibold text-slate-900 text-sm sm:text-base px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/50">
                    {t.to}
                  </span>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <span className="text-base sm:text-xl font-extrabold text-indigo-600">
                    {formatJPY(t.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Copy & Share Action Buttons */}
        <div className="mt-5 pt-4 border-t border-indigo-100 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={() => copyToClipboard(generateShareText(), 'line')}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs hover:shadow-emerald-200"
          >
            {copiedType === 'line' ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>コピー完了！LINEやSlackへ貼付け可能</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>LINE / Slack 共有用テキストをコピー</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => copyToClipboard(generateShareUrl(), 'url')}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition shadow-2xs"
            title="Gemini等のWeb検索AIやLINE共有に使えるGET URL"
          >
            {copiedType === 'url' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-indigo-700" />
                <span>URL コピー完了！</span>
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4 text-indigo-700" />
                <span>Gemini/共有用URLをコピー</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mathematical Verification Proof Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              数学的整合性の検証データ（Verification）
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% Balanced
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              全員の受け取る額と支払う額の合計がピッタリ0円であることを証明
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">立替総額</span>
            <span className="text-sm font-bold text-slate-100">
              {formatJPY(verification.totalPaid)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">負担総額</span>
            <span className="text-sm font-bold text-slate-100">
              {formatJPY(verification.totalShare)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">純残高合計 (Net)</span>
            <span className="text-sm font-bold text-emerald-400">
              {verification.sumNetBalance} 円 (完全一致)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">最適化送金回数</span>
            <span className="text-sm font-bold text-indigo-300">
              {verification.transferCount} 回
            </span>
          </div>
        </div>
      </div>

      {/* Itemized Breakdown Table Toggle */}
      <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                計算根拠・明細内訳（なぜこの金額になったか）
              </h3>
              <p className="text-xs text-slate-500">
                メンバーごとの立替・負担・差額・適用された条件の内訳
              </p>
            </div>
          </div>
          <div className="text-slate-400">
            {showBreakdown ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {showBreakdown && (
          <div className="p-4 sm:p-5 pt-0 border-t border-slate-100">
            <BreakdownTable breakdown={breakdown} />
          </div>
        )}
      </div>
    </div>
  );
}
