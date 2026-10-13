import {
  CalculateRequest,
  CalculateResponse,
  Condition,
  MemberBreakdown,
  Payment,
  Transfer,
  RoundingUnit,
  RoundingMode,
} from './types';

/**
 * 割り勘・精算エンジン
 * - 入力された支払いと条件に基づき、厳密な按分と純残高（Net Balance）を算出
 * - 端数丸め処理を行いつつ、全員の残高合計が厳密にゼロになるよう調整
 * - グラフ理論 / 貪欲法（Exact match + Greedy）により最小送金回数を計算
 */
export function calculateSettlement(req: CalculateRequest): CalculateResponse {
  const members = Array.from(new Set((req.members || []).map((m) => m.trim()).filter(Boolean)));

  if (members.length === 0) {
    throw new Error('メンバーを少なくとも1名指定してください。');
  }

  const payments = req.payments || [];
  const conditions = req.conditions || [];
  const options = req.options || {};
  const roundingUnit: RoundingUnit = options.roundingUnit || 1;
  const roundingMode: RoundingMode = options.roundingMode || 'round';

  // 1. 各メンバーの立替合計金額（Paid）を計算
  const paidMap: Record<string, number> = {};
  members.forEach((m) => (paidMap[m] = 0));

  let totalExpense = 0;
  payments.forEach((p) => {
    const amount = Math.max(0, Number(p.amount) || 0);
    totalExpense += amount;
    if (paidMap[p.paidBy] !== undefined) {
      paidMap[p.paidBy] += amount;
    } else {
      // メンバーリストに含まれていない立替者がいた場合はメンバーに追加
      members.push(p.paidBy);
      paidMap[p.paidBy] = amount;
    }
  });

  // 2. 支払いごとの負担額（Share）を計算
  const rawShareMap: Record<string, number> = {};
  const paymentDetailsMap: Record<string, MemberBreakdown['paymentDetails']> = {};
  const appliedConditionsMap: Record<string, string[]> = {};

  members.forEach((m) => {
    rawShareMap[m] = 0;
    paymentDetailsMap[m] = [];
    appliedConditionsMap[m] = [];
  });

  // 条件のターゲット支払い判定ヘルパー
  const isConditionForPayment = (c: Condition, paymentIdx: number, desc: string): boolean => {
    // 明示的にインデックスが指定されている場合
    if (c.paymentIndex !== undefined) {
      return c.paymentIndex === paymentIdx;
    }
    // 明示的に支払いの説明が指定されている場合
    if (c.paymentDescription) {
      return desc.includes(c.paymentDescription) || c.paymentDescription.includes(desc);
    }
    // 条件のdescriptionから支払い名をファジーマッチ（例: "タクシー乗っていないためタクシー代から除外" -> "タクシー"）
    if (c.description) {
      // payment descが条件説明に含まれているか
      const words = desc.split(/[\s（）()]/).filter((w) => w.length >= 2);
      for (const w of words) {
        if (c.description.includes(w)) {
          return true;
        }
      }
    }
    return false;
  };

  const isConditionForAnyPayment = (c: Condition, pList: Payment[]): boolean => {
    if (c.paymentIndex !== undefined || Boolean(c.paymentDescription)) return true;
    if (!c.description) return false;
    return pList.some((p, i) => isConditionForPayment(c, i, p.description || `支払い #${i + 1}`));
  };

  payments.forEach((payment, paymentIdx) => {
    const paymentAmount = Math.max(0, Number(payment.amount) || 0);
    const desc = payment.description || `支払い #${paymentIdx + 1}`;

    if (paymentAmount === 0) {
      members.forEach((m) => {
        paymentDetailsMap[m].push({
          paymentDescription: desc,
          paidBy: payment.paidBy,
          paymentAmount: 0,
          memberShare: 0,
          isExcluded: false,
        });
      });
      return;
    }

    // 対象メンバーの選定（明示的に targetMembers があればそれを使用）
    let participants = payment.targetMembers && payment.targetMembers.length > 0
      ? members.filter((m) => payment.targetMembers!.includes(m))
      : [...members];

    // 除外条件（exclude）の適用
    const excludeConditions = conditions.filter((c) => {
      if (c.type !== 'exclude') return false;
      // 何らかの支払いに紐づいている条件の場合（インデックス、支払い名、あるいは特定支払いに言及している説明）
      if (
        c.paymentIndex !== undefined ||
        Boolean(c.paymentDescription) ||
        isConditionForAnyPayment(c, payments)
      ) {
        return isConditionForPayment(c, paymentIdx, desc);
      }
      // どの支払いにも言及していない全体除外の場合のみ true
      return true;
    });

    const excludedMembers = new Set<string>();
    excludeConditions.forEach((c) => {
      excludedMembers.add(c.member);
      const reason = c.description ? ` (${c.description})` : '';
      const text = `[${desc}] 除外${reason}`;
      if (!appliedConditionsMap[c.member]?.includes(text)) {
        appliedConditionsMap[c.member]?.push(text);
      }
    });

    participants = participants.filter((m) => !excludedMembers.has(m));

    // 参加者が0人の場合は立替者本人が全額負担
    if (participants.length === 0) {
      participants = [payment.paidBy];
    }

    // 重み（weight）条件の取得
    const weightConditions = conditions.filter((c) => {
      if (c.type !== 'weight') return false;
      if (c.paymentIndex !== undefined || c.paymentDescription) {
        return isConditionForPayment(c, paymentIdx, desc);
      }
      // 未指定なら全体（全ての支払い）の重み
      return true;
    });

    const weightMap: Record<string, number> = {};
    participants.forEach((m) => (weightMap[m] = 1.0));
    weightConditions.forEach((c) => {
      if (c.weight !== undefined && c.weight > 0 && weightMap[c.member] !== undefined) {
        weightMap[c.member] = c.weight;
        const msg = `[${desc}] 比率: ${c.weight}倍${c.description ? ` (${c.description})` : ''}`;
        if (!appliedConditionsMap[c.member]?.includes(msg)) {
          appliedConditionsMap[c.member]?.push(msg);
        }
      }
    });

    // 固定割引（fixed_discount）条件（この支払いのみ対象のもの）
    const paymentSpecificDiscounts = conditions.filter((c) => {
      if (c.type !== 'fixed_discount') return false;
      return (
        c.paymentIndex !== undefined ||
        Boolean(c.paymentDescription) ||
        (c.description && isConditionForPayment(c, paymentIdx, desc))
      );
    });

    const discountMap: Record<string, number> = {};
    participants.forEach((m) => (discountMap[m] = 0));
    paymentSpecificDiscounts.forEach((c) => {
      if (c.amount !== undefined && discountMap[c.member] !== undefined) {
        discountMap[c.member] = c.amount;
        const msg = `[${desc}] 割引: -${c.amount.toLocaleString()}円${c.description ? ` (${c.description})` : ''}`;
        if (!appliedConditionsMap[c.member]?.includes(msg)) {
          appliedConditionsMap[c.member]?.push(msg);
        }
      }
    });

    // 負担額の按分計算
    const totalWeight = participants.reduce((sum, m) => sum + (weightMap[m] || 1.0), 0);
    const totalDiscounts = participants.reduce((sum, m) => sum + (discountMap[m] || 0), 0);
    const netPaymentToDistribute = Math.max(0, paymentAmount - totalDiscounts);

    const singlePaymentShare: Record<string, number> = {};
    participants.forEach((m) => {
      const w = weightMap[m] || 1.0;
      const baseShare = (netPaymentToDistribute * w) / totalWeight;
      singlePaymentShare[m] = baseShare + (discountMap[m] > 0 ? 0 : 0); // 割引対象者は baseShare のみ
    });

    members.forEach((m) => {
      const isPart = participants.includes(m);
      const share = isPart ? singlePaymentShare[m] || 0 : 0;
      rawShareMap[m] += share;

      paymentDetailsMap[m].push({
        paymentDescription: desc,
        paidBy: payment.paidBy,
        paymentAmount,
        memberShare: Math.round(share * 100) / 100,
        isExcluded: !isPart,
        appliedWeight: weightMap[m] !== 1.0 ? weightMap[m] : undefined,
        appliedDiscount: discountMap[m] > 0 ? discountMap[m] : undefined,
      });
    });
  });

  // 全体に対する固定割引条件（特定支払いに紐づかないもの）
  const globalDiscounts = conditions.filter((c) => {
    if (c.type !== 'fixed_discount') return false;
    return c.paymentIndex === undefined && !c.paymentDescription && !isConditionForAnyPayment(c, payments);
  });


  let totalGlobalDiscountAmount = 0;
  globalDiscounts.forEach((c) => {
    if (c.amount && rawShareMap[c.member] !== undefined) {
      const discount = Math.min(rawShareMap[c.member], c.amount);
      rawShareMap[c.member] -= discount;
      totalGlobalDiscountAmount += discount;
      const msg = `全体固定割引: -${c.amount.toLocaleString()}円${c.description ? ` (${c.description})` : ''}`;
      if (!appliedConditionsMap[c.member]?.includes(msg)) {
        appliedConditionsMap[c.member]?.push(msg);
      }
    }
  });

  // 全体固定割引分を他のメンバーで按分（割引対象外メンバーに均等配分）
  if (totalGlobalDiscountAmount > 0) {
    const nonDiscountMembers = members.filter((m) => !globalDiscounts.some((d) => d.member === m));
    if (nonDiscountMembers.length > 0) {
      const extraPerMember = totalGlobalDiscountAmount / nonDiscountMembers.length;
      nonDiscountMembers.forEach((m) => {
        rawShareMap[m] += extraPerMember;
      });
    }
  }

  // 3. 端数丸め処理（Rounding）
  const roundedShareMap: Record<string, number> = {};
  let roundedShareSum = 0;

  function roundValue(val: number, unit: number, mode: RoundingMode): number {
    if (unit <= 1) return Math.round(val);
    const quotient = val / unit;
    if (mode === 'floor') return Math.floor(quotient) * unit;
    if (mode === 'ceil') return Math.ceil(quotient) * unit;
    return Math.round(quotient) * unit;
  }

  members.forEach((m) => {
    const rounded = roundValue(rawShareMap[m], roundingUnit, roundingMode);
    roundedShareMap[m] = rounded;
    roundedShareSum += rounded;
  });

  // 端数の差分 (立替総額 - 丸め後負担額の合計)
  const diff = totalExpense - roundedShareSum;

  if (diff !== 0 && members.length > 0) {
    const stepUnit = roundingUnit > 1 ? roundingUnit : 1;
    let targetOrder = [...members];

    if (options.roundingTarget === 'highest_share') {
      targetOrder.sort((a, b) => rawShareMap[b] - rawShareMap[a]);
    } else if (options.roundingTarget === 'payer') {
      targetOrder.sort((a, b) => paidMap[b] - paidMap[a]);
    } else if (options.roundingTarget && members.includes(options.roundingTarget)) {
      targetOrder = [options.roundingTarget, ...members.filter((m) => m !== options.roundingTarget)];
    } else {
      // デフォルト: 負担額が大きい順
      targetOrder.sort((a, b) => rawShareMap[b] - rawShareMap[a]);
    }

    let currentDiff = diff;
    let idx = 0;
    while (currentDiff !== 0 && idx < 2000) {
      const targetMember = targetOrder[idx % targetOrder.length];
      const sign = currentDiff > 0 ? 1 : -1;
      const step = stepUnit * sign;

      roundedShareMap[targetMember] += step;
      currentDiff -= step;
      idx++;
    }
  }

  // 4. Net Balance（純残高）の算出
  const breakdown: MemberBreakdown[] = members.map((m) => {
    const paid = paidMap[m] || 0;
    const share = roundedShareMap[m] || 0;
    const net = paid - share;
    return {
      member: m,
      paid,
      share,
      net,
      rawShare: Math.round(rawShareMap[m] * 100) / 100,
      paymentDetails: paymentDetailsMap[m] || [],
      appliedConditions: appliedConditionsMap[m] || [],
    };
  });

  // 5. 最小送金リストの計算
  const transfers = calculateMinimumTransfers(breakdown);

  // 6. 数学的整合性の検証
  const totalPaid = Object.values(paidMap).reduce((s, v) => s + v, 0);
  const totalShare = Object.values(roundedShareMap).reduce((s, v) => s + v, 0);
  const sumNetBalance = breakdown.reduce((s, b) => s + b.net, 0);
  const totalTransferAmount = transfers.reduce((s, t) => s + t.amount, 0);

  const simulatedBalances: Record<string, number> = {};
  breakdown.forEach((b) => (simulatedBalances[b.member] = b.net));
  transfers.forEach((t) => {
    simulatedBalances[t.from] += t.amount;
    simulatedBalances[t.to] -= t.amount;
  });

  const isComplete = Object.values(simulatedBalances).every((bal) => Math.abs(bal) < 0.0001);
  const isBalanced = Math.abs(sumNetBalance) < 0.0001 && totalPaid === totalShare;

  return {
    success: true,
    transfers,
    breakdown,
    verification: {
      totalPaid,
      totalShare,
      sumNetBalance,
      totalTransferAmount,
      transferCount: transfers.length,
      isBalanced,
      isComplete,
      roundingDifference: diff,
      algorithm: 'Greedy Minimum Cash Flow with Exact-Match Heuristic',
    },
    summary: {
      totalExpense,
      memberCount: members.length,
      averagePerPerson: members.length > 0 ? Math.round(totalExpense / members.length) : 0,
    },
  };
}

