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
 * 1. クエリパラメータ ?data=<JSON> または ?members=... がある場合は計算を実行して結果を返す
 * 2. クエリパラメータがない場合は API仕様情報を返す
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const rawSearch = req.nextUrl.search;

  // クエリパラメータで計算リクエストが来た場合
  if (rawSearch && rawSearch.length > 1) {
    try {
      // 柔軟なクエリパーサーでリクエストを生成
      const calcReq = parseQueryToCalculateRequest(rawSearch);

      // 計算を実行
      const result = calculateSettlement(calcReq);

      // format=text の場合はプレーンテキストで返す
      const format = searchParams.get('format');
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
        textResult += `・アルゴリズム: ${result.verification.algorithm}\n`;

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

  // クエリパラメータがない場合は API仕様ドキュメントを返却
  return NextResponse.json(
    {
      name: 'warikaru API',
      version: '1.2.0',
      description: 'AI-agent-ready high-precision bill splitting and settlement engine (Supports GET, POST, and /result HTML page)',
      specification: '/llm.txt',
      htmlResultPage: '/result?members=... (AI Web Browsing Tool & Human Friendly)',
      methods: ['GET', 'POST'],
      getUsageExamples: [
        'GET /result?members=Aさん,Bさん,Cさん&payments=Aさん:12000:居酒屋,Bさん:3000:タクシー&exclude=Cさん:タクシー&weight=Aさん:1.5&discount=Cさん:1000&unit=100',
        'GET /api/calculate?members=Aさん,Bさん,Cさん&payments=Aさん:12000:一次会,Bさん:3000:タクシー&exclude=Cさん:タクシー&weight=Aさん:1.5&discount=Cさん:1000&unit=100&format=text',
      ],
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
