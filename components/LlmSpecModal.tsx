'use client';

import React, { useState } from 'react';
import { X, Copy, CheckCircle2, FileCode2, Terminal, Bot, ExternalLink } from 'lucide-react';

interface LlmSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LlmSpecModal({ isOpen, onClose }: LlmSpecModalProps) {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  if (!isOpen) return null;

  const curlExample = `curl -X POST https://warikaru.vercel.app/api/calculate \\
  -H "Content-Type: application/json" \\
  -d '{
    "members": ["Aさん", "Bさん", "Cさん"],
    "payments": [
      { "paidBy": "Aさん", "amount": 12000, "description": "一次会（居酒屋）" },
      { "paidBy": "Bさん", "amount": 3000, "description": "タクシー代" }
    ],
    "conditions": [
      { "type": "exclude", "member": "Cさん", "description": "タクシー代から除外" },
      { "type": "weight", "member": "Aさん", "weight": 1.5 },
      { "type": "fixed_discount", "member": "Cさん", "amount": 1000 }
    ],
    "options": {
      "roundingUnit": 100,
      "roundingMode": "round"
    }
  }'`;

  const aiPromptExample = `あなたは割り勘・精算アシスタントです。
複雑な貸し借りや割り勘計算（比率傾斜、特定支払い除外、割引、最小送金回数の最適化など）を計算する際は、
絶対に暗算で計算ミスをしないでください。
代わりに、warikaruの計算API (POST /api/calculate) のJSONスキーマに従ってJSONを構築し、
warikaruの決定論的エンジンに計算させて正確な精算結果を出力してください。
仕様書URL: /llm.txt`;

  const copyText = async (text: string, type: 'curl' | 'prompt') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'curl') {
        setCopiedCurl(true);
        setTimeout(() => setCopiedCurl(false), 2000);
      } else {
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 2000);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-indigo-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <FileCode2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                AIエージェント仕様 (/public/llm.txt) & API
              </h3>
              <p className="text-xs text-slate-500">
                Claude, ChatGPT, MCP, 自動化ツール向け規格
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600">
          {/* Overview alert */}
          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-950">
            <span className="font-semibold block mb-1">
              💡 なぜAIに計算させず、warikaru APIを叩かせるのか？
            </span>
            <p className="leading-relaxed">
              LLMは言語理解や条件抽出は得意ですが、割り算の端数処理やグラフ理論による最小送金回数の最適化（NP困難問題を含む債権相殺）において、ほぼ確実に計算ミスや金額不一致（Hallucination）を起こします。
              warikaruはTypeScriptの厳密なエンジンにより、<strong>1円の狂いもない計算整合性</strong>と<strong>最小送金回数</strong>を保証します。
            </p>
          </div>

          {/* Direct link to /llm.txt */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="font-semibold text-slate-800 block text-xs">
                プレーンテキスト仕様書 (llm.txt)
              </span>
              <span className="text-[11px] text-slate-400">
                AIクローラーやWebブラウザから直接読み込めるテキストファイル
              </span>
            </div>
            <a
              href="/llm.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-medium text-indigo-600 hover:bg-indigo-50 transition"
            >
              <span>/llm.txt を開く</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* cURL section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                APIリクエスト例 (cURL)
              </span>
              <button
                type="button"
                onClick={() => copyText(curlExample, 'curl')}
                className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
              >
                {copiedCurl ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>コピー済</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>cURLをコピー</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed">
              {curlExample}
            </pre>
          </div>

          {/* AI Prompt instructions */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-violet-600" />
                AIエージェント向け指示プロンプト例
              </span>
              <button
                type="button"
                onClick={() => copyText(aiPromptExample, 'prompt')}
                className="text-violet-600 hover:text-violet-800 font-medium inline-flex items-center gap-1"
              >
                {copiedPrompt ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>コピー済</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>プロンプトをコピー</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-100 text-slate-800 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-200">
              {aiPromptExample}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
