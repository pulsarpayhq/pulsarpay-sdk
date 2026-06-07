// ─────────────────────────────────────────────
// Pulsarpay SDK — PaymentsResource Tests
// ─────────────────────────────────────────────

import { describe, it, expect, afterEach, vi } from "vitest";
import { PulsarpayClient } from "../client";
import {
  PulsarpayBadRequestError,
  PulsarpayInsufficientFundsError,
  PulsarpayNotFoundError,
  PulsarpayUnauthorizedError,
} from "../errors/index";
import {
  mockFetch,
  mockJsonResponse,
  fixtures,
  AGENT_KEY,
  USER_KEY,
  IDEMPOTENCY_KEY,
} from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
});

function makeClient() {
  return new PulsarpayClient({ agentKey: AGENT_KEY });
}

// ─────────────────────────────────────────────────────────────
// createCharge
// ─────────────────────────────────────────────────────────────

describe("payments.createCharge()", () => {
  it("returns chargeId on success", async () => {
    mockFetch(mockJsonResponse(fixtures.charge));

    const client = makeClient();
    const result = await client.payments.createCharge(
      { amount: 0.5, currency: "USDC", description: "AI Inference" },
      { userKey: USER_KEY }
    );

    expect(result.success).toBe(true);
    expect(result.chargeId).toBe("cmnnfoagf0003jk04suqxf3k9");
    expect(result.reused).toBe(false);
  });

  it("sends x-agent-key, x-user-key and Idempotency-Key headers", async () => {
    const fetchMock = mockFetch(mockJsonResponse(fixtures.charge));

    const client = makeClient();
    await client.payments.createCharge(
      { amount: 0.5, currency: "USDC", description: "test" },
      { userKey: USER_KEY, idempotencyKey: IDEMPOTENCY_KEY }
    );

    const [, options] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers["x-agent-key"]).toBe(AGENT_KEY);
    expect(headers["x-user-key"]).toBe(USER_KEY);
    expect(headers["Idempotency-Key"]).toBe(IDEMPOTENCY_KEY);
  });

  it("auto-generates idempotency key when not provided", async () => {
    const fetchMock = mockFetch(mockJsonResponse(fixtures.charge));

    const client = makeClient();
    await client.payments.createCharge(
      { amount: 0.5, currency: "USDC", description: "test" },
      { userKey: USER_KEY }
    );

    const [, options] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    // Should be a valid UUID v4 pattern
    expect(headers["Idempotency-Key"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("sends correct body to POST /api/v1/agents/charges", async () => {
    const fetchMock = mockFetch(mockJsonResponse(fixtures.charge));

    const client = makeClient();
    const payload = { amount: 1.5, currency: "USD" as const, description: "Embedding call" };
    await client.payments.createCharge(payload, { userKey: USER_KEY });

    const [url, options] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/agents/charges");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body as string)).toEqual(payload);
  });

  it("marks reused=true when idempotency key is reused", async () => {
    mockFetch(mockJsonResponse({ ...fixtures.charge, reused: true }));

    const client = makeClient();
    const result = await client.payments.createCharge(
      { amount: 0.5, currency: "USDC", description: "test" },
      { userKey: USER_KEY, idempotencyKey: IDEMPOTENCY_KEY }
    );

    expect(result.reused).toBe(true);
  });

  it("throws PulsarpayBadRequestError on currency mismatch (400)", async () => {
    mockFetch(mockJsonResponse({ error: "currency mismatch" }, 400));

    const client = makeClient();
    await expect(
      client.payments.createCharge(
        { amount: 0.5, currency: "USDT", description: "test" },
        { userKey: USER_KEY }
      )
    ).rejects.toThrow(PulsarpayBadRequestError);
  });

  it("throws PulsarpayInsufficientFundsError on 402", async () => {
    mockFetch(mockJsonResponse({ error: "insufficient funds" }, 402));

    const client = makeClient();
    await expect(
      client.payments.createCharge(
        { amount: 999, currency: "USDC", description: "big charge" },
        { userKey: USER_KEY }
      )
    ).rejects.toThrow(PulsarpayInsufficientFundsError);
  });

  it("throws PulsarpayUnauthorizedError on invalid agent key (401)", async () => {
    mockFetch(mockJsonResponse({ error: "invalid agent key" }, 401));

    const client = makeClient();
    await expect(
      client.payments.createCharge(
        { amount: 0.5, currency: "USDC", description: "test" },
        { userKey: USER_KEY }
      )
    ).rejects.toThrow(PulsarpayUnauthorizedError);
  });
});

// ─────────────────────────────────────────────────────────────
// getCharge
// ─────────────────────────────────────────────────────────────

describe("payments.getCharge()", () => {
  it("returns a ChargeItem on success", async () => {
    mockFetch(mockJsonResponse(fixtures.chargeItem));

    const client = makeClient();
    const result = await client.payments.getCharge("cmnf6jwup00091rcvo4qevr42");

    expect(result.id).toBe("cmnf6jwup00091rcvo4qevr42");
    expect(result.status).toBe("SUCCESS");
    expect(result.currency).toBe("USDC");
    expect(result.amount).toBe(0.5);
  });

  it("sends GET to /api/v1/agents/charge/:id with x-agent-key header", async () => {
    const fetchMock = mockFetch(mockJsonResponse(fixtures.chargeItem));

    const client = makeClient();
    await client.payments.getCharge("cmnf6jwup00091rcvo4qevr42");

    const [url, options] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/agents/charge/cmnf6jwup00091rcvo4qevr42");
    expect(options.method).toBe("GET");
    const headers = options.headers as Record<string, string>;
    expect(headers["x-agent-key"]).toBe(AGENT_KEY);
  });

  it("URL-encodes the charge ID", async () => {
    const fetchMock = mockFetch(mockJsonResponse(fixtures.chargeItem));

    const client = makeClient();
    await client.payments.getCharge("id with spaces");

    const [url] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toContain("id%20with%20spaces");
  });

  it("throws PulsarpayNotFoundError when charge does not exist (404)", async () => {
    mockFetch(mockJsonResponse({ error: "charge not found" }, 404));

    const client = makeClient();
    await expect(
      client.payments.getCharge("nonexistent-id")
    ).rejects.toThrow(PulsarpayNotFoundError);
  });

  it("throws PulsarpayUnauthorizedError on invalid agent key (401)", async () => {
    mockFetch(mockJsonResponse({ error: "invalid agent key" }, 401));

    const client = makeClient();
    await expect(
      client.payments.getCharge("some-id")
    ).rejects.toThrow(PulsarpayUnauthorizedError);
  });
});

// ─────────────────────────────────────────────────────────────
// listCharges
// ─────────────────────────────────────────────────────────────

describe("payments.listCharges()", () => {
  it("returns paginated charge list on success", async () => {
    mockFetch(mockJsonResponse(fixtures.chargeList));

    const client = makeClient();
    const result = await client.payments.listCharges();

    expect(result.data).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.totalPages).toBe(1);
  });

  it("sends page and limit as query params", async () => {
    const fetchMock = mockFetch(mockJsonResponse(fixtures.chargeList));

    const client = makeClient();
    await client.payments.listCharges({ page: 3, limit: 10 });

    const [url] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toContain("page=3");
    expect(url).toContain("limit=10");
  });

  it("works with no options (uses API defaults)", async () => {
    const fetchMock = mockFetch(mockJsonResponse(fixtures.chargeList));

    const client = makeClient();
    await client.payments.listCharges();

    const [url] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).not.toContain("page=");
    expect(url).not.toContain("limit=");
  });

  it("sends x-agent-key header", async () => {
    const fetchMock = mockFetch(mockJsonResponse(fixtures.chargeList));

    const client = makeClient();
    await client.payments.listCharges();

    const [, options] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers["x-agent-key"]).toBe(AGENT_KEY);
  });

  it("throws PulsarpayUnauthorizedError on 401", async () => {
    mockFetch(mockJsonResponse({ error: "invalid or disabled agent key" }, 401));

    const client = makeClient();
    await expect(client.payments.listCharges()).rejects.toThrow(
      PulsarpayUnauthorizedError
    );
  });
});

