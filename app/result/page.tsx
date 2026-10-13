import React, { Suspense } from 'react';
import { calculateSettlement } from '@/lib/calculate';
import { parseQueryToCalculateRequest } from '@/lib/queryParser';
import { formatJPY } from '@/lib/utils';
import { ArrowRight, CheckCircle2, ShieldCheck, Calculator } from 'lucide-react';

interface ResultPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function ResultContent({ searchParams }: ResultPageProps) {
  const params = await searchParams;

  // URLSearchParamsを構築（ChatGPTのエンコード揺らぎにも対応）
  const urlSearchParams = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (typeof val === 'string') {
      urlSearchParams.set(key, val);
    } else if (Array.isArray(val) && val.length > 0) {
      urlSearchParams.set(key, val[0]);
    }
  }

  // 計算リクエストの構築
  const calcReq = parseQueryToCalculateRequest(urlSearchParams);

  // サーバーサイドで即座に計算
  const result = calculateSettlement(calcReq);

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-indigo-100 shadow-md space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              warikaru 精算計算結果
            </h1>
            <p className="text-xs text-slate-500">
              決定論的TypeScriptエンジンによる正確な割り勘結果（AI閲覧用・人間閲覧用）
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">立替総額</span>
          <span className="text-lg font-bold text-indigo-600">
            {formatJPY(result.summary.totalExpense)}
          </span>
        </div>
      </div>

      {/* Transfers List (AIクローラーが最優先で読む部分) */}
      <section aria-labelledby="transfers-heading">
        <h2 id="transfers-heading" className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          【送金指示リスト（最小{result.transfers.length}回）】
        </h2>
        <div className="space-y-2">
          {result.transfers.map((t, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200"
            >
              <div className="flex items-center gap-3 text-base font-bold text-slate-800">
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
                  {t.from}
                </span>
                <ArrowRight className="w-4 h-4 text-indigo-500" />
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {t.to}
                </span>
              </div>
              <div className="text-lg font-extrabold text-indigo-600">
                {formatJPY(t.amount)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Breakdown Table */}
      <section aria-labelledby="breakdown-heading">
        <h2 id="breakdown-heading" className="text-base font-bold text-slate-900 mb-3">
          【各自の負担内訳】
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">メンバー</th>
                <th className="p-3 text-right">立替額 (Paid)</th>
                <th className="p-3 text-right">負担額 (Share)</th>
                <th className="p-3 text-right">差額 (Net Balance)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {result.breakdown.map((b) => (
                <tr key={b.member}>
                  <td className="p-3 font-semibold text-slate-900">{b.member}</td>
                  <td className="p-3 text-right font-mono">{formatJPY(b.paid)}</td>
                  <td className="p-3 text-right font-mono">{formatJPY(b.share)}</td>
                  <td className="p-3 text-right font-mono font-bold">
                    {b.net > 0 ? (
                      <span className="text-emerald-700">+{formatJPY(b.net)} (受取)</span>
                    ) : b.net < 0 ? (
                      <span className="text-rose-700">-{formatJPY(Math.abs(b.net))} (支払)</span>
                    ) : (
                      <span className="text-slate-400">0円 (精算済)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Verification */}
      <section className="p-4 rounded-xl bg-slate-900 text-white text-xs space-y-1">
        <div className="flex items-center gap-2 font-bold text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>数学的整合性の検証データ (100% Balanced)</span>
        </div>
        <p className="text-slate-300">
          ・全員の純残高合計: {result.verification.sumNetBalance}円（完全一致）
        </p>
        <p className="text-slate-300">
          ・最小送金アルゴリズム: {result.verification.algorithm}
        </p>
      </section>

      {/* Text for AI parsing */}
      <section className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <h3 className="text-xs font-semibold text-slate-700 mb-2">LINE共有用テキスト:</h3>
        <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap">
{`【warikaru 精算結果】
立替総額: ${formatJPY(result.summary.totalExpense)} (${result.summary.memberCount}名)

【送金指示リスト】
${result.transfers.map((t) => `・${t.from} ➔ ${t.to} へ ${formatJPY(t.amount)}`).join('\n')}

【各自の内訳】
${result.breakdown.map((b) => `・${b.member}: 負担額 ${formatJPY(b.share)} (立替: ${formatJPY(b.paid)} / 差額: ${b.net > 0 ? `+${formatJPY(b.net)} (受取)` : b.net < 0 ? `-${formatJPY(Math.abs(b.net))} (支払)` : '0円'})`).join('\n')}
`}
        </pre>
      </section>

      {/* Action Button: Edit in interactive app */}
      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <a
          href={`/?${urlSearchParams.toString()}`}
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
        >
          <span>この精算をwarikaruアプリで編集・微調整する</span>
          <ArrowRight className="w-4 h-4" />
        </a>
        <a
          href="/"
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition"
        >
          新規計算を開く
        </a>
      </div>
    </div>
  );
}

export default function ResultPage({ searchParams }: ResultPageProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 max-w-4xl mx-auto">
      <Suspense fallback={<div className="p-10 text-center text-slate-400">計算結果を生成中...</div>}>
        <ResultContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
