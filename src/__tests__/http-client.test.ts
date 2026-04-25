// ─────────────────────────────────────────────
// Pulsarpay SDK — HttpClient Tests
// ─────────────────────────────────────────────

import { describe, it, expect, afterEach, vi } from "vitest";
import { HttpClient } from "../http-client";
import {
  PulsarpayBadRequestError,
  PulsarpayUnauthorizedError,
  PulsarpayInsufficientFundsError,
  PulsarpayNotFoundError,
  PulsarpayConflictError,
  PulsarpayNetworkError,
  PulsarpayError,
} from "../errors/index";
import {
  mockJsonResponse,
  mockTextResponse,
  mockFetch,
  mockFetchNetworkError,
  mockFetchAbort,
} from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
});

const BASE_URL = "https://www.pulsarpay.io";
const TIMEOUT = 5000;

function makeClient() {
  return new HttpClient(BASE_URL, TIMEOUT);
}

describe("HttpClient — successful requests", () => {
  it("makes a GET request and returns parsed JSON", async () => {
    const payload = { currency: "USDC", totalEarned: 100, totalCharges: 5 };
    mockFetch(mockJsonResponse(payload));

    const client = makeClient();
    const result = await client.request({ method: "GET", path: "/api/v1/agents/earnings" });

    expect(result).toEqual(payload);
  });

  it("makes a POST request with body and returns parsed JSON", async () => {
    const payload = { success: true, chargeId: "abc123", reused: false };
    const fetchMock = mockFetch(mockJsonResponse(payload));

    const client = makeClient();
    const body = { amount: 1.0, currency: "USDC", description: "test" };
    const result = await client.request({
      method: "POST",
      path: "/api/v1/agents/charges",
      body,
    });

    expect(result).toEqual(payload);
    const [, options] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body as string)).toEqual(body);
  });

  it("appends query parameters to the URL", async () => {
    const fetchMock = mockFetch(mockJsonResponse({ data: [], pagination: {} }));

    const client = makeClient();
    await client.request({
      method: "GET",
      path: "/api/v1/agents/charges",
      query: { page: 2, limit: 20 },
    });

    const [url] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toContain("page=2");
    expect(url).toContain("limit=20");
  });

  it("skips undefined query parameters", async () => {
    const fetchMock = mockFetch(mockJsonResponse({ data: [], pagination: {} }));

    const client = makeClient();
    await client.request({
      method: "GET",
      path: "/api/v1/agents/charges",
      query: { page: undefined, limit: 50 },
    });

    const [url] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).not.toContain("page=");
    expect(url).toContain("limit=50");
  });

  it("sends custom headers alongside default headers", async () => {
    const fetchMock = mockFetch(mockJsonResponse({ ok: true }));

    const client = makeClient();
    await client.request({
      method: "GET",
      path: "/test",
      headers: { "x-agent-key": "ag_live_abc" },
    });

    const [, options] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers["x-agent-key"]).toBe("ag_live_abc");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["Accept"]).toBe("application/json");
  });

  it("handles non-JSON (text) responses on success", async () => {
    mockFetch(mockTextResponse("OK"));

    const client = makeClient();
    const result = await client.request({ method: "GET", path: "/health" });
    expect(result).toBe("OK");
  });

  it("strips trailing slash from baseUrl", async () => {
    const fetchMock = mockFetch(mockJsonResponse({}));
    const client = new HttpClient("https://www.pulsarpay.io/", TIMEOUT);

    await client.request({ method: "GET", path: "/api/v1/test" });

    const [url] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toBe("https://www.pulsarpay.io/api/v1/test");
  });

  it("sends no body when body is undefined", async () => {
    const fetchMock = mockFetch(mockJsonResponse({}));
    const client = makeClient();

    await client.request({ method: "GET", path: "/api/v1/test" });

    const [, options] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(options.body).toBeUndefined();
  });
});