// ─────────────────────────────────────────────────────────────
// getEarnings
// ─────────────────────────────────────────────────────────────

describe("payments.getEarnings()", () => {
  it("returns earnings summary on success", async () => {
    mockFetch(mockJsonResponse(fixtures.earnings));

    const client = makeClient();
    const result = await client.payments.getEarnings();

    expect(result.earnings).toHaveLength(2);
    expect(result.earnings[0].currency).toBe("USDC");
    expect(result.earnings[0].totalEarned).toBe(1550.75);
    expect(result.earnings[0].totalCharges).toBe(142);
    expect(result.earnings[0].currentBalance).toBe(18.889);
    expect(result.earnings[1].currency).toBe("USD");
  });

  it("sends GET to /api/v1/agents/earnings with x-agent-key", async () => {
    const fetchMock = mockFetch(mockJsonResponse(fixtures.earnings));

    const client = makeClient();
    await client.payments.getEarnings();

    const [url, options] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/agents/earnings");
    expect(options.method).toBe("GET");
    const headers = options.headers as Record<string, string>;
    expect(headers["x-agent-key"]).toBe(AGENT_KEY);
  });

  it("throws PulsarpayUnauthorizedError when agent is disabled (401)", async () => {
    mockFetch(
      mockJsonResponse({ error: "invalid or disabled agent key" }, 401)
    );

    const client = makeClient();
    await expect(client.payments.getEarnings()).rejects.toThrow(
      PulsarpayUnauthorizedError
    );
  });
});

