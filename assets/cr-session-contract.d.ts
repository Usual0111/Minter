/** Integration contract for Home CR sessions. Monetary amounts are integer CR cents. */
export type Cents = number;
export type UnixMs = number;
export interface CRSession {
  id: string; galaxy: string; startedAt: UnixMs; endsAt: UnixMs; durationMs: number;
  baseCents: Cents; bonusOfferCents: Cents; bonusCents: Cents;
  bonusEligibleAt: UnixMs; bonusOperation: string | null;
  claimedAt: UnixMs | null; claimOperation: string | null; source: 'free' | 'ad';
  /** Absent on legacy sessions, which retain one bonus and their original deadline. */
  maxBoosts?: number; boostReductionMs?: number; boostOperations?: string[];
  /** Presentation-only progress anchor captured at a confirmed time reduction. */
  progressAt?: UnixMs; progressBase?: number;
}
export interface CRSessionView {
  phase: 'ready' | 'ad-start' | 'active' | 'completed' | 'unavailable';
  session: CRSession | null; serverNow: UnixMs; galaxy: string;
  /** Presentation units only: 100 = one CR cent; never used to credit a balance. */
  accruedHundredthsOfCent: number;
  totalCents: Cents; durationMs: number; remainingMs: number; progress: number;
  freeLeft: number; adLeft: number; nextFreeAt: UnixMs | null;
  canStartFree: boolean; canStartAd: boolean; canBonus: boolean; canClaim: boolean;
  adPending: boolean; adNextAt: UnixMs; bonusOfferCents: Cents;
  boostsUsed: number; maxBoosts: number; boostReductionMs: number; bonusCents: Cents;
  weeklyCompleted: number; weeklyGoal: number; weekEndsAt: UnixMs;
}
export interface SessionClaimResult {
  sessionId: string; credited: Cents; operation: string; alreadyClaimed?: boolean;
}
/** Production adapter to be implemented on a trusted backend, not in the WebView. */
export interface SessionIntegration {
  readonly mode: 'local-demo' | 'server-demo' | 'production';
  getState(): Promise<CRSessionView>;
  startFree(requestId: string): Promise<{sessionId: string; alreadyActive?: boolean}>;
  claim(sessionId: string, requestId: string): Promise<SessionClaimResult>;
  requestRewardedAd(purpose: 'sessionStart' | 'sessionBonus', sessionId?: string): Promise<{
    adId: string; expiresAt: UnixMs; status: 'available' | 'no-fill';
  }>;
  /** Poll trusted backend after signed provider callback; closing a player is not proof. */
  getAdResult(adId: string): Promise<{
    status: 'pending' | 'confirmed' | 'cancelled' | 'failed'; state: CRSessionView;
  }>;
}