describe("HttpClient — HTTP error mapping", () => {
  it("throws PulsarpayBadRequestError on 400", async () => {
    mockFetch(mockJsonResponse({ error: "currency mismatch" }, 400));

    const client = makeClient();
    await expect(
      client.request({ method: "POST", path: "/api/v1/agents/charges" })
    ).rejects.toThrow(PulsarpayBadRequestError);
  });

  it("throws PulsarpayUnauthorizedError on 401", async () => {
    mockFetch(mockJsonResponse({ error: "invalid agent key" }, 401));

    const client = makeClient();
    await expect(
      client.request({ method: "GET", path: "/api/v1/agents/earnings" })
    ).rejects.toThrow(PulsarpayUnauthorizedError);
  });

  it("throws PulsarpayInsufficientFundsError on 402", async () => {
    mockFetch(mockJsonResponse({ error: "insufficient funds" }, 402));

    const client = makeClient();
    await expect(
      client.request({ method: "POST", path: "/api/v1/agents/charges" })
    ).rejects.toThrow(PulsarpayInsufficientFundsError);
  });

  it("throws PulsarpayNotFoundError on 404", async () => {
    mockFetch(mockJsonResponse({ error: "charge not found" }, 404));

    const client = makeClient();
    await expect(
      client.request({ method: "GET", path: "/api/v1/agents/charge/bad-id" })
    ).rejects.toThrow(PulsarpayNotFoundError);
  });

  it("throws PulsarpayConflictError on 409", async () => {
    mockFetch(mockJsonResponse({ error: "Agent name already exists. Please choose a different one." }, 409));

    const client = makeClient();
    await expect(
      client.request({ method: "POST", path: "/api/v1/agents/register" })
    ).rejects.toThrow(PulsarpayConflictError);
  });

  it("throws generic PulsarpayError on unhandled status codes (e.g. 500)", async () => {
    mockFetch(mockJsonResponse({ error: "internal server error" }, 500));

    const client = makeClient();
    const err = await client
      .request({ method: "GET", path: "/api/v1/test" })
      .catch((e) => e);

    expect(err).toBeInstanceOf(PulsarpayError);
    expect(err).not.toBeInstanceOf(PulsarpayBadRequestError);
    expect(err.statusCode).toBe(500);
  });

  it("uses HTTP status code as message fallback when no error field in body", async () => {
    mockFetch(new Response(JSON.stringify({}), { status: 500, headers: { "Content-Type": "application/json" } }));

    const client = makeClient();
    const err = await client
      .request({ method: "GET", path: "/test" })
      .catch((e) => e);

    expect(err.message).toContain("HTTP 500");
  });

  it("attaches raw response body to the error", async () => {
    const body = { error: "invalid agent key" };
    mockFetch(mockJsonResponse(body, 401));

    const client = makeClient();
    const err = await client
      .request({ method: "GET", path: "/test" })
      .catch((e) => e);

    expect(err.raw).toEqual(body);
    expect(err.message).toBe("invalid agent key");
  });
});

describe("HttpClient — network and timeout errors", () => {
  it("throws PulsarpayNetworkError on fetch rejection (network failure)", async () => {
    mockFetchNetworkError("Failed to fetch");

    const client = makeClient();
    await expect(
      client.request({ method: "GET", path: "/api/v1/test" })
    ).rejects.toThrow(PulsarpayNetworkError);
  });

  it("includes original error in PulsarpayNetworkError.raw", async () => {
    mockFetchNetworkError("Failed to fetch");

    const client = makeClient();
    const err = await client
      .request({ method: "GET", path: "/test" })
      .catch((e) => e);

    expect(err).toBeInstanceOf(PulsarpayNetworkError);
    expect(err.raw).toBeInstanceOf(TypeError);
  });

  it("throws PulsarpayNetworkError with timeout message on AbortError", async () => {
    mockFetchAbort();

    const client = makeClient();
    const err = await client
      .request({ method: "GET", path: "/test" })
      .catch((e) => e);

    expect(err).toBeInstanceOf(PulsarpayNetworkError);
    expect(err.message).toContain(`${TIMEOUT}ms`);
  });
});
