// ─────────────────────────────────────────────
// Pulsarpay SDK — Types
// ─────────────────────────────────────────────

export type Currency = "USDC" | "USDT" | "USD";

export type ChargeStatus = "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED";

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
  currency: string;
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

export interface EarningsResponse {
  /** Currency in which earnings are denominated. */
  currency: string;
  /** Net amount earned after platform fees. Available for withdrawal. */
  totalEarned: number;
  /** Total number of successful payment transactions. */
  totalCharges: number;
}

// ── Withdrawals ───────────────────────────────

export interface WithdrawRequest {
  /** Amount of USDC to withdraw (minimum: 1.00). */
  amount: number;
  /** Destination Solana (SPL) wallet address. */
  walletAddress: string;
}

export interface WithdrawResponse {
  /** Confirms the withdrawal was broadcasted to the network. */
  success: boolean;
  /** Internal tracking ID for the withdrawal. */
  payoutId: string;
  /** Solana transaction signature (TXID). Track on Solscan. */
  signature: string;
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
