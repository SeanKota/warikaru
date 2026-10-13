import { NextRequest, NextResponse } from 'next/server';
import { calculateSettlement } from '@/lib/calculate';
import { CalculateRequest, Condition, Payment, RoundingUnit, RoundingMode } from '@/lib/types';
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
 * 1. クエリパラメータ ?data=<JSON> または ?members=... がある場合は計算を実行して結果を返す（Web検索機能しか持たないGemini等向け）
 * 2. クエリパラメータがない場合は API仕様情報を返す
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const dataParam = searchParams.get('data');
  const membersParam = searchParams.get('members');

  // クエリパラメータで計算リクエストが来た場合
  if (dataParam || membersParam) {
    try {
      let calcReq: CalculateRequest;

      if (dataParam) {
        // パターンA: ?data=<JSON文字列またはURLエンコードJSON>
        calcReq = JSON.parse(decodeURIComponent(dataParam));
      } else {
        // パターンB: シンプルなクエリパラメータ形式
        // 例: ?members=Aさん,Bさん,Cさん&payments=Aさん:12000:一次会,Bさん:3000:タクシー&exclude=Cさん:タクシー&weight=Aさん:1.5&discount=Cさん:1000&unit=100
        const members = (membersParam || '').split(',').map((m) => m.trim()).filter(Boolean);

        const paymentsStr = searchParams.get('payments') || '';
        const payments: Payment[] = paymentsStr.split(',').filter(Boolean).map((item) => {
          const [paidBy, amountStr, description] = item.split(':').map((s) => s.trim());
          return {
            paidBy: paidBy || members[0] || 'Aさん',
            amount: parseInt(amountStr, 10) || 0,
            description: description || undefined,
          };
        });

        const conditions: Condition[] = [];

        // exclude: Cさん:タクシー
        const excludeStr = searchParams.get('exclude') || '';
        excludeStr.split(',').filter(Boolean).forEach((item) => {
          const [member, paymentDescription] = item.split(':').map((s) => s.trim());
          if (member) {
            conditions.push({
              type: 'exclude',
              member,
              paymentDescription: paymentDescription || undefined,
            });
          }
        });

        // weight: Aさん:1.5
        const weightStr = searchParams.get('weight') || '';
        weightStr.split(',').filter(Boolean).forEach((item) => {
          const [member, weightVal, paymentDescription] = item.split(':').map((s) => s.trim());
          if (member) {
            conditions.push({
              type: 'weight',
              member,
              weight: parseFloat(weightVal) || 1.0,
              paymentDescription: paymentDescription || undefined,
            });
          }
        });

        // discount: Cさん:1000
        const discountStr = searchParams.get('discount') || '';
        discountStr.split(',').filter(Boolean).forEach((item) => {
          const [member, amountVal, paymentDescription] = item.split(':').map((s) => s.trim());
          if (member) {
            conditions.push({
              type: 'fixed_discount',
              member,
              amount: parseInt(amountVal, 10) || 0,
              paymentDescription: paymentDescription || undefined,
            });
          }
        });

        const unit = parseInt(searchParams.get('unit') || '100', 10) as RoundingUnit;
        const mode = (searchParams.get('mode') || 'round') as RoundingMode;

        calcReq = {
          members,
          payments,
          conditions,
          options: {
            roundingUnit: unit,
            roundingMode: mode,
          },
        };
      }

      // 計算を実行
      const result = calculateSettlement(calcReq);

      // format=text の場合は人間や検索AIが読みやすいプレーンテキストで返す
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
      version: '1.1.0',
      description: 'AI-agent-ready high-precision bill splitting and settlement engine (Supports both GET and POST)',
      specification: '/llm.txt',
      methods: ['GET', 'POST'],
      getUsageExamples: [
        'GET /api/calculate?members=Aさん,Bさん,Cさん&payments=Aさん:12000:一次会,Bさん:3000:タクシー&exclude=Cさん:タクシー&weight=Aさん:1.5&discount=Cさん:1000&unit=100',
        'GET /api/calculate?data=<URL_ENCODED_JSON>',
        'GET /api/calculate?data=<URL_ENCODED_JSON>&format=text',
      ],
      schema: {
        members: 'string[] (required)',
        payments: 'Array<{ paidBy: string, amount: number, description?: string, targetMembers?: string[] }> (required)',
        conditions: 'Array<{ type: "exclude" | "weight" | "fixed_discount", member: string, paymentDescription?: string, weight?: number, amount?: number }> (optional)',
        options: '{ roundingUnit?: 1 | 10 | 50 | 100 | 500 | 1000, roundingMode?: "round" | "floor" | "ceil" } (optional)',
      },
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

    // 計算の実行
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
