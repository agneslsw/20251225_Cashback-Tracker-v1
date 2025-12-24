
export type Status = 'Pending' | 'Confirmed' | 'TBC';

export interface Card {
  id: string;
  name: string;
  startingCashback: number;
  manualOverride?: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  cardId: string;
  amount: number;
  status: Status;
  merchantTypes: string[];
  rebatePercent: number;
  isRedemption: boolean; // Spending cashback
  isCashbackIn?: boolean; // Received promo payout
}

export interface Promotion {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  additionalRebate: number;
  minAmount?: number;
  maxAmount?: number;
  targetAmount?: number;
  maxCashback?: number;
  rebateByDate?: string;
  targetMerchantTypes: string[];
  rebateMerchantTypes: string[];
  eligibleCardIds: string[];
  isPaidOff?: boolean;
}

export interface OneTimePromo {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  rebateAmount: number;
  eligibleCardIds: string[];
  isPaidOff?: boolean;
}

export interface RebateConfig {
  cardId: string;
  basicRebate: number;
  merchantTypeRebates: Record<string, number>;
}

export enum Tab {
  Transactions = 'Transactions',
  Summary = 'Summary',
  Promotion = 'Promotion',
  Settings = 'Settings'
}
