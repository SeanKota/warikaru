import { CalculateRequest, Condition, Payment, RoundingUnit, RoundingMode } from './types';

/**
 * URLクエリパラメータやURLエンコードされた文字列から柔軟に CalculateRequest を構築する。
 * ChatGPTなどのAIがクエリ全体（& や = も含む）を %26 や %3D に過剰エンコードした場合でも安全にデコードして解析する。
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
        // ignore
      }
    }
    searchParams = new URLSearchParams(cleanQuery);
  } else {
    // URLSearchParamsオブジェクトが渡された場合
    // 全エントリを "key=val" の文字列として再構築（keyだけでなくvalの中に%26や%3Dが入っているケースに対応）
    const pairs: string[] = [];
    queryStringOrParams.forEach((val, key) => {
      pairs.push(`${key}=${val}`);
    });
    let fullQuery = pairs.join('&');

    // %26 や %3D が含まれている場合はデコードして再パース
    if (fullQuery.includes('%26') || fullQuery.includes('%3D') || fullQuery.includes('%3d')) {
      try {
        fullQuery = decodeURIComponent(fullQuery);
      } catch {
        // ignore
      }
    }
    searchParams = new URLSearchParams(fullQuery);
  }

  // もし特定のパラメータ値の中にさらに & や = が残っていた場合の多層救済
  // （例: members="A,B,C&payments=A:12000..." のように全体が1つのkeyに入ってしまっている場合）
  const allKeys = Array.from(searchParams.keys());
  for (const k of allKeys) {
    const v = searchParams.get(k) || '';
    if (v.includes('&') || v.includes('=')) {
      const firstPart = v.split('&')[0];
      searchParams.set(k, firstPart);
      const rest = v.substring(firstPart.length + 1);
      const subParams = new URLSearchParams(rest);
      subParams.forEach((subVal, subKey) => {
        if (!searchParams.has(subKey)) {
          searchParams.set(subKey, subVal);
        }
      });
    }
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
  const membersStr = searchParams.get('members') || '';
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