// ─────────────────────────────────────────────────────────────
// withdraw
// ─────────────────────────────────────────────────────────────

describe("payments.listWithdrawals()", () => {
  it("returns a list of payouts when no payoutId is provided", async () => {
    mockFetch(mockJsonResponse(fixtures.payoutList));

    const client = makeClient();
    const result = await client.payments.listWithdrawals() as { payouts: typeof fixtures.payoutList.payouts };

    expect(result.payouts).toHaveLength(1);
    expect(result.payouts[0].id).toBe("cmoqbpavp00071ry1t2iyr1hw");
    expect(result.payouts[0].status).toBe("COMPLETED");
    expect(result.payouts[0].amount).toBe(97);
  });

  it("returns a single payout when payoutId is provided", async () => {
    mockFetch(mockJsonResponse({ payout: fixtures.payoutItem }));

    const client = makeClient();
    const result = await client.payments.listWithdrawals({
      payoutId: "cmoqbpavp00071ry1t2iyr1hw",
    }) as { payout: typeof fixtures.payoutItem };

    expect(result.payout.id).toBe("cmoqbpavp00071ry1t2iyr1hw");
    expect(result.payout.destination.network).toBe("SOL");
    expect(result.payout.fee).toBe(3);
    expect(result.payout.platformFeeRate).toBe("3%");
  });

  it("sends payoutId as a query param when provided", async () => {
    const fetchMock = mockFetch(mockJsonResponse({ payout: fixtures.payoutItem }));

    const client = makeClient();
    await client.payments.listWithdrawals({ payoutId: "cmoqbpavp00071ry1t2iyr1hw" });

    const [url] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toContain("payoutId=cmoqbpavp00071ry1t2iyr1hw");
  });

  it("does not send payoutId query param when omitted", async () => {
    const fetchMock = mockFetch(mockJsonResponse(fixtures.payoutList));

    const client = makeClient();
    await client.payments.listWithdrawals();

    const [url] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).not.toContain("payoutId");
  });

  it("sends GET to /api/v1/agents/withdraw with x-agent-key", async () => {
    const fetchMock = mockFetch(mockJsonResponse(fixtures.payoutList));

    const client = makeClient();
    await client.payments.listWithdrawals();

    const [url, options] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/agents/withdraw");
    expect(options.method).toBe("GET");
    const headers = options.headers as Record<string, string>;
    expect(headers["x-agent-key"]).toBe(AGENT_KEY);
  });

  it("throws PulsarpayUnauthorizedError on invalid agent (401)", async () => {
    mockFetch(mockJsonResponse({ error: "invalid agent" }, 401));

    const client = makeClient();
    await expect(client.payments.listWithdrawals()).rejects.toThrow(
      PulsarpayUnauthorizedError
    );
  });
});

