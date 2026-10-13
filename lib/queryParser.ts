import { CalculateRequest, Condition, Payment, RoundingUnit, RoundingMode } from './types';

/**
 * URLクエリパラメータやURLエンコードされた文字列から柔軟に CalculateRequest を構築する。
 * ChatGPTなどのAIが `&` を `%26` に誤エンコードした場合でも安全にフォールバックして解析する。
 */
export function parseQueryToCalculateRequest(queryStringOrParams: string | URLSearchParams): CalculateRequest {
  let searchParams: URLSearchParams;

  if (typeof queryStringOrParams === 'string') {
    let cleanQuery = queryStringOrParams;
    if (cleanQuery.startsWith('?')) {
      cleanQuery = cleanQuery.substring(1);
    }
    // ChatGPT等のエンコードミス対策: %26 を & にデコード
    if (cleanQuery.includes('%26') && !cleanQuery.includes('&')) {
      cleanQuery = cleanQuery.replace(/%26/g, '&');
    }
    searchParams = new URLSearchParams(cleanQuery);
  } else {
    searchParams = queryStringOrParams;
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
  // membersParam の中に & が混ざっている場合の救済
  let membersStr = searchParams.get('members') || '';
  if (membersStr.includes('&')) {
    // 誤って members パラメータの中に後続パラメータが取り込まれてしまった場合
    const subParams = new URLSearchParams(membersStr);
    membersStr = membersStr.split('&')[0];
    // 他のパラメータをマージ
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
    const paidBy = parts[0] || members[0] || 'Aさん';
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
    members: members.length > 0 ? members : ['Aさん', 'Bさん', 'Cさん'],
    payments: payments.length > 0 ? payments : [
      { paidBy: 'Aさん', amount: 12000, description: '一次会' },
      { paidBy: 'Bさん', amount: 3000, description: 'タクシー' }
    ],
    conditions,
    options: {
      roundingUnit: unit || 100,
      roundingMode: mode || 'round',
    },
  };
}
