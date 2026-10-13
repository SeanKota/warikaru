import { NextRequest, NextResponse } from 'next/server';
import { calculateSettlement } from '@/lib/calculate';
import { CalculateRequest } from '@/lib/types';

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

export async function GET() {
  return NextResponse.json(
    {
      name: 'warikaru API',
      version: '1.0.0',
      description: 'AI-agent-ready high-precision bill splitting and settlement engine',
      specification: '/llm.txt',
      methods: ['POST'],
      schema: {
        members: 'string[] (required)',
        payments: 'Array<{ paidBy: string, amount: number, description?: string, targetMembers?: string[] }> (required)',
        conditions: 'Array<{ type: "exclude" | "weight" | "fixed_discount", member: string, paymentIndex?: number, paymentDescription?: string, weight?: number, amount?: number, description?: string }> (optional)',
        options: '{ roundingUnit?: 1 | 10 | 50 | 100 | 500 | 1000, roundingMode?: "round" | "floor" | "ceil", roundingTarget?: "highest_share" | "payer" | "equal" } (optional)',
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
