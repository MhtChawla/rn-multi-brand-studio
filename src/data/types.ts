export type Tier = 'bronze' | 'silver' | 'gold';

export interface Member {
  id: string;
  name: string;
  points: number;
  tier: Tier;
  nextTierPoints: number;
  memberId: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category: string;
}

export interface Activity {
  id: string;
  type: 'earn' | 'redeem';
  title: string;
  points: number;
  dateISO: string;
}
