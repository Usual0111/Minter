/** Demonstration economics; not advertising network rates or withdrawable money. */
export type AdSource = 'premium' | 'normal-a' | 'normal-b';
export type OfferStatus = 'reserved' | 'showing' | 'confirmed' | 'cancelled' | 'error' | 'no-offer' | 'expired';
export interface MiningSession {
  id: string; startedAt: number; endsAt: number; durationMs: number;
  nodeId: string; tier: number; rewardCents: number;
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
