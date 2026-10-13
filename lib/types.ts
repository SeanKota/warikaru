export type ConditionType = 'exclude' | 'weight' | 'fixed_discount' | 'fixed_amount';

export interface Condition {
  id?: string;
  type: ConditionType;
  member: string;
  /** 対象とする支払いのインデックスまたは説明（未指定の場合は全体に適用） */
  paymentIndex?: number;
  paymentDescription?: string;
  /** 重み（比率。例: 1.5, 0.5, 2.0） */
  weight?: number;
  /** 固定割引額または固定負担額（円） */
  amount?: number;
  /** 条件の理由や説明 */
  description?: string;
}

export interface Payment {
  id?: string;
  paidBy: string;
  amount: number;
  description?: string;
  /** この支払いに参加したメンバー（指定しない場合は除外ルールがない限り全メンバー） */
  targetMembers?: string[];
}

export type RoundingUnit = 1 | 10 | 50 | 100 | 500 | 1000;
export type RoundingMode = 'round' | 'floor' | 'ceil';
export type RoundingTarget = 'payer' | 'highest_share' | 'equal' | string;

export interface CalculateOptions {
  /** 端数単位（1, 10, 50, 100, 500, 1000円） デフォルト: 1 */
  roundingUnit?: RoundingUnit;
  /** 丸め方式: 'round' (四捨五入), 'floor' (切り捨て), 'ceil' (切り上げ) */
  roundingMode?: RoundingMode;
  /** 端数のズレを調整する対象（'payer': 最大立替者, 'highest_share': 最大負担者, 'equal': 1人ずつ均等分配, または特定のメンバー名） */
  roundingTarget?: RoundingTarget;
}

export interface CalculateRequest {
  members: string[];
  payments: Payment[];
  conditions?: Condition[];
  options?: CalculateOptions;
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

export interface MemberBreakdown {
  member: string;
  /** 立替えた合計額 */
  paid: number;
  /** 負担すべき金額（丸め調整後） */
  share: number;
  /** 貸し借り差額（net = paid - share。正なら受取、負なら支払） */
  net: number;
  /** 丸め前の正確な負担額 */
  rawShare: number;
  /** 支払いごとの負担内訳 */
  paymentDetails: {
    paymentDescription: string;
    paidBy: string;
    paymentAmount: number;
    memberShare: number;
    isExcluded: boolean;
    appliedWeight?: number;
    appliedDiscount?: number;
  }[];
  /** 適用された全体条件 */
  appliedConditions: string[];
}

export interface CalculationVerification {
  totalPaid: number;
  totalShare: number;
  sumNetBalance: number;
  totalTransferAmount: number;
  transferCount: number;
  isBalanced: boolean;
  isComplete: boolean;
  roundingDifference: number;
  algorithm: string;
}

export interface CalculateResponse {
  success: boolean;
  message?: string;
  transfers: Transfer[];
  breakdown: MemberBreakdown[];
  verification: CalculationVerification;
  summary: {
    totalExpense: number;
    memberCount: number;
    averagePerPerson: number;
  };
}
