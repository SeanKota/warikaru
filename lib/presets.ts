import { CalculateRequest } from './types';

export interface Preset {
  id: string;
  name: string;
  description: string;
  data: CalculateRequest;
}

export const PRESETS: Preset[] = [
  {
    id: 'drinking-party',
    name: '飲み会＆タクシー（定番例）',
    description: 'Aさんが居酒屋立替、Bさんがタクシー立替。Cさんはタクシー不参加＆1,000円割引、Aさん1.5倍。',
    data: {
      members: ['Aさん', 'Bさん', 'Cさん'],
      payments: [
        { paidBy: 'Aさん', amount: 12000, description: '一次会（居酒屋）' },
        { paidBy: 'Bさん', amount: 3000, description: 'タクシー代' },
      ],
      conditions: [
        {
          type: 'exclude',
          member: 'Cさん',
          paymentDescription: 'タクシー代',
          description: 'タクシー乗っていないためタクシー代から除外',
        },
        {
          type: 'weight',
          member: 'Aさん',
          weight: 1.5,
          description: '幹事・上司のため1.5倍負担',
        },
        {
          type: 'fixed_discount',
          member: 'Cさん',
          amount: 1000,
          description: '遅刻参加のため1,000円割引',
        },
      ],
      options: {
        roundingUnit: 100,
        roundingMode: 'round',
        roundingTarget: 'highest_share',
      },
    },
  },
  {
    id: 'weekend-trip',
    name: '週末ドライブ旅行（4人）',
    description: 'レンタカー・高速・宿・食事を各自が分担して立替え。学生1名は0.7倍負担。',
    data: {
      members: ['佐藤', '鈴木', '高橋', '田中（学生）'],
      payments: [
        { paidBy: '佐藤', amount: 18000, description: 'レンタカー代＋ガソリン' },
        { paidBy: '鈴木', amount: 9600, description: '高速道路料金（往復）' },
        { paidBy: '高橋', amount: 36000, description: 'コテージ宿泊費' },
        { paidBy: '田中（学生）', amount: 8400, description: '買い出し・朝食' },
      ],
      conditions: [
        {
          type: 'weight',
          member: '田中（学生）',
          weight: 0.7,
          description: '学生割引（0.7倍）',
        },
      ],
      options: {
        roundingUnit: 100,
        roundingMode: 'round',
        roundingTarget: 'highest_share',
      },
    },
  },
  {
    id: 'bbq-party',
    name: 'BBQパーティー（お酒・ノンアル）',
    description: 'お肉と会場費は全員、アルコール代はお酒を飲んだ人だけで割り勘。',
    data: {
      members: ['山田', '佐々木', '伊藤', '渡辺（ノンアル）'],
      payments: [
        { paidBy: '山田', amount: 14000, description: '肉・食材・BBQグリル' },
        { paidBy: '佐々木', amount: 6000, description: 'ビール・チューハイ（お酒）' },
        { paidBy: '伊藤', amount: 2000, description: 'ソフトドリンク・氷' },
      ],
      conditions: [
        {
          type: 'exclude',
          member: '渡辺（ノンアル）',
          paymentDescription: 'お酒',
          description: '車運転・ノンアルのため酒代除外',
        },
      ],
      options: {
        roundingUnit: 10,
        roundingMode: 'round',
      },
    },
  },
];
