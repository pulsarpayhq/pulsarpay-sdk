// ─────────────────────────────────────────────
// Pulsarpay SDK — Payments Resource
// ─────────────────────────────────────────────

import { HttpClient } from "../http-client.js";
import type {
  ChargeItem,
  ChargeListResponse,
  CreateChargeRequest,
  CreateChargeResponse,
  EarningsResponse,
  ListChargesOptions,
  WithdrawRequest,
  WithdrawResponse,
} from "../types/index.js";

export interface CreateChargeOptions {
  /**
   * User's authorization token (`pp_live_...`).
   * Allows the agent to debit the user's credits.
   */
  userKey: string;
  /**
   * UUID v4 string to prevent duplicate charges on network retries.
   * If omitted, one is auto-generated for you.
   */
  idempotencyKey?: string;
}

export interface WithdrawOptions {
  /**
   * UUID v4 string to ensure the withdrawal is only processed once.
   * If omitted, one is auto-generated for you.
   */
  idempotencyKey?: string;
}

/** Generates a UUID v4. Works in Node.js ≥ 14.17 and modern browsers. */
function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export class PaymentsResource {
  constructor(
    private readonly http: HttpClient,
    private readonly resolveAgentKey: () => string
  ) {}

  /**
   * Create a charge against a user's balance.
   *
   * Requires the user's authorization key (`pp_live_...`) and an idempotency
   * key to safely retry requests without risk of double-charging.
   *
   * @example
   * ```ts
   * const charge = await client.payments.createCharge(
   *   {
   *     amount: 0.5,
   *     currency: "USDC",
   *     description: "AI Inference - 1000 tokens",
   *   },
   *   { userKey: "pp_live_..." }
   * );
   * console.log(charge.chargeId);
   * ```
   */
  async createCharge(
    data: CreateChargeRequest,
    options: CreateChargeOptions
  ): Promise<CreateChargeResponse> {
    const idempotencyKey = options.idempotencyKey ?? generateUUID();
    return this.http.request<CreateChargeResponse>({
      method: "POST",
      path: "/api/v1/agents/charges",
      headers: {
        "x-agent-key": this.resolveAgentKey(),
        "x-user-key": options.userKey,
        "Idempotency-Key": idempotencyKey,
      },
      body: data,
    });
  }

  /**
   * Retrieve a single charge by its ID.
   *
   * Use this to poll the status of a transaction (`PENDING` → `SUCCESS` | `FAILED` | `EXPIRED`).
   *
   * @example
   * ```ts
   * const charge = await client.payments.getCharge("cmn3tney00001l104hudm7fgy");
   * console.log(charge.status); // "SUCCESS"
   * ```
   */
  async getCharge(chargeId: string): Promise<ChargeItem> {
    return this.http.request<ChargeItem>({
      method: "GET",
      path: `/api/v1/agents/charge/${encodeURIComponent(chargeId)}`,
      headers: { "x-agent-key": this.resolveAgentKey() },
    });
  }

  /**
   * List all charges processed by this agent, with pagination.
   *
   * @example
   * ```ts
   * const result = await client.payments.listCharges({ page: 1, limit: 20 });
   * console.log(result.pagination.total);
   * for (const charge of result.data) {
   *   console.log(charge.id, charge.status);
   * }
   * ```
   */
  async listCharges(options: ListChargesOptions = {}): Promise<ChargeListResponse> {
    return this.http.request<ChargeListResponse>({
      method: "GET",
      path: "/api/v1/agents/charges",
      headers: { "x-agent-key": this.resolveAgentKey() },
      query: {
        page: options.page,
        limit: options.limit,
      },
    });
  }

  /**
   * Get the agent's earnings summary.
   *
   * Returns total earned (net of platform fees) and number of successful charges.
   *
   * @example
   * ```ts
   * const earnings = await client.payments.getEarnings();
   * console.log(`Earned: ${earnings.totalEarned} ${earnings.currency}`);
   * ```
   */
  async getEarnings(): Promise<EarningsResponse> {
    return this.http.request<EarningsResponse>({
      method: "GET",
      path: "/api/v1/agents/earnings",
      headers: { "x-agent-key": this.resolveAgentKey() },
    });
  }

  /**
   * Withdraw earned balance to a Solana wallet in USDC.
   *
   * Minimum withdrawal: **1.00 USDC**.
   * An idempotency key is required to prevent double payouts — one is
   * auto-generated if not provided.
   *
   * @example
   * ```ts
   * const payout = await client.payments.withdraw({
   *   amount: 100,
   *   walletAddress: "8ixbQzsFc9FkxegG7aumq3h1XCGDkRSN23xeLTnZiyHr",
   * });
   * console.log(`Tx signature: ${payout.signature}`);
   * ```
   */
  async withdraw(
    data: WithdrawRequest,
    options: WithdrawOptions = {}
  ): Promise<WithdrawResponse> {
    const idempotencyKey = options.idempotencyKey ?? generateUUID();
    return this.http.request<WithdrawResponse>({
      method: "POST",
      path: "/api/v1/agents/withdraw",
      headers: {
        "x-agent-key": this.resolveAgentKey(),
        "Idempotency-Key": idempotencyKey,
      },
      body: data,
    });
  }
}
