// ─────────────────────────────────────────────
// Pulsarpay SDK — Public API
// ─────────────────────────────────────────────

export { PulsarpayClient } from "./client.js";

// Errors
export {
  PulsarpayError,
  PulsarpayBadRequestError,
  PulsarpayUnauthorizedError,
  PulsarpayInsufficientFundsError,
  PulsarpayNotFoundError,
  PulsarpayConflictError,
  PulsarpayNetworkError,
} from "./errors/index.js";

// Types
export type {
  PulsarpayConfig,
  Currency,
  ChargeStatus,
  PayoutStatus,
  AgentRegistrationRequest,
  AgentRegistrationResponse,
  CreateChargeRequest,
  CreateChargeResponse,
  ChargeItem,
  ChargeListResponse,
  ListChargesOptions,
  EarningsResponse,
  WithdrawRequest,
  WithdrawBreakdown,
  WithdrawResponse,
  PayoutDestination,
  PayoutItem,
  PayoutListResponse,
  PayoutSingleResponse,
  ListWithdrawalsOptions,
  Pagination,
} from "./types/index.js";

// Resource option types (defined alongside their resource)
export type {
  CreateChargeOptions,
  WithdrawOptions,
} from "./resources/payments.js";
