/** Demonstration economics; not advertising network rates or withdrawable money. */
export type AdSource = string;
/** Public cents may have fractional cents; arithmetic uses integer micro-cents. */
export type PreciseCents = number;
export type OfferStatus = 'reserved' | 'showing' | 'confirmed' | 'cancelled' | 'error' | 'no-offer' | 'expired';
export interface MiningSession {
  id: string; startedAt: number; endsAt: number; durationMs: number;
  nodeId: string; tier: number; rewardCents: PreciseCents;
  freeBaseCents: PreciseCents; adRewardCents: PreciseCents;
  contractBonusCents: PreciseCents; sponsorBonusCents: PreciseCents;
  contractReservations: {dayKey: number; id: string; rewardCents: PreciseCents}[];
  minedMicroCents: number; lastRecalculatedAt: number;
  /** Exact mined anchor; decimal BigInt strings for JSON persistence. */
  minedNumerator: string; minedDenominator: string; eventIds: string[];
  status: 'mining' | 'finishing' | 'ready' | 'credited';
  creditStatus: 'pending' | 'credited'; creditedAt: number | null;
  creditedCents: number; creditOperation?: string; waitUntil?: number | null;
  readyAt?: number; adjustmentEventId?: string; parentSessionId?: string | null;
}
export interface RewardAdEvent {
  id: string; status: OfferStatus; source: AdSource; rewardCents: number;
  sessionId: string | null; quotaDay: number; nodeId: string; durationMs: number;
  offeredAt: number; expiresAt: number; shownAt?: number; readyAt?: number;
  confirmedAt: number | null; confirmationId: string | null;
  baseRewardCents?: PreciseCents; adRewardCents?: PreciseCents;
  rewardBonusBps?: number; sponsorBonusCents?: PreciseCents;
  contractDay?: number; contractId?: string; contractBonusCents?: PreciseCents;
  contractReservationId?: string; campaignId?: string | null;
  adjustmentOperation?: string; adjustmentSessionId?: string;
}
export interface AdOffer {
  reason: 'available' | 'pending' | 'cooldown' | 'daily' | 'unavailable' | 'finishing' | 'ready';
  source?: AdSource; rewardCents?: number; durationMs?: number; nodeId?: string;
  tier?: number; nextAt: number; sessionId?: string | null;
}
export interface MiningSnapshot {
  unit: number; serverNow: number; accumulatedMicroCents: number;
  sessionId: string | null; sessionRewardCents: number; sessionDurationMs: number;
  /** Ready rewards stay pending until an explicit rewardClaim. */
  readyCents: number; readySessionIds: string[]; inMiningMicroCents: number;
  /** Exact rational micro-cents/minute, JSON-safe decimal integer strings. */
  rate: {numerator: string; denominator: string};
  activeCount: number; readyCount: number; nearestId: string | null;
  remainingMs: number; progress: number; status: 'idle' | 'active' | 'finishing' | 'ready';
  offer: AdOffer; adPending: boolean; maxDailyViews: number;
  contracts: ContractSnapshot; campaigns: SponsoredCampaign[]; canSelectNode: boolean;
  viewBonuses: {today: ViewBonus[]; pending: ViewBonus[]; timezone: 'UTC'};
}
export interface ViewBonus {
  dayKey: number; views: number; rewardCents: number; progress: number;
  funded: boolean; reservationId: string; earnedAt: number | null; claimedAt: number | null;
  status: 'locked' | 'ready' | 'claimed' | 'unavailable'; creditOperation?: string;
}
export interface MiningContract {
  id: string; name: [string, string]; views: number; progress: number;
  rewardCents: PreciseCents; funded: boolean; reservationId: string;
  eventIds: string[]; status: 'active' | 'locked' | 'completed' | 'expired' | 'unavailable';
  completedAt: number | null; sessionId: string | null; paidAt?: number;
  creditOperation?: string;
}
export interface ContractSnapshot {
  key: number; endsAt: number; allocatedCents: number; committedCents: number; paidCents: number;
  items: MiningContract[]; active: MiningContract | null; next: MiningContract | null;
  completedTotal: number; allComplete: boolean; timezone: 'Europe/Moscow';
}
export interface SponsoredCampaign {
  id: string; name: [string, string]; partner: [string, string]; offer: [string, string];
  action: [string, string]; rewardCents: PreciseCents; startsAt?: number; endsAt?: number;
  deadline?: [string, string]; restrictions: [string, string]; confirmation: [string, string];
  requiredTier?: number; requiredNodeId?: string; requiredNodeName?: [string, string];
  active: boolean; demo?: boolean; eligible: boolean;
}
/** Replace createDemo with a provider implementation of this interface.
 * Production confirmation MUST originate from a server-verified SDK callback.
 * Browser buttons and client clocks are never production reward evidence.
 */
export interface RewardedAdAdapter {
  show(offer: AdOffer): Promise<void>;
  confirm(): Promise<void>;
  cancel(outcome?: 'cancelled' | 'error' | 'no-offer'): Promise<void>;
  tick(snapshot: unknown): void;
  readonly active: string | null;
}
