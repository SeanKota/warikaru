import { CalculateRequest, Condition, Payment, RoundingUnit, RoundingMode } from './types';

/**
 * URLクエリパラメータやURLエンコードされた文字列から柔軟に CalculateRequest を構築する。
 * ChatGPTなどのAIがクエリ全体（& や = も含む）を誤エンコードした場合でも安全にデコードして解析する。
 */
export function parseQueryToCalculateRequest(queryStringOrParams: string | URLSearchParams): CalculateRequest {
  let searchParams: URLSearchParams;

  if (typeof queryStringOrParams === 'string') {
    let cleanQuery = queryStringOrParams;
    if (cleanQuery.startsWith('?')) {
      cleanQuery = cleanQuery.substring(1);
    }
    // ChatGPT等の過剰エンコード対策 (%26 や %3D が含まれている場合はデコード)
    if (cleanQuery.includes('%26') || cleanQuery.includes('%3D') || cleanQuery.includes('%3d')) {
      try {
        cleanQuery = decodeURIComponent(cleanQuery);
      } catch {
        // decode失敗時はそのまま
      }
    }
    searchParams = new URLSearchParams(cleanQuery);
  } else {
    // URLSearchParamsが渡された場合でも、keyに = や & が含まれている可能性をチェック
    const rawEntries: [string, string][] = [];
    queryStringOrParams.forEach((val, key) => {
      if (key.includes('=') || key.includes('&') || key.includes('%26') || key.includes('%3D')) {
        const decoded = decodeURIComponent(`${key}=${val}`);
        const sub = new URLSearchParams(decoded);
        sub.forEach((subVal, subKey) => rawEntries.push([subKey, subVal]));
      } else {
        rawEntries.push([key, val]);
      }
    });

    searchParams = new URLSearchParams();
    rawEntries.forEach(([k, v]) => searchParams.set(k, v));
  }

  // 1. ?data=<JSON> パターン
  const dataParam = searchParams.get('data');
  if (dataParam) {
    try {
      return JSON.parse(decodeURIComponent(dataParam));
    } catch {
      // JSONパース失敗時は個別パラメータへフォールバック
    }
  }

  // 2. 個別クエリパラメータパターン
  let membersStr = searchParams.get('members') || '';
  if (membersStr.includes('&')) {
    const subParams = new URLSearchParams(membersStr);
    membersStr = membersStr.split('&')[0];
    subParams.forEach((val, key) => {
      if (!searchParams.has(key)) {
        searchParams.set(key, val);
      }
    });
  }

  const members = membersStr.split(',').map((m) => decodeURIComponent(m.trim())).filter(Boolean);

  const paymentsStr = searchParams.get('payments') || '';
  const payments: Payment[] = paymentsStr.split(',').filter(Boolean).map((item) => {
    const parts = item.split(':').map((s) => decodeURIComponent(s.trim()));
    const paidBy = parts[0] || members[0] || 'A';
    const amount = parseInt(parts[1], 10) || 0;
    const description = parts[2] || undefined;
    return { paidBy, amount, description };
  });

  const conditions: Condition[] = [];

  const excludeStr = searchParams.get('exclude') || '';
  excludeStr.split(',').filter(Boolean).forEach((item) => {
    const parts = item.split(':').map((s) => decodeURIComponent(s.trim()));
    if (parts[0]) {
      conditions.push({
        type: 'exclude',
        member: parts[0],
        paymentDescription: parts[1] || undefined,
      });
    }
  });

  const weightStr = searchParams.get('weight') || '';
  weightStr.split(',').filter(Boolean).forEach((item) => {
    const parts = item.split(':').map((s) => decodeURIComponent(s.trim()));
    if (parts[0]) {
      conditions.push({
        type: 'weight',
        member: parts[0],
        weight: parseFloat(parts[1]) || 1.0,
        paymentDescription: parts[2] || undefined,
      });
    }
  });

  const discountStr = searchParams.get('discount') || '';
  discountStr.split(',').filter(Boolean).forEach((item) => {
    const parts = item.split(':').map((s) => decodeURIComponent(s.trim()));
    if (parts[0]) {
      conditions.push({
        type: 'fixed_discount',
        member: parts[0],
        amount: parseInt(parts[1], 10) || 0,
        paymentDescription: parts[2] || undefined,
      });
    }
  });

  const unit = parseInt(searchParams.get('unit') || '100', 10) as RoundingUnit;
  const mode = (searchParams.get('mode') || 'round') as RoundingMode;

  return {
    members: members.length > 0 ? members : ['A', 'B', 'C'],
    payments: payments.length > 0 ? payments : [
      { paidBy: 'A', amount: 4000, description: '一次会' },
      { paidBy: 'B', amount: 3000, description: 'タクシー' }
    ],
    conditions,
    options: {
      roundingUnit: unit || 100,
      roundingMode: mode || 'round',
    },
  };
}
