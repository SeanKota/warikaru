import { NextRequest, NextResponse } from 'next/server';
import { calculateSettlement } from '@/lib/calculate';
import { parseQueryToCalculateRequest } from '@/lib/queryParser';
import { CalculateRequest } from '@/lib/types';
import { formatJPY } from '@/lib/utils';

// CORSヘッダー設定（AIエージェントや外部クライアントからのアクセスを許可）
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * GET エンドポイント:
 * 1. クエリパラメータがある場合:
 *    - Webブラウジングツールやブラウザからのアクセスの場合、自動的に /result HTMLページへリダイレクト（ChatGPTのWeb閲覧を100%成功させる）
 *    - format=json または 明示的にAPI呼び出しの場合は JSONを返却
 * 2. クエリパラメータがない場合:
 *    - AI向けにURL組み立てガイドを案内
 */
export async function GET(req: NextRequest) {
  let rawSearch = req.nextUrl.search;

  // ChatGPT等のエンコードミス対策 (%26 を & に自動復元)
  if (rawSearch.includes('%26') && !rawSearch.includes('&')) {
    rawSearch = rawSearch.replace(/%26/g, '&');
  }

  // クエリパラメータで計算リクエストが来た場合
  if (rawSearch && rawSearch.length > 1) {
    try {
      const searchParams = new URLSearchParams(rawSearch.startsWith('?') ? rawSearch.slice(1) : rawSearch);
      const format = searchParams.get('format');
      const accept = req.headers.get('accept') || '';

      // ChatGPTのWeb閲覧ツールや通常ブラウザからアクセスされた場合、
      // 確実に本文が読み取れる /result HTMLページへシームレスにリダイレクト
      if (format !== 'json' && !accept.includes('application/json')) {
        const redirectUrl = new URL(`/result?${searchParams.toString()}`, req.url);
        return NextResponse.redirect(redirectUrl, {
          status: 307,
          headers: corsHeaders,
        });
      }

      // JSONまたは明示的なリクエストの場合
      const calcReq = parseQueryToCalculateRequest(rawSearch);
      const result = calculateSettlement(calcReq);

      if (format === 'text') {
        let textResult = `【warikaru 精算結果】\n`;
        textResult += `立替総額: ${formatJPY(result.summary.totalExpense)} (${result.summary.memberCount}名)\n\n`;
        textResult += `【送金指示リスト（最小${result.transfers.length}回）】\n`;
        result.transfers.forEach((t) => {
          textResult += `・${t.from} ➔ ${t.to} へ ${formatJPY(t.amount)}\n`;
        });
        textResult += `\n【各自の内訳】\n`;
        result.breakdown.forEach((b) => {
          const net = b.net > 0 ? `+${formatJPY(b.net)} (受取)` : b.net < 0 ? `-${formatJPY(Math.abs(b.net))} (支払)` : `0円 (精算済)`;
          textResult += `・${b.member}: 負担額 ${formatJPY(b.share)} (立替: ${formatJPY(b.paid)} / 差額: ${net})\n`;
        });
        textResult += `\n【検証データ】\n`;
        textResult += `・合計差額: ${result.verification.sumNetBalance}円 (完全一致保証)\n`;

        return new NextResponse(textResult, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/plain; charset=utf-8',
          },
        });
      }

      return NextResponse.json(result, {
        status: 200,
        headers: corsHeaders,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '計算エラーが発生しました。';
      return NextResponse.json(
        { success: false, error: msg },
        { status: 400, headers: corsHeaders }
      );
    }
  }

  // クエリパラメータがない場合は、AIやブラウザ向けにGET URLの組み立て方を案内
  return NextResponse.json(
    {
      notice: 'パラメータが付与されていません。このURLの末尾にクエリパラメータを付与して /result を開いてください。',
      instructionForAI: 'AIアシスタントへ: ユーザーの条件からクエリを組み立て、以下のURLを開いて計算結果を取得してください。',
      recommendedUrlFormat: 'https://warikaru.vercel.app/result?members={名前一覧}&payments={支払者:金額:名目}&discount={割引対象:金額}&unit=100',
      exampleUrl: 'https://warikaru.vercel.app/result?members=A,B,C&payments=A:4000,B:3000&discount=C:500&unit=100',
      specification: 'https://warikaru.vercel.app/llm.txt',
    },
    { headers: corsHeaders }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body: CalculateRequest = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'リクエストボディが空であるか、有効なJSONではありません。',
        },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!Array.isArray(body.members) || body.members.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'members は少なくとも1名以上のメンバー配列を指定してください。',
        },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!Array.isArray(body.payments)) {
      return NextResponse.json(
        {
          success: false,
          error: 'payments は支払い情報の配列を指定してください。',
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = calculateSettlement(body);

    return NextResponse.json(result, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '計算中に不明なエラーが発生しました。';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 400, headers: corsHeaders }
    );
  }
}
