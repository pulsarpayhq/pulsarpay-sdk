// ─────────────────────────────────────────────
// Pulsarpay SDK — Types
// ─────────────────────────────────────────────

export type Currency = "USDC" | "USD";

export type PayoutNetwork = "SOL" | "PAYPAL";

export type ChargeStatus = "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED";

export type PayoutStatus = "PENDING" | "COMPLETED" | "FAILED";

// ── Agents ────────────────────────────────────

export interface AgentRegistrationRequest {
  /** Unique human-readable name for the agent. Shown in user auth logs. */
  name: string;
  /** Developer or organization email. Used for account activation. */
  email: string;
  /** Official landing page or documentation URL. */
  website: string;
}

export interface AgentRegistrationResponse {
  /** Onboarding instructions and next steps. */
  message: string;
  /**
   * Secret API key for the agent. Used in `x-agent-key` header.
   * **Shown only once — store it securely.**
   */
  apiKey: string;
  /** Whether the agent is active and can process payments. New agents start as `false`. */
  enabled: boolean;
}

// ── Charges ───────────────────────────────────

export interface CreateChargeRequest {
  /** Amount to charge in decimal units (e.g. `1.50` = 1.50 USDC). */
  amount: number;
  /** Must match the user's available balance currency. */
  currency: Currency;
  /** Service description shown to the user in their transaction history. Max 255 chars. */
  description: string;
}

export interface CreateChargeResponse {
  success: boolean;
  /** Unique ID of the created charge. */
  chargeId: string;
  /** `true` if the idempotency key was reused (duplicate request). */
  reused: boolean;
}

export interface ChargeItem {
  id: string;
  idempotencyKey: string;
  amount: number;
  currency: Currency;
  description: string;
  status: ChargeStatus;
  createdAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChargeListResponse {
  data: ChargeItem[];
  pagination: Pagination;
}

export interface ListChargesOptions {
  /** Page number (default: 1). */
  page?: number;
  /** Max records per page (default: 50). */
  limit?: number;
}

// ── Earnings ──────────────────────────────────

export interface EarningsEntry {
  /** Currency for this earnings entry. */
  currency: Currency;
  /** Net amount earned after platform fees. Available for withdrawal. */
  totalEarned: number;
  /** Total number of successful charges in this currency. */
  totalCharges: number;
  /** Current balance available for withdrawal in this currency. */
  currentBalance: number;
}

export interface EarningsResponse {
  /** One entry per supported currency. Each currency maintains an independent balance. */
  earnings: EarningsEntry[];
}

// ── Withdrawals ───────────────────────────────

export interface WithdrawRequest {
  /** Amount to withdraw in the specified currency (minimum: 1.00). */
  amount: number;
  /** Currency to withdraw. Use `USDC` for a Solana wallet or `USD` for PayPal. */
  currency: Currency;
  /** Destination address: Solana wallet for `USDC`, PayPal ID/email for `USD`. */
  walletAddress: string;
}

export interface WithdrawBreakdown {
  /** Total amount requested before fees. */
  grossAmount: number;
  /** Platform fee percentage applied (e.g. `"3%"`). */
  platformFeeRate: string;
  /** Absolute fee amount deducted. */
  platformFee: number;
  /** Final amount transferred after deducting the fee. */
  netAmount: number;
  /** Token used for the withdrawal. */
  currency: Currency;
  /** Destination address — Solana wallet or PayPal ID/email. */
  walletAddress: string;
  /** Destination network. `SOL` for Solana (USDC), `PAYPAL` for USD. */
  network: PayoutNetwork;
}

export interface WithdrawResponse {
  /** Confirms the withdrawal was broadcasted to the network. */
  success: boolean;
  /** Internal tracking ID for the withdrawal. */
  payoutId: string;
  /** Detailed breakdown of amounts, fees, and destination. */
  breakdown: WithdrawBreakdown;
}

// ── Payouts ───────────────────────────────────

export interface PayoutDestination {
  /** Destination network. `SOL` for Solana (USDC), `PAYPAL` for USD. */
  network: PayoutNetwork;
  /** Destination address — Solana wallet or PayPal ID/email. */
  walletAddress: string;
}

export interface PayoutItem {
  /** Unique identifier for the payout record. */
  id: string;
  /** ID of the agent who initiated the withdrawal. */
  agentId: string;
  /** Token used for the withdrawal. */
  currency: Currency;
  /** Current state of the withdrawal. */
  status: PayoutStatus;
  /** Destination network and wallet address. */
  destination: PayoutDestination;
  /** External reference ID for the payout. */
  externalId: string;
  /** On-chain transaction hash. `null` until processed. */
  txHash: string | null;
  /** Timestamp when the withdrawal was initiated. */
  createdAt: string;
  /** Timestamp when the withdrawal was processed. `null` if still pending. */
  processedAt: string | null;
  /** Net amount transferred after deducting the platform fee. */
  amount: number;
  /** Platform fee deducted from the gross withdrawal amount. */
  fee: number;
  /** Fee rate applied to this withdrawal (e.g. `"3%"`). */
  platformFeeRate: string;
}

export interface PayoutListResponse {
  /** All withdrawal records for the authenticated agent. */
  payouts: PayoutItem[];
}

export interface PayoutSingleResponse {
  /** The withdrawal record matching the provided `payoutId`. */
  payout: PayoutItem;
}

export interface ListWithdrawalsOptions {
  /** When provided, filters the result to a single payout matching this ID. */
  payoutId?: string;
}

// ── SDK Config ────────────────────────────────

export interface PulsarpayConfig {
  /**
   * Agent secret key (`ag_live_...`).
   * Required for all endpoints except `agents.register()`.
   */
  agentKey?: string;
  /** Override the base URL (default: `https://www.pulsarpay.io`). */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000). */
  timeout?: number;
}
