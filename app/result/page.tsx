import React, { Suspense } from 'react';
import { calculateSettlement } from '@/lib/calculate';
import { parseQueryToCalculateRequest } from '@/lib/queryParser';
import { formatJPY } from '@/lib/utils';
import { ArrowRight, CheckCircle2, Calculator } from 'lucide-react';

interface ResultPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function ResultContent({ searchParams }: ResultPageProps) {
  const params = await searchParams;

  const urlSearchParams = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (typeof val === 'string') {
      urlSearchParams.set(key, val);
    } else if (Array.isArray(val) && val.length > 0) {
      urlSearchParams.set(key, val[0]);
    }
  }

  const calcReq = parseQueryToCalculateRequest(urlSearchParams);
  const result = calculateSettlement(calcReq);

  const cleanParams = new URLSearchParams();
  if (calcReq.members?.length) cleanParams.set('members', calcReq.members.join(','));
  if (calcReq.payments?.length) {
    cleanParams.set(
      'payments',
      calcReq.payments.map((p) => `${p.paidBy}:${p.amount}${p.description ? `:${p.description}` : ''}`).join(',')
    );
  }
  if (calcReq.conditions?.length) {
    const excludes = calcReq.conditions.filter((c) => c.type === 'exclude');
    if (excludes.length) cleanParams.set('exclude', excludes.map((c) => `${c.member}${c.paymentDescription ? `:${c.paymentDescription}` : ''}`).join(','));
    const weights = calcReq.conditions.filter((c) => c.type === 'weight');
    if (weights.length) cleanParams.set('weight', weights.map((c) => `${c.member}:${c.weight}${c.paymentDescription ? `:${c.paymentDescription}` : ''}`).join(','));
    const discounts = calcReq.conditions.filter((c) => c.type === 'fixed_discount');
    if (discounts.length) cleanParams.set('discount', discounts.map((c) => `${c.member}:${c.amount}${c.paymentDescription ? `:${c.paymentDescription}` : ''}`).join(','));
  }
  if (calcReq.options?.roundingUnit) cleanParams.set('unit', String(calcReq.options.roundingUnit));

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/80 shadow-sm space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              精算結果
            </h1>
            <p className="text-xs text-slate-500">
              合計 {formatJPY(result.summary.totalExpense)} ({result.summary.memberCount}名)
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            送金 {result.transfers.length}回で完了
          </span>
        </div>
      </div>

      {/* Transfers List */}
      <section aria-labelledby="transfers-heading">
        <h2 id="transfers-heading" className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          送金リスト
        </h2>
        <div className="space-y-2">
          {result.transfers.map((t, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80"
            >
              <div className="flex items-center gap-2.5 text-sm sm:text-base font-semibold text-slate-800">
                <span className="px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200/60">
                  {t.from}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  {t.to}
                </span>
              </div>
              <div className="text-base sm:text-lg font-bold text-indigo-600">
                {formatJPY(t.amount)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Breakdown Table */}
      <section aria-labelledby="breakdown-heading">
        <h2 id="breakdown-heading" className="text-sm font-bold text-slate-900 mb-3">
          各自の内訳
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">メンバー</th>
                <th className="p-3 text-right">立替額</th>
                <th className="p-3 text-right">負担額</th>
                <th className="p-3 text-right">差額</th>
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

      {/* Text for LINE sharing */}
      <section className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <h3 className="text-xs font-semibold text-slate-700 mb-2">LINE用テキスト:</h3>
        <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap select-all">
{`【精算結果】
合計: ${formatJPY(result.summary.totalExpense)}

【送金】
${result.transfers.map((t) => `・${t.from} ➔ ${t.to} へ ${formatJPY(t.amount)}`).join('\n')}

【各自の負担】
${result.breakdown.map((b) => `・${b.member}: 負担額 ${formatJPY(b.share)} (立替 ${formatJPY(b.paid)} / 差額: ${b.net > 0 ? `+${formatJPY(b.net)}受取` : b.net < 0 ? `-${formatJPY(Math.abs(b.net))}支払` : '0円'})`).join('\n')}
`}
        </pre>
      </section>

      {/* Action Button: Edit in interactive app */}
      <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
        <a
          href={`/?${cleanParams.toString()}`}
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-xs"
        >
          <span>アプリで条件を微調整する</span>
          <ArrowRight className="w-4 h-4" />
        </a>
        <a
          href="/"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition"
        >
          新規精算
        </a>
      </div>
    </div>
  );
}

export default function ResultPage({ searchParams }: ResultPageProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-6 sm:py-10 px-4 sm:px-6 max-w-3xl mx-auto">
      <Suspense fallback={<div className="p-10 text-center text-slate-400">計算結果を読み込み中...</div>}>
        <ResultContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
