# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build          # Compile TypeScript to dist/
npm run lint           # Type-check without emitting (tsc --noEmit)
npm test               # Run all tests once
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage (enforces ≥85% threshold)
```

To run a single test file:
```bash
npx vitest run src/__tests__/payments.test.ts
```

## Architecture

This is an ESM-only TypeScript SDK that compiles to `dist/` and is published to npm.

**Call chain:** `PulsarpayClient` → `HttpClient` + resource classes → native `fetch`

### Key files

- `src/client.ts` — `PulsarpayClient` constructor. Wires `HttpClient` to `AgentsResource` and `PaymentsResource`. The `agentKey` is passed to `PaymentsResource` as a lazy resolver callback so missing keys throw at call time, not construction time.
- `src/http-client.ts` — `HttpClient`. Wraps native `fetch` with `AbortController`-based timeout, query param building, and HTTP status → typed error mapping.
- `src/resources/agents.ts` — `AgentsResource.register()`. No auth required.
- `src/resources/payments.ts` — `PaymentsResource`: `createCharge`, `getCharge`, `listCharges`, `getEarnings`, `withdraw`. All require `x-agent-key` header; `createCharge` also requires `x-user-key`.
- `src/errors/index.ts` — Six typed error classes extending `PulsarpayError` (base). Each carries `statusCode` and `raw` response body.
- `src/types/index.ts` — All request/response interfaces and the `PulsarpayConfig` type.
- `src/index.ts` — Public re-exports only.

### Auth model

Authentication uses custom headers rather than Bearer tokens:
- `x-agent-key: ag_live_...` — identifies and authorizes the agent (required for all payment endpoints)
- `x-user-key: pp_live_...` — the end-user's authorization token (required only for `createCharge`)

### Idempotency

`createCharge` and `withdraw` accept an optional `idempotencyKey`. If omitted, one is auto-generated via `crypto.randomUUID()` (requires Node ≥ 18).

### Module resolution

Uses `NodeNext` module resolution. All internal imports use `.js` extensions (e.g. `"./http-client.js"`) even though the source files are `.ts`. `tsconfig.json` excludes `src/__tests__` from compilation — tests run directly via Vitest without being compiled to `dist/`.

### Testing approach

Tests mock `globalThis.fetch` via `vi.spyOn` (see `src/__tests__/helpers.ts`). Shared fixtures and mock utilities (`mockFetch`, `mockFetchNetworkError`, `mockFetchAbort`) live in `helpers.ts` and are imported by all test files. Do not add real HTTP calls or external dependencies to tests.