/**
 * 最小送金リストの算出アルゴリズム
 */
function calculateMinimumTransfers(breakdown: MemberBreakdown[]): Transfer[] {
  const transfers: Transfer[] = [];

  interface Party {
    member: string;
    amount: number;
  }

  const creditors: Party[] = [];
  const debtors: Party[] = [];

  breakdown.forEach((b) => {
    if (b.net > 0) {
      creditors.push({ member: b.member, amount: b.net });
    } else if (b.net < 0) {
      debtors.push({ member: b.member, amount: Math.abs(b.net) });
    }
  });

  // Step 1: 金額が完全一致するペアを相殺
  for (let d = 0; d < debtors.length; d++) {
    const debtor = debtors[d];
    if (debtor.amount === 0) continue;

    for (let c = 0; c < creditors.length; c++) {
      const creditor = creditors[c];
      if (creditor.amount === 0) continue;

      if (debtor.amount === creditor.amount) {
        transfers.push({
          from: debtor.member,
          to: creditor.member,
          amount: debtor.amount,
        });
        debtor.amount = 0;
        creditor.amount = 0;
        break;
      }
    }
  }

  let activeDebtors = debtors.filter((d) => d.amount > 0);
  let activeCreditors = creditors.filter((c) => c.amount > 0);

  // Step 2: 貪欲法（Greedy）
  while (activeDebtors.length > 0 && activeCreditors.length > 0) {
    activeDebtors.sort((a, b) => b.amount - a.amount);
    activeCreditors.sort((a, b) => b.amount - a.amount);

    const debtor = activeDebtors[0];
    const creditor = activeCreditors[0];

    const transferAmount = Math.min(debtor.amount, creditor.amount);

    transfers.push({
      from: debtor.member,
      to: creditor.member,
      amount: transferAmount,
    });

    debtor.amount -= transferAmount;
    creditor.amount -= transferAmount;

    activeDebtors = activeDebtors.filter((d) => d.amount > 0.0001);
    activeCreditors = activeCreditors.filter((c) => c.amount > 0.0001);
  }

  return transfers;
}