// ─────────────────────────────────────────────────────────────
// withdraw
// ─────────────────────────────────────────────────────────────

describe("payments.withdraw()", () => {
  it("returns withdrawal result with breakdown on success", async () => {
    mockFetch(mockJsonResponse(fixtures.withdrawal));

    const client = makeClient();
    const result = await client.payments.withdraw({
      amount: 100,
      currency: "USDC",
      walletAddress: "8ixbQzsFc9FkxegG7aumq3h1XCGDkRSN23xeLTnZiyHr",
    });

    expect(result.success).toBe(true);
    expect(result.payoutId).toBe("cmoqbpavp00071ry1t2iyr1hw");
    expect(result.breakdown.grossAmount).toBe(100);
    expect(result.breakdown.platformFee).toBe(3);
    expect(result.breakdown.netAmount).toBe(97);
    expect(result.breakdown.platformFeeRate).toBe("3%");
    expect(result.breakdown.network).toBe("SOL");
  });

  it("sends x-agent-key and Idempotency-Key headers", async () => {
    const fetchMock = mockFetch(mockJsonResponse(fixtures.withdrawal));

    const client = makeClient();
    await client.payments.withdraw(
      { amount: 100, currency: "USDC", walletAddress: "8ixbQzsFc9FkxegG7aumq3h1XCGDkRSN23xeLTnZiyHr" },
      { idempotencyKey: IDEMPOTENCY_KEY }
    );

    const [, options] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers["x-agent-key"]).toBe(AGENT_KEY);
    expect(headers["Idempotency-Key"]).toBe(IDEMPOTENCY_KEY);
  });

  it("auto-generates idempotency key when not provided", async () => {
    const fetchMock = mockFetch(mockJsonResponse(fixtures.withdrawal));

    const client = makeClient();
    await client.payments.withdraw({
      amount: 50,
      currency: "USDC",
      walletAddress: "8ixbQzsFc9FkxegG7aumq3h1XCGDkRSN23xeLTnZiyHr",
    });

    const [, options] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers["Idempotency-Key"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("sends correct body to POST /api/v1/agents/withdraw", async () => {
    const fetchMock = mockFetch(mockJsonResponse(fixtures.withdrawal));

    const client = makeClient();
    const payload = {
      amount: 200,
      currency: "USDC" as const,
      walletAddress: "8ixbQzsFc9FkxegG7aumq3h1XCGDkRSN23xeLTnZiyHr",
    };
    await client.payments.withdraw(payload);

    const [url, options] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/agents/withdraw");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body as string)).toEqual(payload);
  });

  it("throws PulsarpayBadRequestError on insufficient balance (400)", async () => {
    mockFetch(mockJsonResponse({ error: "insufficient balance" }, 400));

    const client = makeClient();
    await expect(
      client.payments.withdraw({ amount: 9999, currency: "USDC", walletAddress: "valid-wallet" })
    ).rejects.toThrow(PulsarpayBadRequestError);
  });

  it("throws PulsarpayBadRequestError on invalid Solana address (400)", async () => {
    mockFetch(mockJsonResponse({ error: "invalid solana address" }, 400));

    const client = makeClient();
    await expect(
      client.payments.withdraw({ amount: 10, currency: "USDC", walletAddress: "not-a-solana-address" })
    ).rejects.toThrow(PulsarpayBadRequestError);
  });

  it("throws PulsarpayUnauthorizedError on invalid agent (401)", async () => {
    mockFetch(mockJsonResponse({ error: "invalid agent" }, 401));

    const client = makeClient();
    await expect(
      client.payments.withdraw({
        amount: 10,
        currency: "USDC",
        walletAddress: "8ixbQzsFc9FkxegG7aumq3h1XCGDkRSN23xeLTnZiyHr",
      })
    ).rejects.toThrow(PulsarpayUnauthorizedError);
  });
});
