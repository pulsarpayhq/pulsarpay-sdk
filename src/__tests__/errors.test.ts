// ─────────────────────────────────────────────
// Pulsarpay SDK — Error Classes Tests
// ─────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import {
  PulsarpayError,
  PulsarpayBadRequestError,
  PulsarpayUnauthorizedError,
  PulsarpayInsufficientFundsError,
  PulsarpayNotFoundError,
  PulsarpayConflictError,
  PulsarpayNetworkError,
} from "../errors/index";

describe("PulsarpayError (base)", () => {
  it("sets message, statusCode and raw correctly", () => {
    const raw = { error: "something went wrong" };
    const err = new PulsarpayError("something went wrong", 500, raw);

    expect(err.message).toBe("something went wrong");
    expect(err.statusCode).toBe(500);
    expect(err.raw).toBe(raw);
    expect(err.name).toBe("PulsarpayError");
  });

  it("is an instance of Error", () => {
    const err = new PulsarpayError("oops");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PulsarpayError);
  });

  it("works without statusCode or raw", () => {
    const err = new PulsarpayError("bare error");
    expect(err.statusCode).toBeUndefined();
    expect(err.raw).toBeUndefined();
  });
});

describe("PulsarpayBadRequestError", () => {
  it("has statusCode 400 and correct name", () => {
    const err = new PulsarpayBadRequestError("currency mismatch");
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe("PulsarpayBadRequestError");
    expect(err).toBeInstanceOf(PulsarpayError);
    expect(err).toBeInstanceOf(PulsarpayBadRequestError);
  });
});

describe("PulsarpayUnauthorizedError", () => {
  it("has statusCode 401 and correct name", () => {
    const err = new PulsarpayUnauthorizedError("invalid agent key");
    expect(err.statusCode).toBe(401);
    expect(err.name).toBe("PulsarpayUnauthorizedError");
    expect(err).toBeInstanceOf(PulsarpayError);
  });
});

describe("PulsarpayInsufficientFundsError", () => {
  it("has statusCode 402 and correct name", () => {
    const err = new PulsarpayInsufficientFundsError("insufficient funds");
    expect(err.statusCode).toBe(402);
    expect(err.name).toBe("PulsarpayInsufficientFundsError");
    expect(err).toBeInstanceOf(PulsarpayError);
  });
});

describe("PulsarpayNotFoundError", () => {
  it("has statusCode 404 and correct name", () => {
    const err = new PulsarpayNotFoundError("charge not found");
    expect(err.statusCode).toBe(404);
    expect(err.name).toBe("PulsarpayNotFoundError");
    expect(err).toBeInstanceOf(PulsarpayError);
  });
});

describe("PulsarpayConflictError", () => {
  it("has statusCode 409 and correct name", () => {
    const err = new PulsarpayConflictError("agent name already exists");
    expect(err.statusCode).toBe(409);
    expect(err.name).toBe("PulsarpayConflictError");
    expect(err).toBeInstanceOf(PulsarpayError);
  });
});

describe("PulsarpayNetworkError", () => {
  it("has no statusCode and correct name", () => {
    const err = new PulsarpayNetworkError("Failed to fetch");
    expect(err.statusCode).toBeUndefined();
    expect(err.name).toBe("PulsarpayNetworkError");
    expect(err).toBeInstanceOf(PulsarpayError);
  });

  it("stores the original error in raw", () => {
    const cause = new TypeError("fetch failed");
    const err = new PulsarpayNetworkError("Network error", cause);
    expect(err.raw).toBe(cause);
  });
});
