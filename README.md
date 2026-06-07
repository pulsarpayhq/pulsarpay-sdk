# pulsarpay-sdk

[![npm version](https://img.shields.io/npm/v/pulsarpay-sdk)](https://www.npmjs.com/package/pulsarpay-sdk)
[![npm downloads](https://img.shields.io/npm/dm/pulsarpay-sdk)](https://www.npmjs.com/package/pulsarpay-sdk)
[![CI](https://github.com/pulsarpayhq/pulsarpay-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/pulsarpayhq/pulsarpay-sdk/actions/workflows/ci.yml)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/pulsarpay-sdk)](https://bundlephobia.com/package/pulsarpay-sdk)
[![GitHub issues](https://img.shields.io/github/issues/pulsarpayhq/pulsarpay-sdk)](https://github.com/pulsarpayhq/pulsarpay-sdk/issues)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js ≥18](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-ESM-blue?logo=typescript)](https://www.typescriptlang.org)

Official TypeScript SDK for the [Pulsarpay](https://www.pulsarpay.io) API — automated payment infrastructure for APIs and autonomous agents.

## Installation

```bash
npm install pulsarpay-sdk
# or
pnpm add pulsarpay-sdk
# or
yarn add pulsarpay-sdk
```

## Quick Start

```ts
import { PulsarpayClient } from "pulsarpay-sdk";

const client = new PulsarpayClient({
  agentKey: process.env.PULSARPAY_AGENT_KEY!,
});
```

---

## Usage

### Register an Agent

Register your agent once during onboarding. The `apiKey` is returned **only once** — store it immediately.

```ts
const result = await client.agents.register({
  name: "my-inference-agent",
  email: "dev@mycompany.com",
  website: "https://mycompany.com",
});

console.log(result.apiKey);   // ag_live_... (save this!)
console.log(result.enabled);  // false — contact hello@pulsarpay.io for activation
```

---

### Create a Charge

Debit a user's balance. Requires the user's `pp_live_...` key. An idempotency key is auto-generated if not provided.

```ts
const charge = await client.payments.createCharge(
  {
    amount: 0.5,
    currency: "USDC",
    description: "AI Inference - 1000 tokens",
  },
  {
    userKey: "pp_live_7698774c...",
    // idempotencyKey: "uuid-v4-optional", // auto-generated if omitted
  }
);

console.log(charge.chargeId); // cmnnfoagf0003jk04suqxf3k9
console.log(charge.reused);   // true if idempotency key was reused
```

---

### Get a Charge

Poll the status of a specific charge.

```ts
const charge = await client.payments.getCharge("cmn3tney00001l104hudm7fgy");

console.log(charge.status);    // "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED"
console.log(charge.amount);    // 0.5
console.log(charge.currency);  // "USDC"
```

---

### List Charges

Retrieve a paginated list of all charges for reconciliation and auditing.

```ts
const result = await client.payments.listCharges({ page: 1, limit: 20 });

console.log(result.pagination.total);      // 142
console.log(result.pagination.totalPages); // 8

for (const charge of result.data) {
  console.log(charge.id, charge.status, charge.amount);
}
```

---

### Get Earnings

View your agent's net earnings, total successful charges, and pending balance. Each supported currency (`USDC` and `USD`) has an independent balance entry.

```ts
const { earnings } = await client.payments.getEarnings();

for (const entry of earnings) {
  console.log(entry.currency);        // "USDC" | "USD"
  console.log(entry.totalEarned);     // net earned after fees
  console.log(entry.totalCharges);    // number of successful charges
  console.log(entry.currentBalance);  // available for withdrawal
}
```

---

### List Withdrawals

Retrieve all withdrawal records, or a single one by ID.

```ts
import type { PayoutListResponse, PayoutSingleResponse } from "pulsarpay-sdk";

// All withdrawals
const { payouts } = await client.payments.listWithdrawals() as PayoutListResponse;
for (const p of payouts) {
  console.log(p.id, p.status, p.amount); // "cmoq..." "COMPLETED" 97
}

// Single withdrawal by ID
const { payout } = await client.payments.listWithdrawals({
  payoutId: "cmoqbpavp00071ry1t2iyr1hw",
}) as PayoutSingleResponse;

console.log(payout.status);                   // "PENDING" | "COMPLETED" | "FAILED"
console.log(payout.destination.walletAddress); // "7AEai..."
console.log(payout.fee, payout.platformFeeRate); // 3, "3%"
```

---

### Withdraw Funds

Transfer earned balance to a Solana wallet (USDC) or a PayPal account (USD). Minimum withdrawal is **1.00**. A 3% platform fee is deducted from the gross amount.

```ts
// USDC → Solana wallet
const payout = await client.payments.withdraw({
  amount: 100,
  currency: "USDC",
  walletAddress: "8ixbQzsFc9FkxegG7aumq3h1XCGDkRSN23xeLTnZiyHr",
});

console.log(payout.success);                    // true
console.log(payout.payoutId);                   // "cmoqbpavp00071ry1t2iyr1hw"
console.log(payout.breakdown.netAmount);        // 97
console.log(payout.breakdown.platformFee);      // 3
console.log(payout.breakdown.platformFeeRate);  // "3%"
console.log(payout.breakdown.network);          // "SOL"

// USD → PayPal
const payout = await client.payments.withdraw({
  amount: 50,
  currency: "USD",
  walletAddress: "your-paypal-id@example.com",
});

console.log(payout.breakdown.network);  // "PAYPAL"
```

---

## Error Handling

All errors extend `PulsarpayError` and include a `statusCode` and `raw` body.

```ts
import {
  PulsarpayInsufficientFundsError,
  PulsarpayUnauthorizedError,
  PulsarpayBadRequestError,
  PulsarpayNotFoundError,
  PulsarpayConflictError,
  PulsarpayNetworkError,
  PulsarpayError,
} from "pulsarpay-sdk";

try {
  await client.payments.createCharge(data, options);
} catch (err) {
  if (err instanceof PulsarpayInsufficientFundsError) {
    console.error("User has no funds:", err.message);
  } else if (err instanceof PulsarpayUnauthorizedError) {
    console.error("Invalid agent or user key:", err.message);
  } else if (err instanceof PulsarpayBadRequestError) {
    console.error("Validation error:", err.message); // e.g. currency mismatch
  } else if (err instanceof PulsarpayNetworkError) {
    console.error("Network/timeout error:", err.message);
  } else if (err instanceof PulsarpayError) {
    console.error(`Unexpected error [${err.statusCode}]:`, err.message);
  }
}
```

| Class | HTTP Status | When |
|---|---|---|
| `PulsarpayBadRequestError` | 400 | Validation / logic error |
| `PulsarpayUnauthorizedError` | 401 | Invalid or disabled key |
| `PulsarpayInsufficientFundsError` | 402 | User balance too low |
| `PulsarpayNotFoundError` | 404 | Charge ID not found |
| `PulsarpayConflictError` | 409 | Duplicate agent name |
| `PulsarpayNetworkError` | — | Timeout or network failure |

---

## Configuration

```ts
const client = new PulsarpayClient({
  agentKey: "ag_live_...",   // required
  baseUrl: "https://...",    // optional — defaults to https://www.pulsarpay.io
  timeout: 15_000,           // optional — defaults to 30000ms
});
```

---

## Requirements

- Node.js **≥ 18** (uses native `fetch` and `crypto.randomUUID`)
- TypeScript **≥ 5.0** (optional but recommended)

---

## Development & Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report (enforces ≥ 85% threshold)
npm run test:coverage
```

Coverage is enforced at **85%** for lines, functions, branches, and statements via `@vitest/coverage-v8`. Running `npm run test:coverage` will fail the build if any threshold is not met.

### Test structure

```
src/__tests__/
├── helpers.ts          ← shared fixtures and fetch mock utilities
├── errors.test.ts      ← all 6 error classes
├── http-client.test.ts ← HTTP mappings, timeout, network errors
├── client.test.ts      ← PulsarpayClient constructor
├── agents.test.ts      ← agents.register()
└── payments.test.ts    ← createCharge, getCharge, listCharges, getEarnings, listWithdrawals, withdraw
```
