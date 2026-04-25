// ─────────────────────────────────────────────
// Pulsarpay SDK — Test Helpers
// ─────────────────────────────────────────────

import { vi } from "vitest";

export const AGENT_KEY = "ag_live_testkey123";
export const USER_KEY = "pp_live_userkey456";
export const IDEMPOTENCY_KEY = "f77af2f2-7a83-4b60-88e1-2808a4d08779";

/**
 * Creates a mock fetch Response with JSON body and correct content-type header.
 */
export function mockJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Creates a mock fetch Response with plain text body.
 */
export function mockTextResponse(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: { "Content-Type": "text/plain" },
  });
}

/**
 * Spies on globalThis.fetch and returns the given response once.
 */
export function mockFetch(response: Response) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(response);
}

/**
 * Spies on globalThis.fetch and rejects with a network error.
 */
export function mockFetchNetworkError(message = "Failed to fetch") {
  return vi
    .spyOn(globalThis, "fetch")
    .mockRejectedValueOnce(new TypeError(message));
}

/**
 * Spies on globalThis.fetch and simulates an AbortError (timeout).
 */
export function mockFetchAbort() {
  const err = new DOMException("The operation was aborted.", "AbortError");
  return vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(err);
}

/** Sample fixture data */
export const fixtures = {
  agentRegistration: {
    message:
      "Your agent has been created. To start processing payments, please reach out to hello@pulsarpay.io for account activation.",
    apiKey: "ag_live_xxxxxxxxxxxxxxxxxx",
    enabled: false,
  },

  charge: {
    success: true,
    chargeId: "cmnnfoagf0003jk04suqxf3k9",
    reused: false,
  },

  chargeItem: {
    id: "cmnf6jwup00091rcvo4qevr42",
    idempotencyKey: IDEMPOTENCY_KEY,
    amount: 0.5,
    currency: "USDC",
    description: "AI Inference Service",
    status: "SUCCESS" as const,
    createdAt: "2026-03-31T22:20:03.217Z",
  },

  chargeList: {
    data: [
      {
        id: "cmnf6jwup00091rcvo4qevr42",
        idempotencyKey: IDEMPOTENCY_KEY,
        amount: 0.5,
        currency: "USDC",
        description: "AI Inference Service",
        status: "SUCCESS" as const,
        createdAt: "2026-03-31T22:20:03.217Z",
      },
      {
        id: "cmnf6jwup00092rcvo4qevr43",
        idempotencyKey: "another-key",
        amount: 1.0,
        currency: "USDC",
        description: "API call",
        status: "FAILED" as const,
        createdAt: "2026-04-01T10:00:00.000Z",
      },
    ],
    pagination: {
      total: 2,
      page: 1,
      limit: 50,
      totalPages: 1,
    },
  },

  earnings: {
    currency: "USDC",
    totalEarned: 1550.75,
    totalCharges: 142,
  },

  withdrawal: {
    success: true,
    payoutId: "cmnpeptvy0005l404gq5zy7nx",
    signature: "5K8Yj2XW...",
  },
};
